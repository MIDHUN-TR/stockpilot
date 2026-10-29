import type { z } from "zod/v4";

import type {
  productImageUploadSchema,
  productImageUpdateSchema,
  productImageReorderSchema,
} from "@/zod/productImageSchema";

// ---------------------------------------------------------------------------
// Zod-inferred payload types (re-exported for convenience)
// ---------------------------------------------------------------------------

/** Validated POST body for uploading a product image. */
export type ProductImageUploadPayload = z.infer<
  typeof productImageUploadSchema
>;

/** Validated PATCH body for updating image metadata. */
export type ProductImageUpdatePayload = z.infer<
  typeof productImageUpdateSchema
>;

/** Validated PUT body for bulk-reordering images. */
export type ProductImageReorderPayload = z.infer<
  typeof productImageReorderSchema
>;

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

/**
 * Client-facing representation of a product image returned by the API.
 *
 * Mirrors the Prisma `ProductImage` model but intentionally **omits**
 * `publicId` — that is a Cloudinary-internal identifier and should
 * never be exposed to consumers.
 */
export interface ProductImageResponse {
  id: number;
  productId: number;
  url: string;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Successful list response — GET /api/products/[id]/images
 */
export interface ProductImageListResponse {
  success: true;
  data: ProductImageResponse[];
}

/**
 * Successful single-item response — POST / PATCH
 */
export interface ProductImageSingleResponse {
  success: true;
  data: ProductImageResponse;
}

/**
 * Successful deletion response — DELETE
 */
export interface ProductImageDeleteResponse {
  success: true;
  data: { id: number };
}

/**
 * Successful reorder response — PUT
 */
export interface ProductImageReorderResponse {
  success: true;
  data: ProductImageResponse[];
}

/**
 * Standard error response shape (per SSOT §6 response contract).
 */
export interface ProductImageErrorResponse {
  success: false;
  error: string;
}
