import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const allowedRoles = requireRole("ADMIN", "INVENTORY");
const uuid = z.string().uuid();
const common = {
  variantId: uuid,
  reason: z.string().trim().min(1).max(1_000),
  idempotencyKey: z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9._:-]+$/),
};
const createInput = z.discriminatedUnion("type", [
  z.object({ ...common, type: z.literal("ENTRY"), quantity: z.number().int().positive() }).strict(),
  z.object({ ...common, type: z.literal("EXIT"), quantity: z.number().int().positive() }).strict(),
  z.object({ ...common, type: z.literal("ADJUSTMENT"), targetStock: z.number().int().min(0) }).strict(),
]);
const listQuery = z.object({
  type: z.enum(["ENTRY", "EXIT", "ADJUSTMENT"]).optional(),
  variantId: uuid.optional(),
  productId: uuid.optional(),
  from: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  to: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to);

const movementSelect = {
  id: true, idempotencyKey: true, type: true, quantity: true, stockBefore: true,
  stockAfter: true, reason: true, createdAt: true, userId: true,
  variant: { select: {
    id: true, sku: true, size: true, color: true,
    product: { select: { id: true, skuBase: true, name: true } },
  } },
  user: { select: { id: true, name: true, email: true } },
} as const;

type MovementRecord = Awaited<ReturnType<typeof findMovement>>;
type CreateData = z.infer<typeof createInput>;
type LockedVariant = { id: string; stock: number; active: boolean; productId: string; productActive: boolean };

class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function isPrismaCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function findMovement(idempotencyKey: string) {
  return prisma.inventoryMovement.findUnique({ where: { idempotencyKey }, select: movementSelect });
}

function movementDto(record: NonNullable<MovementRecord>) {
  const { product, ...variant } = record.variant;
  const { userId: _userId, ...movement } = record;
  return { ...movement, variant, product };
}

function matchesRequest(record: NonNullable<MovementRecord>, input: CreateData, userId: string) {
  if (record.userId !== userId || record.variant.id !== input.variantId || record.type !== input.type || record.reason !== input.reason) return false;
  return input.type === "ADJUSTMENT" ? record.stockAfter === input.targetStock : record.quantity === input.quantity;
}

function replayOrConflict(record: NonNullable<MovementRecord>, input: CreateData, userId: string, response: Response) {
  if (!matchesRequest(record, input, userId)) {
    return response.status(409).json({ error: "Idempotency key is already used by another operation." });
  }
  return response.status(200).json({ movement: movementDto(record), replayed: true });
}

router.post("/", requireAuth, allowedRoles, async (request, response, next) => {
  const parsed = createInput.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Invalid request data." });
  const input = parsed.data;
  try {
    const previous = await findMovement(input.idempotencyKey);
    if (previous) return replayOrConflict(previous, input, request.authUser!.id, response);

    const movement = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<LockedVariant[]>`
        SELECT pv."id", pv."stock", pv."active",
               p."id" AS "productId", p."active" AS "productActive"
        FROM "product_variants" pv
        JOIN "products" p ON p."id" = pv."product_id"
        WHERE pv."id" = ${input.variantId}::uuid
        FOR UPDATE OF pv, p
      `;
      const variant = rows[0];
      if (!variant) throw new HttpError(404, "Product variant not found.");
      if (!variant.active || !variant.productActive) throw new HttpError(409, "Product and variant must be active.");

      const lockedReplay = await tx.inventoryMovement.findUnique({
        where: { idempotencyKey: input.idempotencyKey }, select: movementSelect,
      });
      if (lockedReplay) {
        if (!matchesRequest(lockedReplay, input, request.authUser!.id)) {
          throw new HttpError(409, "Idempotency key is already used by another operation.");
        }
        return { record: lockedReplay, replayed: true };
      }

      const stockBefore = variant.stock;
      let quantity: number;
      let stockAfter: number;
      if (input.type === "ENTRY") {
        quantity = input.quantity; stockAfter = stockBefore + quantity;
      } else if (input.type === "EXIT") {
        if (input.quantity > stockBefore) throw new HttpError(422, "Insufficient stock.");
        quantity = input.quantity; stockAfter = stockBefore - quantity;
      } else {
        stockAfter = input.targetStock; quantity = stockAfter - stockBefore;
        if (quantity === 0) throw new HttpError(400, "Adjustment must change stock.");
      }

      await tx.productVariant.update({ where: { id: variant.id }, data: { stock: stockAfter } });
      const record = await tx.inventoryMovement.create({
        data: {
          idempotencyKey: input.idempotencyKey, variantId: variant.id,
          userId: request.authUser!.id, type: input.type, quantity,
          stockBefore, stockAfter, reason: input.reason,
        },
        select: movementSelect,
      });
      return { record, replayed: false };
    });
    return response.status(movement.replayed ? 200 : 201).json({ movement: movementDto(movement.record), replayed: movement.replayed });
  } catch (error) {
    if (error instanceof HttpError) return response.status(error.status).json({ error: error.message });
    if (isPrismaCode(error, "P2002")) {
      const existing = await findMovement(input.idempotencyKey);
      if (existing) return replayOrConflict(existing, input, request.authUser!.id, response);
      return response.status(409).json({ error: "Movement conflict." });
    }
    return next(error);
  }
});

router.get("/", requireAuth, allowedRoles, async (request, response, next) => {
  const parsed = listQuery.safeParse(request.query);
  if (!parsed.success) return response.status(400).json({ error: "Invalid query parameters." });
  const { type, variantId, productId, from, to } = parsed.data;
  try {
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        ...(type ? { type } : {}), ...(variantId ? { variantId } : {}),
        ...(productId ? { variant: { productId } } : {}),
        ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      select: movementSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return response.status(200).json({ movements: movements.map(movementDto) });
  } catch (error) { return next(error); }
});

router.get("/:id", requireAuth, allowedRoles, async (request, response, next) => {
  const id = uuid.safeParse(request.params.id);
  if (!id.success) return response.status(400).json({ error: "Invalid movement id." });
  try {
    const movement = await prisma.inventoryMovement.findUnique({ where: { id: id.data }, select: movementSelect });
    if (!movement) return response.status(404).json({ error: "Inventory movement not found." });
    return response.status(200).json({ movement: movementDto(movement) });
  } catch (error) { return next(error); }
});

export { router as inventoryMovementsRouter };
