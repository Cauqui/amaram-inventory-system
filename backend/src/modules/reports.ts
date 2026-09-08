import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const allowedRoles = requireRole("ADMIN", "INVENTORY");
const DAY_MS = 24 * 60 * 60 * 1_000;
const MAX_RANGE_DAYS = 366;

class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function utcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dateText(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDay(value: unknown, field: string): Date | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, `${field} must use YYYY-MM-DD.`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || dateText(parsed) !== value) {
    throw new HttpError(400, `${field} must be a valid date.`);
  }
  return parsed;
}

function reportPeriod(query: Record<string, unknown>) {
  const now = utcDay(new Date());
  const to = parseDay(query.to, "to") ?? now;
  const from = parseDay(query.from, "from") ?? new Date(to.getTime() - 29 * DAY_MS);
  if (from > to) throw new HttpError(400, "from must be before or equal to to.");
  const toExclusive = new Date(to.getTime() + DAY_MS);
  if ((toExclusive.getTime() - from.getTime()) / DAY_MS > MAX_RANGE_DAYS) {
    throw new HttpError(400, "The date range cannot exceed one year.");
  }
  return { from, to, toExclusive };
}

router.get("/inventory", requireAuth, allowedRoles, async (request, response, next) => {
  let period;
  try {
    period = reportPeriod(request.query as Record<string, unknown>);
  } catch (error) {
    if (error instanceof HttpError) return response.status(error.status).json({ error: error.message });
    return next(error);
  }

  try {
    const [totalProducts, activeProducts, totalVariants, variants, movements, categories] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.productVariant.count(),
      prisma.productVariant.findMany({
        where: { active: true, product: { active: true } },
        select: {
          id: true, sku: true, size: true, color: true, stock: true, minimumStock: true,
          product: { select: {
            id: true, name: true, skuBase: true, creatorName: true,
            category: { select: { id: true, name: true } },
            program: { select: { id: true, name: true } },
          } },
        },
        orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
      }),
      prisma.inventoryMovement.findMany({
        where: { createdAt: { gte: period.from, lt: period.toExclusive } },
        select: {
          id: true, createdAt: true, type: true, quantity: true, stockBefore: true, stockAfter: true, reason: true,
          variant: { select: { sku: true, size: true, color: true, product: { select: { name: true, skuBase: true } } } },
          user: { select: { name: true, email: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
      prisma.category.findMany({
        select: {
          id: true, name: true,
          products: { where: { active: true }, select: { variants: { where: { active: true }, select: { id: true, stock: true } } } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const stock = variants.map((variant) => ({
      productId: variant.product.id, productName: variant.product.name, skuBase: variant.product.skuBase,
      categoryName: variant.product.category.name, programName: variant.product.program.name,
      creatorName: variant.product.creatorName, variantId: variant.id, sku: variant.sku,
      size: variant.size, color: variant.color, stock: variant.stock, minimumStock: variant.minimumStock,
      status: variant.stock === 0 ? "OUT_OF_STOCK" : variant.stock <= variant.minimumStock ? "LOW_STOCK" : "AVAILABLE",
    }));
    const lowStock = stock.filter((variant) => variant.status === "LOW_STOCK");
    const outOfStock = stock.filter((variant) => variant.status === "OUT_OF_STOCK");
    const movementSummary = movements.reduce((summary, movement) => {
      if (movement.type === "ENTRY") { summary.entryMovementCount += 1; summary.entryUnits += movement.quantity; }
      else if (movement.type === "EXIT") { summary.exitMovementCount += 1; summary.exitUnits += movement.quantity; }
      else { summary.adjustmentMovementCount += 1; summary.adjustmentNetUnits += movement.quantity; }
      return summary;
    }, { entryMovementCount: 0, exitMovementCount: 0, adjustmentMovementCount: 0, entryUnits: 0, exitUnits: 0, adjustmentNetUnits: 0 });

    const alerts = [...outOfStock, ...lowStock]
      .sort((left, right) => (left.status === right.status ? left.stock - right.stock || left.productName.localeCompare(right.productName) : left.status === "OUT_OF_STOCK" ? -1 : 1))
      .map(({ productName, sku, categoryName, stock: currentStock, minimumStock, status }) => ({ productName, sku, categoryName, stock: currentStock, minimumStock, status }));

    return response.status(200).json({
      period: { from: dateText(period.from), to: dateText(period.to), timezone: "UTC", endInclusive: true },
      summary: {
        totalProducts, activeProducts, totalVariants,
        totalStock: stock.reduce((total, variant) => total + variant.stock, 0),
        lowStockVariants: lowStock.length, outOfStockVariants: outOfStock.length,
        totalMovementsInPeriod: movements.length,
      },
      stock,
      movements: movements.map((movement) => ({
        id: movement.id, createdAt: movement.createdAt, type: movement.type, quantity: movement.quantity,
        stockBefore: movement.stockBefore, stockAfter: movement.stockAfter, reason: movement.reason,
        productName: movement.variant.product.name, skuBase: movement.variant.product.skuBase,
        variantSku: movement.variant.sku, size: movement.variant.size, color: movement.variant.color,
        userName: movement.user.name, userEmail: movement.user.email,
      })),
      movementSummary,
      alerts,
      categoryDistribution: categories.map((category) => {
        const activeVariants = category.products.flatMap((product) => product.variants);
        return { categoryId: category.id, categoryName: category.name, productCount: category.products.length, variantCount: activeVariants.length, totalStock: activeVariants.reduce((total, variant) => total + variant.stock, 0) };
      }),
    });
  } catch (error) { return next(error); }
});

export { router as reportsRouter };
