import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

export const stockRouter = Router();

const VIEW_ROLES = ["OWNER", "MANAGER", "WAREHOUSE"] as const;

stockRouter.get(
  "/",
  requireAuth,
  requireRole(...VIEW_ROLES),
  asyncHandler(async (_req, res) => {
    const items = await prisma.stockItem.findMany({
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    });
    res.json(items);
  })
);

stockRouter.get(
  "/movements",
  requireAuth,
  requireRole(...VIEW_ROLES),
  asyncHandler(async (req, res) => {
    const { productId } = req.query as Record<string, string | undefined>;
    const movements = await prisma.stockMovement.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: { select: { id: true, name: true, unit: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(movements);
  })
);
