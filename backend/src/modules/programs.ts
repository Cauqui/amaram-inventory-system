import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const programFields = {
  id: true,
  name: true,
  description: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

const description = z.string().trim().max(10_000).nullable().optional();
const createSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description,
}).strict();
const updateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  description,
  active: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

router.get("/", requireAuth, async (_request, response, next) => {
  try {
    const programs = await prisma.program.findMany({
      select: programFields,
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
    return response.status(200).json({ programs });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, requireRole("ADMIN"), async (request, response, next) => {
  const parsed = createSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Invalid request data." });

  try {
    const program = await prisma.program.create({ data: parsed.data, select: programFields });
    return response.status(201).json({ program });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", requireAuth, requireRole("ADMIN"), async (request, response, next) => {
  const id = z.string().uuid().safeParse(request.params.id);
  const parsed = updateSchema.safeParse(request.body);
  if (!id.success || !parsed.success) return response.status(400).json({ error: "Invalid request data." });

  try {
    const program = await prisma.program.update({
      where: { id: id.data }, data: parsed.data, select: programFields,
    });
    return response.status(200).json({ program });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return response.status(404).json({ error: "Program not found." });
    }
    return next(error);
  }
});

export { router as programsRouter };
