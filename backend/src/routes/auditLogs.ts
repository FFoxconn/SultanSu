import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";

export const auditLogsRouter = Router();

auditLogsRouter.get(
  "/",
  requireAuth,
  requirePermission("audit.view"),
  asyncHandler(async (req, res) => {
    const { limit } = req.query as Record<string, string | undefined>;
    const take = Math.min(Number(limit) || 100, 300);

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    res.json(logs);
  })
);
