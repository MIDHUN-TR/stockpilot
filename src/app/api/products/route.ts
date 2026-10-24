import prisma from "@/lib/db/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authorizeRequest } from "@/lib/helpers/auth-guard";
import { Permission, hasPermission } from "@/lib/auth/permissions";


export async function GET() {
    const [user, errorResponse] = await authorizeRequest(Permission.PRODUCT_VIEW);
    if (!user) return errorResponse;

    const canViewCost = hasPermission(user.role, Permission.PRODUCT_VIEW_COST);

    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                sku: true,
                name: true,
                description: true,
                categoryId: true,
                price: true,
                costPrice: canViewCost,
                status: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return NextResponse.json(
            { success: true, data: products },
            { status: 200 }
        );
    } catch (e) {
        console.error("Products GET error:", e);
        return NextResponse.json(
            { success: false, error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

// Creating an interface for the product data
interface ProductPayload {
    sku: string;
    name: string;
    description?: string;
    categoryId: number;
    price: string;
    costPrice: string;
    isActive?: boolean;
}

// Writing the POST method to create a new product
export async function POST(request: Request) {
    const [user, errorResponse] = await authorizeRequest(Permission.PRODUCT_CREATE);
    if (!user) return errorResponse;

    try {
        const body = (await request.json()) as ProductPayload;
        const { sku, name, description, categoryId, price, costPrice, isActive } = body;

        // checking if the product with the same sku already exists
        const existingProduct = await prisma.product.findUnique({
            where: {
                sku: sku,
            },
        });

        if (existingProduct) {
            return NextResponse.json(
                { success: false, error: "Product with the same SKU already exists" },
                { status: 400 }
            );
        }

        // creating a new product in the database
        const product = await prisma.product.create({
            data: {
                sku,
                name,
                description,
                categoryId,
                price: new Prisma.Decimal(price),
                costPrice: new Prisma.Decimal(costPrice),
                isActive,
            },
        });
        return NextResponse.json(
            { success: true, data: product },
            { status: 201 }
        );
    } catch (e) {
        // Catch Prisma's specific Unique Constraint Violation Error
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return NextResponse.json(
                { success: false, error: "Product with the same SKU already exists" },
                { status: 400 }
            );
        }
        console.error("Product-creation-error:", e);
        return NextResponse.json(
            { success: false, error: "Failed to create product" },
            { status: 500 }
        );
    }
}