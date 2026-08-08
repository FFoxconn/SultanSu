import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { recordAudit } from "../lib/audit";
import { ROLES } from "../lib/roles";

export const usersRouter = Router();

usersRouter.get(
  "/",
  requireAuth,
  requirePermission("user.view"),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, phone: true, role: true, active: true, createdAt: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    res.json(users);
  })
);

const createUserSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  password: z.string().min(4),
  role: z.enum(ROLES as [string, ...string[]]),
});

usersRouter.post(
  "/",
  requireAuth,
  requirePermission("user.manage"),
  asyncHandler(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { name, phone, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(409).json({ error: "Bu telefon numarası zaten kayıtlı" });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, phone, passwordHash, role },
        select: { id: true, name: true, phone: true, role: true, active: true, createdAt: true },
      });
      await recordAudit(tx, {
        userId: req.user!.sub,
        action: "user.create",
        entityType: "User",
        entityId: created.id,
        description: `"${created.name}" kullanıcısı ${role} rolüyle oluşturuldu`,
        ip: req.ip,
      });
      return created;
    });

    res.status(201).json(user);
  })
);
