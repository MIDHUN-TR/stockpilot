import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";
import { authorizeRequest } from "@/lib/helpers/auth-guard";
import { Permission } from "@/lib/auth/permissions";
import { productImageUploadSchema } from "@/zod/productImageSchema";
import { uploadImage } from "@/lib/cloudinary/cloudinary";
import type {
  ProductImageListResponse,
  ProductImageSingleResponse,
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


export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ProductImageSingleResponse | ProductImageErrorResponse>> {
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


  // ---------- Parse multipart/form-data ----------
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false as const, error: "Request body must be multipart/form-data" },
      { status: 400 },
    );
  }


  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false as const, error: "\"file\" field is required and must be a file" },
      { status: 400 },
    );
  }


  const altTextRaw = formData.get("altText");
  const altTextValue = typeof altTextRaw === "string" ? altTextRaw : undefined;


  // ---------- Validate metadata with Zod ----------
  const parsed = productImageUploadSchema.safeParse({
    productId,
    altText: altTextValue,
  });


  if (!parsed.success) {
    return NextResponse.json(
      { success: false as const, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }


  // ---------- Validate file (MIME + size) & upload ----------
  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());


    // uploadImage internally validates MIME type and file size (5 MB max)
    const cloudinaryResult = await uploadImage(fileBuffer, file.type, productId);


    // ---------- Determine next sortOrder ----------
    const maxSortOrder = await prisma.productImage.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });


    const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;


    // ---------- Create DB record ----------
    const newImage = await prisma.productImage.create({
      data: {
        productId,
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        altText: parsed.data.altText ?? null,
        sortOrder: nextSortOrder,
      },
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


    return NextResponse.json(
      {
        success: true as const,
        data: {
          ...newImage,
          createdAt: newImage.createdAt.toISOString(),
          updatedAt: newImage.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";


    // Surface validation errors (MIME / size) as 400; everything else is 500
    const isValidation =
      message.includes("Unsupported file type") ||
      message.includes("exceeds the");


    console.error("Product image upload error:", error);


    return NextResponse.json(
      { success: false as const, error: isValidation ? message : "Failed to upload product image" },
      { status: isValidation ? 400 : 500 },
    );
  }
}



