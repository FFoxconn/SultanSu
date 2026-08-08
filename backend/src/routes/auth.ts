import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken, verifyPassword } from "../lib/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { recordAudit } from "../lib/audit";
import type { Role } from "../lib/roles";

export const authRouter = Router();

const loginSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Telefon ve şifre gerekli" });
    }
    const { phone, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.active) {
      return res.status(401).json({ error: "Kullanıcı bulunamadı" });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Telefon veya şifre hatalı" });
    }

    const token = signToken({ sub: user.id, role: user.role as Role, name: user.name });

    if (user.role !== "COURIER") {
      await recordAudit(prisma, {
        userId: user.id,
        action: "auth.login",
        entityType: "User",
        entityId: user.id,
        description: `${user.name} giriş yaptı`,
        ip: req.ip,
      });
    }

    res.json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    res.json({ id: user.id, name: user.name, phone: user.phone, role: user.role });
  })
);
