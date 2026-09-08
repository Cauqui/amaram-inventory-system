import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const allowedRoles = requireRole("ADMIN", "INVENTORY");
const MOVEMENT_PERIOD_DAYS = 7;

router.get("/", requireAuth, allowedRoles, async (_request, response, next) => {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const periodStart = new Date(todayStart);
  periodStart.setUTCDate(periodStart.getUTCDate() - (MOVEMENT_PERIOD_DAYS - 1));

  try {
    const [totalProducts, activeProducts, totalVariants, activeVariants, totalMovements, movementsToday, periodMovements, recentMovements, categories] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.productVariant.count(),
      prisma.productVariant.findMany({
        where: { active: true, product: { active: true } },
        select: {
          id: true, sku: true, stock: true, minimumStock: true,
          product: { select: { id: true, skuBase: true, name: true, category: { select: { id: true, name: true } } } },
        },
      }),
      prisma.inventoryMovement.count(),
      prisma.inventoryMovement.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.inventoryMovement.groupBy({
        by: ["type"], where: { createdAt: { gte: periodStart } }, _count: { _all: true },
      }),
      prisma.inventoryMovement.findMany({
        take: 5, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true, type: true, quantity: true, createdAt: true,
          variant: { select: { sku: true, product: { select: { id: true, name: true, skuBase: true } } } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.category.findMany({
        select: {
          id: true, name: true,
          products: { where: { active: true }, select: { variants: { where: { active: true }, select: { id: true, stock: true } } } },
        }, orderBy: { name: "asc" },
      }),
    ]);

    const lowStockVariants = activeVariants.filter((variant) => variant.stock > 0 && variant.stock <= variant.minimumStock);
    const outOfStockVariants = activeVariants.filter((variant) => variant.stock === 0);
    const alerts = [...outOfStockVariants, ...lowStockVariants]
      .sort((left, right) => left.stock - right.stock || left.sku.localeCompare(right.sku))
      .slice(0, 5)
      .map((variant) => ({
        product: variant.product, variant: { id: variant.id, sku: variant.sku }, stock: variant.stock,
        minimumStock: variant.minimumStock, status: variant.stock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
      }));
    const movementCount = (type: "ENTRY" | "EXIT" | "ADJUSTMENT") => periodMovements.find((item) => item.type === type)?._count._all ?? 0;

    return response.status(200).json({
      metrics: {
        totalProducts, activeProducts, totalVariants,
        totalStock: activeVariants.reduce((total, variant) => total + variant.stock, 0),
        lowStockVariants: lowStockVariants.length, outOfStockVariants: outOfStockVariants.length,
      },
      movementStats: {
        totalMovements, movementsToday, periodDays: MOVEMENT_PERIOD_DAYS,
        entryMovements: movementCount("ENTRY"), exitMovements: movementCount("EXIT"), adjustmentMovements: movementCount("ADJUSTMENT"),
      },
      recentMovements: recentMovements.map((movement) => ({
        id: movement.id, type: movement.type, quantity: movement.quantity, createdAt: movement.createdAt,
        product: movement.variant.product, variant: { sku: movement.variant.sku }, user: movement.user,
      })),
      categoryStock: categories.map((category) => {
        const variants = category.products.flatMap((product) => product.variants);
        return { categoryId: category.id, categoryName: category.name, productCount: category.products.length, variantCount: variants.length, totalStock: variants.reduce((total, variant) => total + variant.stock, 0) };
      }),
      alerts,
    });
  } catch (error) { return next(error); }
});

export { router as dashboardRouter };
