import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { cloudinaryEnvSchema } from "@/zod/envSchema";

/**
 * Validate Cloudinary env vars once at module load — fails fast if any var is missing.
 */
const env = cloudinaryEnvSchema.parse({
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Configure the Cloudinary singleton once.
 * Subsequent imports reuse the same configured instance (Node module cache).
 */
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

/** Allowed MIME types for product image uploads. */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** Maximum file size in bytes (5 MB). */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Upload a product image buffer to Cloudinary.
 *
 * @param fileBuffer - Raw file bytes
 * @param mimeType  - The file's MIME type (validated against allowlist)
 * @param productId - Used to namespace the upload under `stockpilot/products/{id}`
 * @returns The Cloudinary upload response with `secure_url` and `public_id`
 */
export async function uploadImage(
  fileBuffer: Buffer,
  mimeType: string,
  productId: number,
): Promise<UploadApiResponse> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `Unsupported file type "${mimeType}". Allowed: ${[...ALLOWED_MIME_TYPES].join(", ")}`,
    );
  }

  if (fileBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size ${fileBuffer.byteLength} bytes exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB limit`,
    );
  }

  // Wrap the stream-based upload in a promise
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `stockpilot/products/${productId}`,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve(result);
      },
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete an image from Cloudinary by its public_id.
 *
 * @param publicId - The Cloudinary public_id (e.g. `stockpilot/products/42/abc123`)
 */
export async function deleteImage(publicId: string): Promise<void> {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary deletion failed: ${result.result}`);
  }
}


