import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import multer from "multer";
import { z } from "zod";
import { deleteProductImage, uploadProductImage } from "../config/cloudinary.js";
import { prisma } from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const allowedRoles = requireRole("ADMIN", "INVENTORY");
const uuid = z.string().uuid();
const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const imageFields = {
  id: true,
  productId: true,
  publicId: true,
  secureUrl: true,
  position: true,
  width: true,
  height: true,
  createdAt: true,
} as const;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "image"));
    }
    return callback(null, true);
  },
});

class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function technicalError(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const record = error as { name?: unknown; code?: unknown };
    return {
      name: typeof record.name === "string" ? record.name : "UnknownError",
      code: typeof record.code === "string" || typeof record.code === "number" ? record.code : undefined,
    };
  }
  return { name: "UnknownError" };
}

function parseProductId(request: Request) {
  const result = uuid.safeParse(request.params.productId);
  if (!result.success) throw new HttpError(400, "Invalid product id.");
  return result.data;
}

function singleImage(request: Request, response: Response, next: NextFunction) {
  upload.single("image")(request, response, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return response.status(413).json({ error: "Image must not exceed 5 MB." });
    }
    if (error instanceof multer.MulterError) {
      return response.status(400).json({ error: "Upload one JPG, PNG or WebP file in the image field." });
    }
    return next(error);
  });
}

async function requireActiveProduct(request: Request, response: Response, next: NextFunction) {
  try {
    const productId = parseProductId(request);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, active: true },
    });
    if (!product) return response.status(404).json({ error: "Product not found." });
    if (!product.active) return response.status(409).json({ error: "Product must be active to upload images." });
    response.locals.productId = product.id;
    return next();
  } catch (error) {
    if (error instanceof HttpError) return response.status(error.status).json({ error: error.message });
    return next(error);
  }
}

router.get("/:productId/images", requireAuth, allowedRoles, async (request, response, next) => {
  try {
    const productId = parseProductId(request);
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return response.status(404).json({ error: "Product not found." });
    const images = await prisma.productImage.findMany({
      where: { productId },
      select: imageFields,
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
    return response.status(200).json({ images });
  } catch (error) {
    if (error instanceof HttpError) return response.status(error.status).json({ error: error.message });
    return next(error);
  }
});

router.post("/:productId/images", requireAuth, allowedRoles, requireActiveProduct, singleImage, async (request, response, next) => {
  const productId = response.locals.productId as string;
  if (!request.file) return response.status(400).json({ error: "Image file is required." });

  try {
    const currentCount = await prisma.productImage.count({ where: { productId } });
    if (currentCount >= MAX_IMAGES) return response.status(409).json({ error: "A product can have at most 5 images." });

    const detected = await fileTypeFromBuffer(request.file.buffer);
    if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime) || detected.mime !== request.file.mimetype) {
      return response.status(400).json({ error: "File content must be a valid JPG, PNG or WebP image." });
    }

    const uploaded = await uploadProductImage(productId, request.file.buffer);
    if (!uploaded.secure_url.startsWith("https://")) {
      await deleteProductImage(uploaded.public_id);
      throw new Error("Cloudinary returned an insecure image URL.");
    }

    try {
      const image = await prisma.$transaction(async (transaction) => {
        await transaction.$queryRaw`
          WITH product_image_lock AS MATERIALIZED (
            SELECT pg_advisory_xact_lock(hashtext(${productId}))
          )
          SELECT true AS locked FROM product_image_lock
        `;
        const existing = await transaction.productImage.findMany({
          where: { productId },
          select: { position: true },
          orderBy: { position: "desc" },
        });
        if (existing.length >= MAX_IMAGES) throw new HttpError(409, "A product can have at most 5 images.");
        const position = (existing[0]?.position ?? 0) + 1;
        return transaction.productImage.create({
          data: {
            productId,
            publicId: uploaded.public_id,
            secureUrl: uploaded.secure_url,
            position,
            width: uploaded.width,
            height: uploaded.height,
          },
          select: imageFields,
        });
      });
      return response.status(201).json({ image });
    } catch (databaseError) {
      try {
        await deleteProductImage(uploaded.public_id);
      } catch (cleanupError) {
        console.error("Cloudinary compensation failed after database insertion error.", technicalError(cleanupError));
      }
      throw databaseError;
    }
  } catch (error) {
    if (error instanceof HttpError) return response.status(error.status).json({ error: error.message });
    console.error("Product image upload failed.", technicalError(error));
    return next(error);
  }
});

router.delete("/:productId/images/:imageId", requireAuth, allowedRoles, async (request, response, next) => {
  try {
    const productId = parseProductId(request);
    const imageId = uuid.safeParse(request.params.imageId);
    if (!imageId.success) return response.status(400).json({ error: "Invalid image id." });
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return response.status(404).json({ error: "Product not found." });
    const image = await prisma.productImage.findFirst({ where: { id: imageId.data, productId }, select: imageFields });
    if (!image) return response.status(404).json({ error: "Product image not found." });

    await deleteProductImage(image.publicId);
    await prisma.productImage.delete({ where: { id: image.id } });
    return response.status(204).send();
  } catch (error) {
    if (error instanceof HttpError) return response.status(error.status).json({ error: error.message });
    console.error("Product image deletion failed.", technicalError(error));
    return next(error);
  }
});

export { router as productImagesRouter };
