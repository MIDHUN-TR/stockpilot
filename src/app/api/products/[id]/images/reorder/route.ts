import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";
import { authorizeRequest } from "@/lib/helpers/auth-guard";
import { Permission } from "@/lib/auth/permissions";
import { productImageReorderSchema } from "@/zod/productImageSchema";
import type {
  ProductImageReorderResponse,
  ProductImageErrorResponse,
} from "@/types/productImage";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ProductImageReorderResponse | ProductImageErrorResponse>> {
  const [, errorResponse] = await authorizeRequest(Permission.PRODUCT_EDIT);
  if (errorResponse)
    return errorResponse as NextResponse<ProductImageErrorResponse>;

  const resolvedParams = await params;
  const productId = Number(resolvedParams.id);

  if (Number.isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
    return NextResponse.json(
      { success: false as const, error: "Invalid product ID" },
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

  const parsed = productImageReorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false as const, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { imageIds } = parsed.data;

  // Reject duplicate IDs
  if (new Set(imageIds).size !== imageIds.length) {
    return NextResponse.json(
      { success: false as const, error: "imageIds must not contain duplicates" },
      { status: 400 },
    );
  }

  try {
    // ---------- Verify all images belong to the product ----------
    const existingImages = await prisma.productImage.findMany({
      where: { productId },
      select: { id: true },
    });

    const existingIds = new Set(existingImages.map((img) => img.id));

    for (const id of imageIds) {
      if (!existingIds.has(id)) {
        return NextResponse.json(
          {
            success: false as const,
            error: `Image ${id} not found for this product`,
          },
          { status: 404 },
        );
      }
    }

    // ---------- Batch-update sortOrder in a transaction ----------
    const reorderedImages = await prisma.$transaction(async (tx) => {
      await Promise.all(
        imageIds.map((id, index) =>
          tx.productImage.update({
            where: { id },
            data: { sortOrder: index },
          }),
        ),
      );

      // Fetch the updated images in new sort order
      return tx.productImage.findMany({
        where: { productId },
        orderBy: { sortOrder: "asc" },
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
    });

    return NextResponse.json({
      success: true as const,
      data: reorderedImages.map((img) => ({
        ...img,
        createdAt: img.createdAt.toISOString(),
        updatedAt: img.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Product image reorder error:", error);
    return NextResponse.json(
      { success: false as const, error: "Failed to reorder product images" },
      { status: 500 },
    );
  }
}

