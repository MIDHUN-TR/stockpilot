import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";
import { authorizeRequest } from "@/lib/helpers/auth-guard";
import { Permission } from "@/lib/auth/permissions";

import type {
  ProductImageListResponse,
  ProductImageErrorResponse,
} from "@/types/productImage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ProductImageListResponse | ProductImageErrorResponse>> {
  const [, errorResponse] = await authorizeRequest(Permission.PRODUCT_VIEW);
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

  try {
    const images = await prisma.productImage.findMany({
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

    return NextResponse.json({
      success: true as const,
      data: images.map((img) => ({
        ...img,
        createdAt: img.createdAt.toISOString(),
        updatedAt: img.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Product images list error:", error);
    return NextResponse.json(
      { success: false as const, error: "Failed to fetch product images" },
      { status: 500 },
    );
  }
}



