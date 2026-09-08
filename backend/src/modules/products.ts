import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const allowedRoles = requireRole("ADMIN", "INVENTORY");
const uuid = z.string().uuid();
const optionalText = (maximum: number) => z.string().max(maximum).nullable().optional();
const variantInput = z.object({
  size: optionalText(30),
  color: optionalText(80),
  minimumStock: z.number().int().min(0),
}).strict();
const createProductInput = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(100_000),
  history: optionalText(100_000),
  categoryId: uuid,
  programId: uuid,
  creatorName: z.string().trim().min(1).max(150),
  variants: z.array(variantInput).min(1).max(100),
}).strict();
const updateProductInput = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).max(100_000).optional(),
  history: optionalText(100_000),
  programId: uuid.optional(),
  creatorName: z.string().trim().min(1).max(150).optional(),
  active: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);
const updateVariantInput = z.object({
  minimumStock: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);
const listQuery = z.object({
  search: z.string().trim().max(200).optional(),
  categoryId: uuid.optional(),
  programId: uuid.optional(),
  active: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
}).strict();

const productFields = {
  id: true, skuBase: true, name: true, description: true, history: true,
  creatorName: true, active: true, createdAt: true, updatedAt: true,
  category: { select: { id: true, name: true, code: true, usesSizes: true, active: true } },
  program: { select: { id: true, name: true, description: true, active: true } },
  variants: {
    select: { id: true, sku: true, size: true, color: true, stock: true, minimumStock: true, active: true },
    orderBy: { createdAt: "asc" as const },
  },
  images: {
    select: { id: true, publicId: true, secureUrl: true, position: true, width: true, height: true, createdAt: true },
    orderBy: { position: "asc" as const },
  },
} as const;

class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function normalizedVisible(value: string | null | undefined) {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized || null;
}

function alphanumeric(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizeVariant(input: z.infer<typeof variantInput>) {
  const visibleSize = normalizedVisible(input.size)?.toUpperCase() ?? null;
  const color = normalizedVisible(input.color);
  const sizeKey = visibleSize ? alphanumeric(visibleSize) : "UNI";
  const colorKey = color ? alphanumeric(color) : "STD";
  if (!sizeKey || !colorKey) throw new HttpError(400, "Invalid variant data.");
  return { size: visibleSize, color, sizeKey, colorKey, minimumStock: input.minimumStock };
}

function variantSku(skuBase: string, variant: ReturnType<typeof normalizeVariant>) {
  return `${skuBase}-${variant.sizeKey}-${variant.colorKey.slice(0, 3)}`;
}

function validateCategoryVariants(usesSizes: boolean, variants: ReturnType<typeof normalizeVariant>[]) {
  if (usesSizes && variants.some((variant) => variant.size === null)) {
    throw new HttpError(400, "Size is required for this category.");
  }
  if (!usesSizes && variants.some((variant) => variant.size !== null)) {
    throw new HttpError(400, "Size is not allowed for this category.");
  }
  const keys = variants.map((variant) => `${variant.sizeKey}:${variant.colorKey}`);
  if (new Set(keys).size !== keys.length) throw new HttpError(409, "Duplicate product variant.");
}

function isPrismaCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function sendError(error: unknown, response: Parameters<Parameters<typeof router.post>[1]>[1], next: (error: unknown) => void) {
  if (error instanceof HttpError) return response.status(error.status).json({ error: error.message });
  if (isPrismaCode(error, "P2002")) return response.status(409).json({ error: "SKU or variant already exists." });
  return next(error);
}

router.get("/", requireAuth, allowedRoles, async (request, response, next) => {
  const parsed = listQuery.safeParse(request.query);
  if (!parsed.success) return response.status(400).json({ error: "Invalid query parameters." });
  const { search, categoryId, programId, active } = parsed.data;
  try {
    const products = await prisma.product.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}), ...(programId ? { programId } : {}),
        ...(active === undefined ? {} : { active }),
        ...(search ? { OR: [
          { name: { contains: search, mode: "insensitive" } },
          { creatorName: { contains: search, mode: "insensitive" } },
          { skuBase: { contains: search, mode: "insensitive" } },
        ] } : {}),
      },
      select: productFields,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
    return response.status(200).json({ products });
  } catch (error) { return next(error); }
});

router.get("/:id", requireAuth, allowedRoles, async (request, response, next) => {
  const id = uuid.safeParse(request.params.id);
  if (!id.success) return response.status(400).json({ error: "Invalid product id." });
  try {
    const product = await prisma.product.findUnique({ where: { id: id.data }, select: productFields });
    if (!product) return response.status(404).json({ error: "Product not found." });
    return response.status(200).json({ product });
  } catch (error) { return next(error); }
});

router.post("/", requireAuth, allowedRoles, async (request, response, next) => {
  const parsed = createProductInput.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Invalid request data." });
  const variants = parsed.data.variants.map(normalizeVariant);
  try {
    const product = await prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({ where: { id: parsed.data.categoryId } });
      if (!category?.active) throw new HttpError(404, "Active category not found.");
      const program = await tx.program.findUnique({ where: { id: parsed.data.programId } });
      if (!program?.active) throw new HttpError(404, "Active program not found.");
      validateCategoryVariants(category.usesSizes, variants);
      const counter = await tx.skuCounter.upsert({
        where: { categoryId: category.id },
        create: { categoryId: category.id, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      const skuBase = `AMA-${category.code}-${String(counter.lastNumber).padStart(4, "0")}`;
      return tx.product.create({
        data: {
          skuBase, name: parsed.data.name, description: parsed.data.description,
          history: normalizedVisible(parsed.data.history), categoryId: category.id,
          programId: program.id, creatorName: parsed.data.creatorName,
          createdById: request.authUser!.id,
          variants: { create: variants.map((variant) => ({ ...variant, sku: variantSku(skuBase, variant), stock: 0 })) },
        },
        select: productFields,
      });
    });
    return response.status(201).json({ product });
  } catch (error) { return sendError(error, response, next); }
});

router.patch("/:id", requireAuth, allowedRoles, async (request, response, next) => {
  const id = uuid.safeParse(request.params.id);
  const parsed = updateProductInput.safeParse(request.body);
  if (!id.success || !parsed.success) return response.status(400).json({ error: "Invalid request data." });
  try {
    if (parsed.data.programId) {
      const program = await prisma.program.findUnique({ where: { id: parsed.data.programId } });
      if (!program?.active) return response.status(404).json({ error: "Active program not found." });
    }
    const product = await prisma.product.update({
      where: { id: id.data },
      data: { ...parsed.data, history: parsed.data.history === undefined ? undefined : normalizedVisible(parsed.data.history) },
      select: productFields,
    });
    return response.status(200).json({ product });
  } catch (error) {
    if (isPrismaCode(error, "P2025")) return response.status(404).json({ error: "Product not found." });
    return next(error);
  }
});

router.post("/:id/variants", requireAuth, allowedRoles, async (request, response, next) => {
  const id = uuid.safeParse(request.params.id);
  const parsed = variantInput.safeParse(request.body);
  if (!id.success || !parsed.success) return response.status(400).json({ error: "Invalid request data." });
  const variant = normalizeVariant(parsed.data);
  try {
    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: id.data }, include: { category: true } });
      if (!product) throw new HttpError(404, "Product not found.");
      validateCategoryVariants(product.category.usesSizes, [variant]);
      return tx.productVariant.create({
        data: { productId: product.id, ...variant, sku: variantSku(product.skuBase, variant), stock: 0 },
        select: { id: true, sku: true, size: true, color: true, stock: true, minimumStock: true, active: true },
      });
    });
    return response.status(201).json({ variant: created });
  } catch (error) { return sendError(error, response, next); }
});

router.patch("/:productId/variants/:variantId", requireAuth, allowedRoles, async (request, response, next) => {
  const productId = uuid.safeParse(request.params.productId);
  const variantId = uuid.safeParse(request.params.variantId);
  const parsed = updateVariantInput.safeParse(request.body);
  if (!productId.success || !variantId.success || !parsed.success) return response.status(400).json({ error: "Invalid request data." });
  try {
    const existing = await prisma.productVariant.findFirst({ where: { id: variantId.data, productId: productId.data } });
    if (!existing) return response.status(404).json({ error: "Product variant not found." });
    const variant = await prisma.productVariant.update({
      where: { id: existing.id }, data: parsed.data,
      select: { id: true, sku: true, size: true, color: true, stock: true, minimumStock: true, active: true },
    });
    return response.status(200).json({ variant });
  } catch (error) { return next(error); }
});

export { router as productsRouter };
