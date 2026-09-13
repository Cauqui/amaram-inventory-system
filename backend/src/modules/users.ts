import { Prisma, UserRole } from "../generated/prisma/client.js";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { hashPassword, validatePassword } from "../security/password.js";

const router = Router();
const MAX_SERIALIZABLE_RETRIES = 3;

router.use(requireAuth, requireRole("ADMIN"));

const safe = { id: true, name: true, email: true, role: true, active: true, createdAt: true, updatedAt: true } as const;
const create = z.object({ name: z.string().trim().min(1).max(150), email: z.string().trim().toLowerCase().email(), password: z.string(), confirmPassword: z.string(), role: z.nativeEnum(UserRole), active: z.boolean().optional() }).strict();
const update = z.object({ name: z.string().trim().min(1).max(150).optional(), email: z.string().trim().toLowerCase().email().optional(), role: z.nativeEnum(UserRole).optional(), active: z.boolean().optional() }).strict();
const fail = (response: any, status: number, error: string) => response.status(status).json({ error });

function isSerializationConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2034";
}

async function runSerializableTransaction<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_SERIALIZABLE_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      lastError = error;
      if (!isSerializationConflict(error) || attempt === MAX_SERIALIZABLE_RETRIES - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
    }
  }

  throw lastError;
}

router.get("/", async (_request, response, next) => {
  try {
    response.json({ users: await prisma.user.findMany({ select: safe, orderBy: { createdAt: "desc" } }) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (request, response, next) => {
  const parsed = create.safeParse(request.body);
  if (!parsed.success) return fail(response, 400, "Invalid request data.");
  if (parsed.data.password !== parsed.data.confirmPassword) return fail(response, 400, "Passwords do not match.");
  const passwordMessage = validatePassword(parsed.data.password, parsed.data.email);
  if (passwordMessage) return fail(response, 400, passwordMessage);

  try {
    const user = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({ data: { name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password), role: parsed.data.role, active: parsed.data.active ?? true }, select: safe });
      await transaction.userAuditLog.create({ data: { actorUserId: request.authUser!.id, targetUserId: user.id, action: "USER_CREATED", metadata: { name: user.name, email: user.email, role: user.role, active: user.active } } });
      return user;
    });
    response.status(201).json({ user });
  } catch (error: any) {
    if (error.code === "P2002") return fail(response, 409, "Email already exists.");
    next(error);
  }
});

router.get("/:id", async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: request.params.id }, select: safe });
    return user ? response.json({ user }) : fail(response, 404, "User not found.");
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (request, response, next) => {
  const parsed = update.safeParse(request.body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) return fail(response, 400, "Invalid request data.");

  try {
    const user = await runSerializableTransaction(async (transaction) => {
      const previousUser = await transaction.user.findUnique({ where: { id: request.params.id } });
      if (!previousUser) throw new Error("NOT_FOUND");

      const nextRole = parsed.data.role ?? previousUser.role;
      const nextActive = parsed.data.active ?? previousUser.active;
      if (previousUser.id === request.authUser!.id && previousUser.active && !nextActive) throw new Error("SELF_DEACTIVATE");

      const removesActiveAdmin = previousUser.role === "ADMIN" && previousUser.active && (nextRole !== "ADMIN" || !nextActive);
      if (removesActiveAdmin) {
        const activeAdminCount = await transaction.user.count({ where: { role: "ADMIN", active: true } });
        if (activeAdminCount <= 1) throw new Error("LAST_ADMIN");
      }

      const user = await transaction.user.update({ where: { id: previousUser.id }, data: parsed.data, select: safe });
      const profileChanges: Record<string, { from: string; to: string }> = {};
      for (const key of ["name", "email"] as const) {
        if (parsed.data[key] !== undefined && parsed.data[key] !== previousUser[key]) {
          profileChanges[key] = { from: previousUser[key], to: parsed.data[key] };
        }
      }

      if (Object.keys(profileChanges).length) {
        await transaction.userAuditLog.create({ data: { actorUserId: request.authUser!.id, targetUserId: previousUser.id, action: "USER_UPDATED", metadata: { changes: profileChanges } } });
      }
      if (nextRole !== previousUser.role) {
        await transaction.userAuditLog.create({ data: { actorUserId: request.authUser!.id, targetUserId: previousUser.id, action: "ROLE_CHANGED", metadata: { from: previousUser.role, to: nextRole } } });
      }
      if (nextActive !== previousUser.active) {
        await transaction.userAuditLog.create({ data: { actorUserId: request.authUser!.id, targetUserId: previousUser.id, action: nextActive ? "USER_ACTIVATED" : "USER_DEACTIVATED" } });
      }

      return user;
    });

    response.json({ user });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") return fail(response, 404, "User not found.");
    if (error.message === "SELF_DEACTIVATE") return fail(response, 400, "No puedes desactivar tu propia cuenta.");
    if (error.message === "LAST_ADMIN") return fail(response, 400, "Debe existir al menos un administrador activo.");
    if (error.code === "P2002") return fail(response, 409, "Email already exists.");
    if (isSerializationConflict(error)) return fail(response, 409, "No se pudo completar la actualización por un conflicto concurrente. Inténtalo nuevamente.");
    next(error);
  }
});

router.post("/:id/reset-password", async (request, response, next) => {
  const parsed = z.object({ password: z.string(), confirmPassword: z.string() }).safeParse(request.body);
  if (!parsed.success || parsed.data.password !== parsed.data.confirmPassword) return fail(response, 400, "Passwords do not match.");

  try {
    const user = await prisma.user.findUnique({ where: { id: request.params.id } });
    if (!user) return fail(response, 404, "User not found.");
    const passwordMessage = validatePassword(parsed.data.password, user.email);
    if (passwordMessage) return fail(response, 400, passwordMessage);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
      prisma.userAuditLog.create({ data: { actorUserId: request.authUser!.id, targetUserId: user.id, action: "PASSWORD_RESET", metadata: { reason: "admin_reset" } } }),
    ]);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/:id/audit-logs", async (request, response, next) => {
  try {
    const logs = await prisma.userAuditLog.findMany({ where: { targetUserId: request.params.id }, orderBy: { createdAt: "desc" }, select: { id: true, action: true, metadata: true, createdAt: true, actorUser: { select: { id: true, name: true, email: true } }, targetUser: { select: { id: true, name: true, email: true } } } });
    response.json({ logs });
  } catch (error) {
    next(error);
  }
});

export { router as usersRouter };