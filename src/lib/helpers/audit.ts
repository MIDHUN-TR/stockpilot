import prisma from "../db/db";
import { Prisma } from "@prisma/client";

/**
 * Creates an audit log entry. Fire-and-forget — errors are logged but don't propagate.
 */
export async function createAuditLog(
  actorId: number,
  action: string,
  entityType: string,
  entityId: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
