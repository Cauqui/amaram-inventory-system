import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const categoryFields = {
  id: true,
  name: true,
  code: true,
  usesSizes: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: { where: { active: true } } } },
} as const;

function categoryDto(category: { _count: { products: number }; id: string; name: string; code: string; usesSizes: boolean; active: boolean; createdAt: Date; updatedAt: Date }) {
  const { _count, ...data } = category;
  return { ...data, productCount: _count.products };
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(20).transform((value) => value.toUpperCase()),
  usesSizes: z.boolean().optional().default(false),
}).strict();

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  code: z.string().trim().min(1).max(20).transform((value) => value.toUpperCase()).optional(),
  usesSizes: z.boolean().optional(),
  active: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

function isUniqueConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

router.get("/", requireAuth, async (_request, response, next) => {
  try {
    const categories = await prisma.category.findMany({
      select: categoryFields,
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
    return response.status(200).json({ categories: categories.map(categoryDto) });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, requireRole("ADMIN"), async (request, response, next) => {
  const parsed = createSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Invalid request data." });

  try {
    const category = await prisma.category.create({ data: parsed.data, select: categoryFields });
    return response.status(201).json({ category: categoryDto(category) });
  } catch (error) {
    if (isUniqueConflict(error)) return response.status(409).json({ error: "Category code already exists." });
    return next(error);
  }
});

router.patch("/:id", requireAuth, requireRole("ADMIN"), async (request, response, next) => {
  const id = z.string().uuid().safeParse(request.params.id);
  const parsed = updateSchema.safeParse(request.body);
  if (!id.success || !parsed.success) return response.status(400).json({ error: "Invalid request data." });

  try {
    const category = await prisma.category.update({
      where: { id: id.data }, data: parsed.data, select: categoryFields,
    });
    return response.status(200).json({ category: categoryDto(category) });
  } catch (error) {
    if (isUniqueConflict(error)) return response.status(409).json({ error: "Category code already exists." });
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return response.status(404).json({ error: "Category not found." });
    }
    return next(error);
  }
});

export { router as categoriesRouter };
