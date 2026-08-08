import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { getDailyReport, isoDateDaysAgo } from "../lib/dailyReport";

export const reportsRouter = Router();

reportsRouter.get(
  "/daily",
  requireAuth,
  requirePermission("report.view"),
  asyncHandler(async (req, res) => {
    const date = (req.query.date as string | undefined) ?? new Date().toISOString().slice(0, 10);
    res.json(await getDailyReport(date));
  })
);

/** Belirli bir tarih aralığında güne göre satış adedi ve ciro (trend grafiği için). */
reportsRouter.get(
  "/range",
  requireAuth,
  requirePermission("report.view"),
  asyncHandler(async (req, res) => {
    const from = (req.query.from as string | undefined) ?? isoDateDaysAgo(6);
    const to = (req.query.to as string | undefined) ?? new Date().toISOString().slice(0, 10);

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: new Date(`${from}T00:00:00`),
          lte: new Date(`${to}T23:59:59.999`),
        },
      },
      select: { createdAt: true, quantity: true, total: true },
    });

    const byDate = new Map<string, { salesCount: number; quantity: number; revenue: number }>();
    for (const sale of sales) {
      const key = sale.createdAt.toISOString().slice(0, 10);
      const entry = byDate.get(key) ?? { salesCount: 0, quantity: 0, revenue: 0 };
      entry.salesCount += 1;
      entry.quantity += sale.quantity;
      entry.revenue += sale.total;
      byDate.set(key, entry);
    }

    const days: Array<{ date: string; salesCount: number; quantity: number; revenue: number }> = [];
    const cursor = new Date(`${from}T00:00:00`);
    const endDate = new Date(`${to}T00:00:00`);
    while (cursor <= endDate) {
      const key = cursor.toISOString().slice(0, 10);
      const entry = byDate.get(key) ?? { salesCount: 0, quantity: 0, revenue: 0 };
      days.push({ date: key, ...entry });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({ from, to, days });
  })
);

/** Tarih aralığında kurye bazlı performans özeti. */
reportsRouter.get(
  "/couriers",
  requireAuth,
  requirePermission("report.view"),
  asyncHandler(async (req, res) => {
    const from = (req.query.from as string | undefined) ?? isoDateDaysAgo(29);
    const to = (req.query.to as string | undefined) ?? new Date().toISOString().slice(0, 10);
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59.999`);

    const assignments = await prisma.assignment.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        courier: { select: { id: true, name: true } },
        items: true,
        sales: true,
      },
    });

    const byCourier = new Map<
      string,
      { courier: { id: string; name: string }; totalAssigned: number; totalSold: number; totalReturned: number; totalRevenue: number }
    >();

    for (const assignment of assignments) {
      const entry = byCourier.get(assignment.courierId) ?? {
        courier: assignment.courier,
        totalAssigned: 0,
        totalSold: 0,
        totalReturned: 0,
        totalRevenue: 0,
      };
      entry.totalAssigned += assignment.items.reduce((sum, i) => sum + i.quantityAssigned, 0);
      entry.totalSold += assignment.sales.reduce((sum, s) => sum + s.quantity, 0);
      entry.totalReturned += assignment.items.reduce((sum, i) => sum + (i.quantityReturned ?? 0), 0);
      entry.totalRevenue += assignment.sales.reduce((sum, s) => sum + s.total, 0);
      byCourier.set(assignment.courierId, entry);
    }

    const rows = Array.from(byCourier.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
    res.json({ from, to, couriers: rows });
  })
);
