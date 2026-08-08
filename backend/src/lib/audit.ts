import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type Tx = Prisma.TransactionClient;

type AuditParams = {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  ip?: string | null;
};

export async function recordAudit(tx: Tx | typeof prisma, params: AuditParams) {
  await tx.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      ip: params.ip ?? undefined,
    },
  });
}
