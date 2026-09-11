import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const allowedRoles = requireRole("ADMIN", "INVENTORY");
const skuParam = z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9-]+$/).transform((value) => value.toUpperCase());

router.get("/by-sku/:sku", requireAuth, allowedRoles, async (request, response, next) => {
  const parsed = skuParam.safeParse(request.params.sku);
  if (!parsed.success) return response.status(400).json({ error: "Invalid SKU." });

  try {
    const record = await prisma.productVariant.findUnique({
      where: { sku: parsed.data },
      select: {
        id: true, sku: true, size: true, color: true, stock: true, minimumStock: true, active: true,
        product: { select: { id: true, skuBase: true, name: true, active: true } },
      },
    });
    if (!record) return response.status(404).json({ error: "Product variant not found." });

    const { product, ...variant } = record;
    return response.status(200).json({ variant, product });
  } catch (error) {
    return next(error);
  }
});

export { router as productVariantsRouter };
