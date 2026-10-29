import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";
import { authorizeRequest } from "@/lib/helpers/auth-guard";
import { Permission } from "@/lib/auth/permissions";
import { productImageUpdateSchema } from "@/zod/productImageSchema";

import type {
  ProductImageSingleResponse,

  ProductImageErrorResponse,
} from "@/types/productImage";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
): Promise<NextResponse<ProductImageSingleResponse | ProductImageErrorResponse>> {
  const [, errorResponse] = await authorizeRequest(Permission.PRODUCT_EDIT);
  if (errorResponse)
    return errorResponse as NextResponse<ProductImageErrorResponse>;

  const resolvedParams = await params;
  const productId = Number(resolvedParams.id);
  const imageId = Number(resolvedParams.imageId);

  if (Number.isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
    return NextResponse.json(
      { success: false as const, error: "Invalid product ID" },
      { status: 400 },
    );
  }

  if (Number.isNaN(imageId) || imageId <= 0 || !Number.isInteger(imageId)) {
    return NextResponse.json(
      { success: false as const, error: "Invalid image ID" },
      { status: 400 },
    );
  }

  // ---------- Parse & validate body ----------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false as const, error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const parsed = productImageUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false as const, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { altText, sortOrder } = parsed.data;

  // At least one field must be provided
  if (altText === undefined && sortOrder === undefined) {
    return NextResponse.json(
      { success: false as const, error: "No fields provided to update" },
      { status: 400 },
    );
  }

  try {
    // ---------- Verify image belongs to the product ----------
    const existingImage = await prisma.productImage.findUnique({
      where: { id: imageId },
      select: { productId: true },
    });

    if (!existingImage) {
      return NextResponse.json(
        { success: false as const, error: "Image not found" },
        { status: 404 },
      );
    }

    if (existingImage.productId !== productId) {
      return NextResponse.json(
        { success: false as const, error: "Image does not belong to this product" },
        { status: 404 },
      );
    }

    // ---------- Build update payload ----------
    const updateData: { altText?: string | null; sortOrder?: number } = {};
    if (altText !== undefined) updateData.altText = altText;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    // ---------- Update ----------
    const updatedImage = await prisma.productImage.update({
      where: { id: imageId },
      data: updateData,
      select: {
        id: true,
        productId: true,
        url: true,
        altText: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true as const,
      data: {
        ...updatedImage,
        createdAt: updatedImage.createdAt.toISOString(),
        updatedAt: updatedImage.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Product image update error:", error);
    return NextResponse.json(
      { success: false as const, error: "Failed to update product image" },
      { status: 500 },
    );
  }
}



