import prisma from "@/lib/db/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

interface StockMovementPayload {
    productId: number;
    warehouseId: number;
    quantity: number;
    referenceType: "RETAIL_BILL" | "ECOMMERCE_ORDER" | "PURCHASE_ORDER" | "OPENING_STOCK" | "MANUAL_ADJUSTMENT" | "INTERNAL_TRANSFER" | "WHOLESALE_BILL";
    referenceId?: number;
    note?: string;
    movementType: "IN" | "OUT" | "ADJUSTMENT";
    createdById: number;
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as StockMovementPayload;

        // Starting Prisma Transaction 
        const result = await prisma.$transaction(async (tx) => {

            // taking current inventory data
            const currentInventory = await tx.inventory.findUnique({
                where: {
                    warehouseId_productId: {
                        productId: body.productId,
                        warehouseId: body.warehouseId
                    }
                }
            });

            // Current stock (Before)
            const quantityBefore = currentInventory?.quantityOnHand || 0;
            let quantityAfter = quantityBefore;

            // 2. Calculate quantity by checking if it is E-Commerce or direct sale
            // calculating the product when checking E-Commerce or Sale 
            let inventoryUpdateData: any = {};

            if (body.referenceType === "ECOMMERCE_ORDER" && body.movementType === "OUT") {
                // E-Commerce: Reserving the product
                inventoryUpdateData = {
                    reservedQuantity: { increment: body.quantity }
                };
                // never change quantity after when the product is in reserved(product still be in warehouse)
                quantityAfter = quantityBefore;

            } else if (body.movementType === "IN") {
                // When new stock arrives
                quantityAfter = quantityBefore + body.quantity;
                inventoryUpdateData = { quantityOnHand: quantityAfter };

            } else if (body.movementType === "OUT") {
                // When selling directly from the store (RETAIL_BILL)
                quantityAfter = quantityBefore - body.quantity;
                inventoryUpdateData = { quantityOnHand: quantityAfter };
            }

            // 3. Negative Stock Validation (OverQuantity checking)
            const availableStock = quantityBefore - (currentInventory?.reservedQuantity || 0);
            if (body.movementType === "OUT" && availableStock < body.quantity) {
                throw new Error("Insufficient stock for sale or reservation.");
            }

            // 4. saving history in StockMovements 
            const stockMovement = await tx.stockMovement.create({
                data: {
                    productId: body.productId,
                    warehouseId: body.warehouseId,
                    quantity: body.quantity,
                    referenceType: body.referenceType,
                    referenceId: body.referenceId,
                    quantityBefore: quantityBefore,
                    quantityAfter: quantityAfter,
                    note: body.note,
                    movementType: body.movementType,
                    createdById: body.createdById,
                }
            });

            // 5. updating inventory table
            await tx.inventory.upsert({
                where: {
                    warehouseId_productId: {
                        productId: body.productId,
                        warehouseId: body.warehouseId
                    }
                },
                create: {
                    productId: body.productId,
                    warehouseId: body.warehouseId,
                    quantityOnHand: body.movementType === "IN" ? body.quantity : 0,
                    reservedQuantity: body.referenceType === "ECOMMERCE_ORDER" ? body.quantity : 0
                },
                update: inventoryUpdateData // Passing the data we set above
            });

            return stockMovement;
        },
        {
            maxWait: 5000,
            timeout: 10000
        }
    );

        return NextResponse.json(result, { status: 201 });

    } 
    catch (error: unknown) {
        console.error("Error processing stock movement:", error);

        // Handle specific Prisma database errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Check for Prisma P2028: Transaction API error / Timeout
            if (error.code === 'P2028') {
                return NextResponse.json(
                    { error: "Database transaction timed out. Please try again." },
                    { status: 408 } // 408 Request Timeout
                );
            }
            if (error.code === 'P2003') {
                return NextResponse.json(
                    { error: "Invalid reference: The specified Product or Warehouse does not exist." }, 
                    { status: 400 } // 400 Bad Request
                );
            }
        }

        // Handle custom validation errors (e.g., negative stock)
        if (error instanceof Error && error.message === "Insufficient stock for sale or reservation.") {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Generic fallback error for any other unexpected issues
        return NextResponse.json(
            { error: "An unexpected error occurred while updating the stock." },
            { status: 500 }
        );
    }
}