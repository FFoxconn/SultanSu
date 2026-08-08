import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { recordAudit } from "../lib/audit";

export const productsRouter = Router();

const MANAGE_ROLES = ["OWNER", "MANAGER", "WAREHOUSE"] as const;

productsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    res.json(products);
  })
);

productsRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { stockItem: true },
    });
    if (!product) return res.status(404).json({ error: "Ürün bulunamadı" });

    const [movements, sales] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.sale.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { courier: { select: { id: true, name: true } } },
      }),
    ]);

    res.json({ ...product, movements, sales });
  })
);

function generateProductCode() {
  return `URN-${Date.now().toString(36).toUpperCase()}`;
}

const createProductSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1).default("adet"),
  price: z.number().nonnegative(),
  initialStock: z.number().int().nonnegative().default(0),
  code: z.string().min(1).optional(),
  minStock: z.number().int().nonnegative().default(0),
  costPrice: z.number().nonnegative().optional(),
});

productsRouter.post(
  "/",
  requireAuth,
  requireRole(...MANAGE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { name, unit, price, initialStock, minStock, costPrice } = parsed.data;
    const code = parsed.data.code ?? generateProductCode();

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: { name, unit, price, code, minStock, costPrice, stockItem: { create: { quantity: initialStock } } },
        include: { stockItem: true },
      });

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            type: "INITIAL",
            quantity: initialStock,
            previousQty: 0,
            newQty: initialStock,
            userId: req.user!.sub,
            note: "Ürün oluşturuldu",
          },
        });
      }

      await recordAudit(tx, {
        userId: req.user!.sub,
        action: "product.create",
        entityType: "Product",
        entityId: created.id,
        description: `"${created.name}" ürünü oluşturuldu (kod: ${code})`,
        ip: req.ip,
      });

      return created;
    });

    res.status(201).json(product);
  })
);

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
  code: z.string().min(1).optional(),
  minStock: z.number().int().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
});

productsRouter.patch(
  "/:id",
  requireAuth,
  requireRole(...MANAGE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(product);
  })
);
