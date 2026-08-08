import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

export const assignmentsRouter = Router();

type AssignmentWithDetails = Awaited<ReturnType<typeof loadAssignmentDetails>>;

async function loadAssignmentDetails(id: string) {
  return prisma.assignment.findUnique({
    where: { id },
    include: {
      courier: { select: { id: true, name: true, phone: true } },
      items: { include: { product: true } },
      sales: { include: { product: true }, orderBy: { createdAt: "asc" } },
    },
  });
}

function serializeAssignment(assignment: NonNullable<AssignmentWithDetails>) {
  const soldByProduct = new Map<string, number>();
  for (const sale of assignment.sales) {
    soldByProduct.set(sale.productId, (soldByProduct.get(sale.productId) ?? 0) + sale.quantity);
  }

  const items = assignment.items.map((item) => {
    const sold = soldByProduct.get(item.productId) ?? 0;
    return {
      id: item.id,
      product: { id: item.product.id, name: item.product.name, unit: item.product.unit },
      quantityAssigned: item.quantityAssigned,
      quantitySold: sold,
      quantityRemaining: item.quantityAssigned - sold,
      quantityReturned: item.quantityReturned,
    };
  });

  const totalSalesAmount = assignment.sales.reduce((sum, sale) => sum + sale.total, 0);

  return {
    id: assignment.id,
    status: assignment.status,
    createdAt: assignment.createdAt,
    closedAt: assignment.closedAt,
    courier: assignment.courier,
    items,
    sales: assignment.sales.map((sale) => ({
      id: sale.id,
      product: { id: sale.product.id, name: sale.product.name },
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      total: sale.total,
      createdAt: sale.createdAt,
    })),
    totalSalesAmount,
  };
}

const createAssignmentSchema = z.object({
  courierId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

assignmentsRouter.post(
  "/",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const parsed = createAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { courierId, items } = parsed.data;

    const courier = await prisma.user.findUnique({ where: { id: courierId } });
    if (!courier || courier.role !== "COURIER") {
      return res.status(404).json({ error: "Kurye bulunamadı" });
    }

    const openAssignment = await prisma.assignment.findFirst({
      where: { courierId, status: "OPEN" },
    });
    if (openAssignment) {
      return res.status(409).json({ error: "Kuryenin zaten açık bir zimmeti var" });
    }

    try {
      const assignment = await prisma.$transaction(async (tx) => {
        for (const item of items) {
          const stock = await tx.stockItem.findUnique({ where: { productId: item.productId } });
          if (!stock || stock.quantity < item.quantity) {
            throw new InsufficientStockError(item.productId);
          }
        }

        for (const item of items) {
          await tx.stockItem.update({
            where: { productId: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        return tx.assignment.create({
          data: {
            courierId,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantityAssigned: item.quantity,
              })),
            },
          },
        });
      });

      const details = await loadAssignmentDetails(assignment.id);
      res.status(201).json(serializeAssignment(details!));
    } catch (err) {
      if (err instanceof InsufficientStockError) {
        return res.status(400).json({ error: `Depoda yeterli stok yok (ürün: ${err.productId})` });
      }
      throw err;
    }
  })
);

class InsufficientStockError extends Error {
  constructor(public productId: string) {
    super("Insufficient stock");
  }
}

assignmentsRouter.get(
  "/",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const { courierId, status, date } = req.query as Record<string, string | undefined>;

    const where: Record<string, unknown> = {};
    if (courierId) where.courierId = courierId;
    if (status) where.status = status;
    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59.999`);
      where.createdAt = { gte: start, lte: end };
    }

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        courier: { select: { id: true, name: true, phone: true } },
        items: { include: { product: true } },
        sales: { include: { product: true } },
      },
    });

    res.json(assignments.map((a) => serializeAssignment(a)));
  })
);

assignmentsRouter.get(
  "/active",
  requireAuth,
  requireRole("COURIER"),
  asyncHandler(async (req, res) => {
    const assignment = await prisma.assignment.findFirst({
      where: { courierId: req.user!.sub, status: "OPEN" },
      include: {
        courier: { select: { id: true, name: true, phone: true } },
        items: { include: { product: true } },
        sales: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!assignment) {
      return res.status(404).json({ error: "Açık zimmet bulunamadı" });
    }
    res.json(serializeAssignment(assignment));
  })
);

assignmentsRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const assignment = await loadAssignmentDetails(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: "Zimmet bulunamadı" });
    }
    if (req.user!.role === "COURIER" && assignment.courierId !== req.user!.sub) {
      return res.status(403).json({ error: "Bu zimmete erişiminiz yok" });
    }
    res.json(serializeAssignment(assignment));
  })
);

const createSaleSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

assignmentsRouter.post(
  "/:id/sales",
  requireAuth,
  requireRole("COURIER"),
  asyncHandler(async (req, res) => {
    const parsed = createSaleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { productId, quantity } = parsed.data;
    const assignmentId = req.params.id;

    try {
      await prisma.$transaction(async (tx) => {
        const assignment = await tx.assignment.findUnique({ where: { id: assignmentId } });
        if (!assignment) throw new SaleError(404, "Zimmet bulunamadı");
        if (assignment.courierId !== req.user!.sub) throw new SaleError(403, "Bu zimmete erişiminiz yok");
        if (assignment.status !== "OPEN") throw new SaleError(400, "Zimmet kapalı, satış girilemez");

        const item = await tx.assignmentItem.findUnique({
          where: { assignmentId_productId: { assignmentId, productId } },
        });
        if (!item) throw new SaleError(400, "Bu ürün bu zimmete dahil değil");

        const sales = await tx.sale.findMany({ where: { assignmentId, productId } });
        const sold = sales.reduce((sum, s) => sum + s.quantity, 0);
        const remaining = item.quantityAssigned - sold;
        if (quantity > remaining) {
          throw new SaleError(400, `Yetersiz kalan miktar (kalan: ${remaining})`);
        }

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new SaleError(404, "Ürün bulunamadı");

        await tx.sale.create({
          data: {
            assignmentId,
            courierId: req.user!.sub,
            productId,
            quantity,
            unitPrice: product.price,
            total: product.price * quantity,
          },
        });
      });

      const details = await loadAssignmentDetails(assignmentId);
      res.status(201).json(serializeAssignment(details!));
    } catch (err) {
      if (err instanceof SaleError) {
        return res.status(err.status).json({ error: err.message });
      }
      throw err;
    }
  })
);

class SaleError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

assignmentsRouter.post(
  "/:id/close",
  requireAuth,
  requireRole("COURIER"),
  asyncHandler(async (req, res) => {
    const assignmentId = req.params.id;

    try {
      await prisma.$transaction(async (tx) => {
        const assignment = await tx.assignment.findUnique({
          where: { id: assignmentId },
          include: { items: true, sales: true },
        });
        if (!assignment) throw new SaleError(404, "Zimmet bulunamadı");
        if (assignment.courierId !== req.user!.sub) throw new SaleError(403, "Bu zimmete erişiminiz yok");
        if (assignment.status !== "OPEN") throw new SaleError(400, "Zimmet zaten kapalı");

        const soldByProduct = new Map<string, number>();
        for (const sale of assignment.sales) {
          soldByProduct.set(sale.productId, (soldByProduct.get(sale.productId) ?? 0) + sale.quantity);
        }

        for (const item of assignment.items) {
          const sold = soldByProduct.get(item.productId) ?? 0;
          const remaining = item.quantityAssigned - sold;

          await tx.assignmentItem.update({
            where: { id: item.id },
            data: { quantityReturned: remaining },
          });

          if (remaining > 0) {
            await tx.stockItem.update({
              where: { productId: item.productId },
              data: { quantity: { increment: remaining } },
            });
          }
        }

        await tx.assignment.update({
          where: { id: assignmentId },
          data: { status: "CLOSED", closedAt: new Date() },
        });
      });

      const details = await loadAssignmentDetails(assignmentId);
      res.json(serializeAssignment(details!));
    } catch (err) {
      if (err instanceof SaleError) {
        return res.status(err.status).json({ error: err.message });
      }
      throw err;
    }
  })
);
