import { z } from "zod/v4";

/**
 * Zod schema for Cloudinary environment variables.
 * Import and extend this schema as the single source of truth
 * for all env-var validation across the app.
 */
export const cloudinaryEnvSchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
});

/** Inferred type for validated Cloudinary env vars. */
export type CloudinaryEnv = z.infer<typeof cloudinaryEnvSchema>;
