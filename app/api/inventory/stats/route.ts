import prisma from "@/lib/db/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

// Next.js Route Segment Config for API Caching (Caches the response for 60 seconds)
export const revalidate = 60; // seconds

export async function GET() {
    try {
        // Fetching all basic counts in parallel using Prisma transaction
        // Applying the exact same conditions used in the main inventory API
        const [totalProducts, lowStock, outOfStock] = await prisma.$transaction([
            prisma.inventory.count(),
            prisma.inventory.count({
                where: {
                    quantityOnHand: {
                        lte: 10,
                        gt: 0
                    }
                }
            }),
            prisma.inventory.count({
                where: {
                    quantityOnHand: {
                        equals: 0
                    }
                }
            })
        ]);
        // Fetching data needed for total valuation
        const totalValueData = await prisma.inventory.findMany({
            select: {
                quantityOnHand: true,
                product: {
                    select: {
                        price: true
                    }
                }
            }
        });

        // Calculating total value of inventory
        const totalValuation = totalValueData.reduce((total, item) => {
            const itemPrice = parseFloat(item.product.price.toString()) || 0;
            // Ensuring negative quantities don't affect valuation
            const quantity = Math.max(0, item.quantityOnHand);
            return total + (quantity * itemPrice);
        }, 0);

        return NextResponse.json({ totalProducts, lowStock, outOfStock, totalValuation }, { status: 200 });
    }
    catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2028') {
                return NextResponse.json({ message: "Database transaction error " }, { status: 408 })
            }
        }
        console.error("Error fetching inventory stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}