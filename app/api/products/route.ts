import prisma from "@/lib/db/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";


export async function GET() {
    try{
        const products = await prisma.product.findMany();
        return NextResponse.json({message: "Products fetched successfully", products}, { status: 200 });
    }
    catch(e){
        return NextResponse.json({ error: "Failed to fetch products",e }, { status: 500 });
    }
}
// creating a interface for the product data
interface Product {
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
    try{
        const body = (await request.json()) as Product;
        const { sku,name,description,categoryId,price,costPrice,isActive } = body ;
        // checking if the product with the same sku already exists
        const existingProduct = await prisma.product.findUnique({
            where: {
                sku: sku
            }
        });

        if (existingProduct) {
            return NextResponse.json({ error: "Product with the same SKU already exists" }, { status: 400 });
        }
        // creating a new product in the database
        const product = await prisma.product.create({
            data: {
                sku,
                name,
                description,
                categoryId,
                price:new Prisma.Decimal(price),
                costPrice:new Prisma.Decimal(costPrice),
                isActive
            }
        });
        return NextResponse.json({message: "Product created successfully", product}, { status: 201 });
    }
    catch(e){
        // Catch Prisma's specific Unique Constraint Violation Error
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            return NextResponse.json({ error: "Product with the same SKU already exists" }, { status: 400 });
        }
        console.log("Product-creation-error:",e)
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}