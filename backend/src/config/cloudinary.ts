import { randomUUID } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { z } from "zod";

const cloudinaryEnvironment = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1),
  CLOUDINARY_API_KEY: z.string().trim().min(1),
  CLOUDINARY_API_SECRET: z.string().trim().min(1),
});

let configured = false;

function ensureCloudinaryConfigured() {
  if (configured) return;

  const result = cloudinaryEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("Cloudinary is not configured.");
  }

  cloudinary.config({
    cloud_name: result.data.CLOUDINARY_CLOUD_NAME,
    api_key: result.data.CLOUDINARY_API_KEY,
    api_secret: result.data.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export function uploadProductImage(productId: string, buffer: Buffer): Promise<UploadApiResponse> {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: `amaram/products/${productId}`,
        public_id: randomUUID(),
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload returned no result."));
        return resolve(result);
      },
    );

    stream.end(buffer);
  });
}

export async function deleteProductImage(publicId: string): Promise<void> {
  ensureCloudinaryConfigured();
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Cloudinary did not confirm image deletion.");
  }
}
