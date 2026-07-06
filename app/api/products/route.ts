import prisma from "@/lib/db/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try{
        const products = await prisma.product.findMany();
        return NextResponse.json({message: "Products fetched successfully", products}, { status: 200 });
    }
    catch(e){
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}