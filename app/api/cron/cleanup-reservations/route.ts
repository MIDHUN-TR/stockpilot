import { NextResponse } from "next/server";
import prisma from "@/lib/db/db";
import { StockReservationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Cron job to expire stale stock reservations.
 * Protected by CRON_SECRET header check.
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all expired active reservations
    const expiredReservations = await prisma.stockReservation.findMany({
      where: {
        status: StockReservationStatus.Active,
        expiresAt: { lt: now },
      },
      select: {
        id: true,
        productId: true,
        warehouseId: true,
        quantity: true,
      },
    });

    if (expiredReservations.length === 0) {
      return NextResponse.json({ message: "No expired reservations", expired: 0 });
    }

    // Process each reservation in a transaction
    await prisma.$transaction(async (tx) => {
      for (const reservation of expiredReservations) {
        // Decrement reserved quantity atomically
        await tx.$executeRaw`
          UPDATE "inventory"
          SET "reservedQuantity" = GREATEST("reservedQuantity" - ${reservation.quantity}, 0)
          WHERE "warehouseId" = ${reservation.warehouseId}
            AND "productId" = ${reservation.productId}
        `;

        // Mark reservation as expired
        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: { status: StockReservationStatus.Expired },
        });
      }
    });

    return NextResponse.json({
      message: "Expired reservations cleaned up",
      expired: expiredReservations.length,
    });
  } catch (error) {
    console.error("Reservation cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to clean up reservations" },
      { status: 500 }
    );
  }
}
