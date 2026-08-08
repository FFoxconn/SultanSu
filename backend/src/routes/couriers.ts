import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

export const couriersRouter = Router();

couriersRouter.get(
  "/",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(async (_req, res) => {
    const couriers = await prisma.user.findMany({
      where: { role: "COURIER" },
      select: { id: true, name: true, phone: true, active: true, createdAt: true },
      orderBy: { name: "asc" },
    });
    res.json(couriers);
  })
);

const createCourierSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  password: z.string().min(4),
});

couriersRouter.post(
  "/",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const parsed = createCourierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { name, phone, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(409).json({ error: "Bu telefon numarası zaten kayıtlı" });
    }

    const passwordHash = await hashPassword(password);
    const courier = await prisma.user.create({
      data: { name, phone, passwordHash, role: "COURIER" },
      select: { id: true, name: true, phone: true, active: true, createdAt: true },
    });
    res.status(201).json(courier);
  })
);
