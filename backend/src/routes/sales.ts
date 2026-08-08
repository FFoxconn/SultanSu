import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";

export const salesRouter = Router();

salesRouter.get(
  "/",
  requireAuth,
  requirePermission("sale.view"),
  asyncHandler(async (req, res) => {
    const { date, from, to, courierId, productId } = req.query as Record<string, string | undefined>;

    const where: Record<string, unknown> = {};
    if (courierId) where.courierId = courierId;
    if (productId) where.productId = productId;
    if (date) {
      where.createdAt = {
        gte: new Date(`${date}T00:00:00`),
        lte: new Date(`${date}T23:59:59.999`),
      };
    } else if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: from || to ? 2000 : 500,
      include: {
        product: { select: { id: true, name: true, unit: true } },
        courier: { select: { id: true, name: true } },
      },
    });

    res.json(
      sales.map((sale) => ({
        id: sale.id,
        assignmentId: sale.assignmentId,
        product: sale.product,
        courier: sale.courier,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        total: sale.total,
        createdAt: sale.createdAt,
      }))
    );
  })
);
