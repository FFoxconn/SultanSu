import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

export const stockRouter = Router();

stockRouter.get(
  "/",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(async (_req, res) => {
    const items = await prisma.stockItem.findMany({
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    });
    res.json(items);
  })
);
