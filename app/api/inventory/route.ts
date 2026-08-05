import prisma from "@/lib/db/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        const categoryId = searchParams.get("categoryId")
        const warehouseId = searchParams.get("warehouseId")
        const search = searchParams.get("search")
        const productId = searchParams.get("productId")
        const status = searchParams.get("status")
        // pagination validation(prevents NaN and negative number)
        const pageCount = searchParams.get("page") || "1"
        const pagelimit = searchParams.get("limit") || "25"
        const page = parseInt(pageCount)
        const limit = parseInt(pagelimit)

        if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
            return NextResponse.json(
                { error: "Invalid pagination parameters. 'page' and 'limit' must be positive numbers." },
                { status: 400 }
            );
        }

        //build the dynamic where clause
        const whereClause: Prisma.InventoryWhereInput = {};
        // create a seperate,strictly-typed object just for the product filters
        const productFilter: Prisma.ProductWhereInput = {}

        if (id) {
            whereClause.id = parseInt(id)
        }
        if (warehouseId) {
            whereClause.warehouseId = parseInt(warehouseId)
        }
        // Add the category filter if it exists
        if (categoryId) {
            productFilter.categoryId = parseInt(categoryId)
        }
        // Add the search filter if it exists
        if (search) {
            productFilter.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } }
            ]
        }
        // If we added any filters to the product object,attach it to the main whereClause
        if (Object.keys(productFilter).length > 0) {
            whereClause.product = productFilter
        }
        if (productId) {
            whereClause.productId = parseInt(productId)
        }


        switch (status) {
            case "OUT_OF_STOCK":
                whereClause.quantityOnHand = { lte: 0 }
                break;
            case "IN_STOCK":
                whereClause.quantityOnHand = { gt: 0 }
                break;
            case "LOW_STOCK":
                whereClause.quantityOnHand = {
                    gt: 0,
                    lte: 10
                }
        }
        const skip = (page - 1) * limit

        const [totalCount, inventory] = await prisma.$transaction([
            prisma.inventory.count({
                where: whereClause
            }),
            prisma.inventory.findMany({
                where: whereClause,
                skip: skip,
                take: limit,
                select: {
                    id: true,
                    quantityOnHand: true,
                    reservedQuantity: true,
                    reorderLevel: true,
                    product: {
                        select: {
                            id: true,
                            sku: true,
                            name: true,
                            categoryId: true,
                            price: true,
                            isActive: true,
                        }
                    },
                    warehouse: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            location: true,
                        }
                    }
                }
            })
        ]);


        return NextResponse.json({ message: "Full inventory data", data: inventory, totalCount: totalCount }, { status: 200 })
    }
    catch (e: unknown) {
        console.log(e)
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
    }
}