import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalRevenue,
      ordersToday,
      totalOrders,
      lowStockCount,
      recentOrders,
      lowStockItems,
    ] = await Promise.all([
      // Total revenue from all successful orders
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "Success" },
      }),
      // Orders placed today
      prisma.order.count({
        where: { createdAt: { gte: todayStart } },
      }),
      // Total orders
      prisma.order.count(),
      // Low stock alerts
      prisma.inventory.count({
        where: {
          OR: [
            { quantityOnHand: { equals: 0 } },
            { quantityOnHand: { lte: 10, gt: 0 } },
          ],
        },
      }),
      // Recent 5 orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          orderStatus: true,
          paymentStatus: true,
          createdAt: true,
        },
      }),
      // Low stock items (top 10)
      prisma.inventory.findMany({
        where: {
          OR: [
            { quantityOnHand: { equals: 0 } },
            { quantityOnHand: { lte: 10, gt: 0 } },
          ],
        },
        take: 10,
        orderBy: { quantityOnHand: "asc" },
        select: {
          id: true,
          quantityOnHand: true,
          reorderLevel: true,
          product: {
            select: { id: true, name: true, sku: true },
          },
          warehouse: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
      ordersToday,
      totalOrders,
      lowStockCount,
      recentOrders,
      lowStockItems,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
