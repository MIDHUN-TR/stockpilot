import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";
import { OrderStatus, PaymentStatus, StockMovementType, StockReservationStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

// Interfaces
export interface OrderItemPayload {
    productId: number;
    warehouseId: number;
    quantity: number;
}

export interface CreateOrderPayload {
    customerName: string;
    userId?: number;
    items: OrderItemPayload[];
    createdById: number; 
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as CreateOrderPayload;

        // 1. Basic Validation
        if (!body.items || body.items.length === 0) {
            return NextResponse.json({ error: "Order must contain at least one item." }, { status: 400 });
        }

        // Generate a unique order number (e.g., ORD-17042023-XXXX)
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 2. Start Atomic Transaction
        const orderResult = await prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            const orderItemsData = [];
            const reservationsData = [];

            // Step A: Validate stock and calculate true price for each item
            for (const item of body.items) {
                // Fetch product and inventory data
                const inventory = await tx.inventory.findUnique({
                    where: {
                        warehouseId_productId: {
                            warehouseId: item.warehouseId,
                            productId: item.productId,
                        },
                    },
                    include: { product: true }
                });

                if (!inventory || !inventory.product) {
                    throw new Error(`Product ID ${item.productId} is not available in Warehouse ${item.warehouseId}.`);
                }

                const availableStock = inventory.quantityOnHand - inventory.reservedQuantity;
                if (availableStock < item.quantity) {
                    throw new Error(`Insufficient stock for Product: ${inventory.product.name}. Available: ${availableStock}, Requested: ${item.quantity}`);
                }

                // Calculate subtotal using database price, NOT frontend price
                const unitPrice = Number(inventory.product.price);
                const subtotal = unitPrice * item.quantity;
                totalAmount += subtotal;

                // Prepare data for OrderItem and StockReservation
                orderItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: unitPrice,
                    subtotal: subtotal,
                });

                reservationsData.push({
                    productId: item.productId,
                    warehouseId: item.warehouseId,
                    quantity: item.quantity,
                    createdById: body.createdById,
                    status: StockReservationStatus.Active,
                });

                // Step B: Increment reservedQuantity in Inventory
                await tx.inventory.update({
                    where: {
                        warehouseId_productId: {
                            warehouseId: item.warehouseId,
                            productId: item.productId,
                        },
                    },
                    data: {
                        reservedQuantity: { increment: item.quantity }
                    }
                });
            }

            // Step C: Create the Order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber: orderNumber,
                    customerName: body.customerName,
                    userId: body.userId,
                    totalAmount: totalAmount,
                    orderStatus: OrderStatus.Pending,
                    paymentStatus: PaymentStatus.Pending,
                    // Create OrderItems linked to this order
                    items: {
                        create: orderItemsData
                    },
                    // Create StockReservations linked to this order
                    reservations: {
                        create: reservationsData
                    }
                },
                include: {
                    items: true,
                    reservations: true
                }
            });

            return newOrder;
        }, {
            maxWait: 5000,
            timeout: 10000
        });

        // 3. Return successful response
        return NextResponse.json({
            message: "Order created successfully",
            order: orderResult
        }, { status: 201 });

    } 
   catch (error: unknown) {
        console.error("Order Creation Error:", error);

        // 1. Handle Prisma Database Errors securely
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            switch (error.code) {
                case 'P2002':
                    // Unique constraint failed (e.g., duplicate orderNumber)
                    return NextResponse.json(
                        { error: "A unique constraint failed. This order number might already exist." },
                        { status: 409 } // Conflict
                    );
                case 'P2003':
                    // Foreign key constraint failed (e.g., invalid userId or warehouseId)
                    return NextResponse.json(
                        { error: "Invalid reference: The specified User, Product, or Warehouse does not exist in the system." },
                        { status: 400 } // Bad Request
                    );
                case 'P2028':
                    // Transaction API error / Timeout
                    return NextResponse.json(
                        { error: "Database transaction timed out. Please try placing the order again." },
                        { status: 408 } // Request Timeout
                    );
                default:
                    // Any other Prisma specific errors
                    return NextResponse.json(
                        { error: `Database error occurred (Error Code: ${error.code}).` },
                        { status: 500 } // Internal Server Error
                    );
            }
        }

        // 2. Handle Custom Validation Errors (Thrown manually from the transaction block)
        if (error instanceof Error) {
            if (error.message.includes("Insufficient stock") || error.message.includes("not available")) {
                return NextResponse.json({ error: error.message }, { status: 400 }); // Bad Request
            }
        }

        // 3. Generic Fallback Error (Network issues, server crash, etc.)
        return NextResponse.json(
            { error: "An unexpected error occurred while creating the order." },
            { status: 500 }
        );
    }
}