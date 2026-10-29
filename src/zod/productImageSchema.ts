import { z } from "zod/v4";

/**
 * Validates the POST body when uploading a new product image.
 * The file itself is handled separately (multipart); this schema
 * covers only the JSON metadata fields that accompany the upload.
 */
export const productImageUploadSchema = z.object({
  productId: z
    .number({ error: "productId must be a number" })
    .int("productId must be an integer")
    .positive("productId must be positive"),
  altText: z
    .string()
    .max(255, "altText must be 255 characters or fewer")
    .optional(),
});

/** Inferred type for a validated product-image upload payload. */
export type ProductImageUploadPayload = z.infer<
  typeof productImageUploadSchema
>;

/**
 * Validates the PATCH body when updating an existing product image's
 * metadata (alt text and/or display order).
 */
export const productImageUpdateSchema = z.object({
  altText: z
    .string()
    .max(255, "altText must be 255 characters or fewer")
    .optional(),
  sortOrder: z
    .number({ error: "sortOrder must be a number" })
    .int("sortOrder must be an integer")
    .nonnegative("sortOrder must be zero or greater")
    .optional(),
});

/** Inferred type for a validated product-image update payload. */
export type ProductImageUpdatePayload = z.infer<
  typeof productImageUpdateSchema
>;

/**
 * Validates the body when bulk-reordering product images.
 * Expects an ordered array of image IDs representing the
 * desired display sequence.
 */
export const productImageReorderSchema = z.object({
  imageIds: z
    .array(
      z
        .number({ error: "Each imageId must be a number" })
        .int("Each imageId must be an integer")
        .positive("Each imageId must be positive"),
    )
    .min(1, "imageIds must contain at least one ID"),
});

/** Inferred type for a validated product-image reorder payload. */
export type ProductImageReorderPayload = z.infer<
  typeof productImageReorderSchema
>;
