import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [revenueByDay, topProducts, ordersByStatus] = await Promise.all([
      // Revenue over last 30 days — use raw query for date grouping
      prisma.$queryRaw<{ date: string; revenue: number; count: number }[]>`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
          COALESCE(SUM("totalAmount"::numeric), 0) as revenue,
          COUNT(*)::int as count
        FROM "orders"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
        ORDER BY date ASC
      `,

      // Top 10 products by order count
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, subtotal: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }).then(async (items) => {
        const productIds = items.map((i) => i.productId);
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, sku: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        return items.map((item) => ({
          product: productMap.get(item.productId),
          totalQuantity: item._sum.quantity,
          totalRevenue: item._sum.subtotal,
          orderCount: item._count.id,
        }));
      }),

      // Orders grouped by status
      prisma.order.groupBy({
        by: ["orderStatus"],
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      revenueByDay,
      topProducts,
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.orderStatus,
        count: s._count.id,
      })),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
