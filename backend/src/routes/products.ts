import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

export const productsRouter = Router();

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

const createProductSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1).default("adet"),
  price: z.number().nonnegative(),
  initialStock: z.number().int().nonnegative().default(0),
});

productsRouter.post(
  "/",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { name, unit, price, initialStock } = parsed.data;

    const product = await prisma.product.create({
      data: {
        name,
        unit,
        price,
        stockItem: { create: { quantity: initialStock } },
      },
      include: { stockItem: true },
    });
    res.status(201).json(product);
  })
);

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
});

productsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("OWNER"),
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
