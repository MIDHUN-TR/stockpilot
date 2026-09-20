import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";
import { Prisma, OrderStatus, PaymentStatus, StockReservationStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { orderRateLimiter } from "@/lib/redis/ratelimit";

export interface OrderItemPayload {
    productId: number;
    warehouseId: number;
    quantity: number;
}

export interface CreateOrderPayload {
    customerName: string;
    items: OrderItemPayload[];
}

class OrderError extends Error {
    constructor(message: string, public status: number) {
        super(message);
        this.name = "OrderError";
    }
}

const RESERVATION_DURATION_MS = 30 * 60 * 1000;
const MAX_ITEMS_PER_ORDER = 50;

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let authenticationUserId: number;
        try {
            const payload = await verifyToken(token);
            authenticationUserId = payload.userId as number;
        } catch {
            return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
        }

        const identifier = `user${authenticationUserId}`;
        const { success, limit, reset, remaining } = await orderRateLimiter.limit(identifier);
        if (!success) {
            return NextResponse.json(
                { error: "Too many requests. Please wait before attempting to place another order" },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString(),
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        let body: CreateOrderPayload;
        try {
            body = (await request.json()) as CreateOrderPayload;
        } catch {
            return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
        }

        // Validate and sanitize customer name
        const customerName = body.customerName?.trim();
        if (!customerName || customerName.length === 0 || customerName.length > 100) {
            return NextResponse.json({ error: "Invalid customerName. Must be between 1 and 100 characters." }, { status: 400 });
        }

        if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_ITEMS_PER_ORDER) {
            return NextResponse.json({ error: `Order must contain between 1 and ${MAX_ITEMS_PER_ORDER} items.` }, { status: 400 });
        }

        // Deduplicate items based on productId and warehouseId
        const mergedItemsMap = new Map<string, OrderItemPayload>();
        for (const item of body.items) {
            if (
                !Number.isInteger(item.productId) ||
                !Number.isInteger(item.quantity) ||
                !Number.isInteger(item.warehouseId) ||
                item.quantity <= 0 ||
                item.productId <= 0 ||
                item.warehouseId <= 0
            ) {
                return NextResponse.json({ error: "Invalid item data format or values" }, { status: 400 });
            }

            const key = `${item.productId}-${item.warehouseId}`;
            if (mergedItemsMap.has(key)) {
                const existing = mergedItemsMap.get(key)!;
                existing.quantity += item.quantity;
            } else {
                mergedItemsMap.set(key, { ...item });
            }
        }
        const deduplicatedItems = Array.from(mergedItemsMap.values());

        const idempotencyKey = request.headers.get("Idempotency-Key");
        if (idempotencyKey && idempotencyKey.length <= 255) {
            // Note: Requires actual 'idempotencyKey' column in the schema
            const existing = await prisma.order.findFirst({
                where: { orderNumber: idempotencyKey }, 
                select: { id: true, orderNumber: true },
            });
            if (existing) {
                return NextResponse.json(
                    { message: "Order already created", order: existing },
                    { status: 200, headers: { "Cache-Control": "no-store" } }
                );
            }
        }

        // Generate a collision-safe unique order number
        const orderNumber = `ORD-${crypto.randomUUID()}`;

        // Pre-fetch all products to prevent N+1 query problem inside the transaction
        const productIds = deduplicatedItems.map(item => item.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, price: true, isActive: true },
        });

        const productMap = new Map(products.map(p => [p.id, p]));

        const orderResult = await prisma.$transaction(
            async (tx) => {
                let totalAmount = 0;
                const orderItemsData = [];
                const reservationsData = [];

                for (const item of deduplicatedItems) {
                    const product = productMap.get(item.productId);

                    if (!product) {
                        throw new OrderError(`Product ID ${item.productId} does not exist.`, 400);
                    }
                    if (!product.isActive) {
                        throw new OrderError(`Product "${product.name}" is not currently available for order.`, 400);
                    }

                    // Fix Overselling Race Condition using raw SQL arithmetic
                    const reserveResult = await tx.$executeRaw`
                        UPDATE "inventory"
                        SET "reservedQuantity" = "reservedQuantity" + ${item.quantity}
                        WHERE "warehouseId" = ${item.warehouseId} 
                          AND "productId" = ${item.productId}
                          AND ("quantityOnHand" - "reservedQuantity") >= ${item.quantity}
                    `;

                    if (reserveResult === 0) {
                        throw new OrderError(
                            `Insufficient stock or unknown inventory for Product ID ${item.productId} in Warehouse ${item.warehouseId}.`,
                            409
                        );
                    }

                    const unitPrice = Number(product.price);
                    const subtotal = unitPrice * item.quantity;
                    totalAmount += subtotal;

                    orderItemsData.push({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice,
                        subtotal,
                    });

                    reservationsData.push({
                        productId: item.productId,
                        warehouseId: item.warehouseId,
                        quantity: item.quantity,
                        createdById: authenticationUserId,
                        status: StockReservationStatus.Active,
                        expiresAt: new Date(Date.now() + RESERVATION_DURATION_MS),
                    });
                }

                const newOrder = await tx.order.create({
                    data: {
                        orderNumber,
                        customerName,
                        userId: authenticationUserId,
                        totalAmount,
                        orderStatus: OrderStatus.Pending,
                        paymentStatus: PaymentStatus.Pending,
                        items: { create: orderItemsData },
                        reservations: { create: reservationsData },
                    },
                    select: {
                        id: true,
                        orderNumber: true,
                        customerName: true,
                        totalAmount: true,
                        orderStatus: true,
                        paymentStatus: true,
                        createdAt: true,
                        items: {
                            select: {
                                id: true,
                                productId: true,
                                quantity: true,
                                unitPrice: true,
                                subtotal: true,
                            },
                        },
                    },
                });

                return newOrder;
            },
            { maxWait: 5000, timeout: 10000 }
        );

        return NextResponse.json(
            { message: "Order created successfully", order: orderResult },
            { status: 201, headers: { "Cache-Control": "no-store" } }
        );
    } catch (error: unknown) {
        console.error("Order Creation Error:", error);

        if (error instanceof OrderError) {
            return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2028") {
            return NextResponse.json({ error: "Order processing timed out. Please try again." }, { status: 500, headers: { "Cache-Control": "no-store" } });
        }
        return NextResponse.json({ error: "An unexpected error occurred while creating the order." }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }
}