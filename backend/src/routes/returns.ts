import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";

export const returnsRouter = Router();

// "İade" burada mevcut iş kuralına göre tanımlanır: kuryenin gün sonunda
// zimmetinden satmadığı ürünlerin otomatik olarak depoya geri dönmesi
// (bkz. POST /api/assignments/:id/close). Satış sonrası manuel müşteri
// iadesi ayrı bir iş kuralı gerektirir ve bu sürümde yoktur.
returnsRouter.get(
  "/",
  requireAuth,
  requirePermission("return.view"),
  asyncHandler(async (req, res) => {
    const { date, from, to, courierId, productId } = req.query as Record<string, string | undefined>;

    const where: Record<string, unknown> = {
      quantityReturned: { gt: 0 },
      assignment: { status: "CLOSED" },
    };
    if (courierId) where.assignment = { ...(where.assignment as object), courierId };
    if (productId) where.productId = productId;
    if (date) {
      where.assignment = {
        ...(where.assignment as object),
        closedAt: {
          gte: new Date(`${date}T00:00:00`),
          lte: new Date(`${date}T23:59:59.999`),
        },
      };
    } else if (from || to) {
      where.assignment = {
        ...(where.assignment as object),
        closedAt: {
          ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
          ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
        },
      };
    }

    const items = await prisma.assignmentItem.findMany({
      where,
      orderBy: { assignment: { closedAt: "desc" } },
      take: from || to ? 2000 : 500,
      include: {
        product: { select: { id: true, name: true, unit: true } },
        assignment: {
          select: {
            id: true,
            closedAt: true,
            courier: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json(
      items.map((item) => ({
        id: item.id,
        assignmentId: item.assignment.id,
        courier: item.assignment.courier,
        product: item.product,
        quantityAssigned: item.quantityAssigned,
        quantityReturned: item.quantityReturned,
        closedAt: item.assignment.closedAt,
      }))
    );
  })
);
