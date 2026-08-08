import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { getDailyReport, isoDateDaysAgo } from "../lib/dailyReport";

export const dashboardRouter = Router();

/** previous 0 iken current de 0 ise %0, previous 0 ve current>0 ise kıyaslanamaz (null, "yeni"). */
function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

dashboardRouter.get(
  "/summary",
  requireAuth,
  requirePermission("dashboard.view"),
  asyncHandler(async (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = isoDateDaysAgo(1);

    const [todayReport, yesterdayReport, openAssignments, products, recentActivity] = await Promise.all([
      getDailyReport(today),
      getDailyReport(yesterday),
      prisma.assignment.findMany({
        where: { status: "OPEN" },
        select: { id: true, courierId: true },
      }),
      prisma.product.findMany({
        where: { active: true },
        include: { stockItem: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { id: true, name: true } } },
      }),
    ]);

    const stockTotalQuantity = products.reduce((sum, p) => sum + (p.stockItem?.quantity ?? 0), 0);

    let criticalStockCount = 0;
    let outOfStockCount = 0;
    const stockAlerts: Array<{ productId: string; name: string; quantity: number; minStock: number }> = [];
    for (const product of products) {
      const quantity = product.stockItem?.quantity ?? 0;
      if (quantity <= 0) {
        outOfStockCount += 1;
        stockAlerts.push({ productId: product.id, name: product.name, quantity, minStock: product.minStock });
      } else if (quantity <= product.minStock) {
        criticalStockCount += 1;
        stockAlerts.push({ productId: product.id, name: product.name, quantity, minStock: product.minStock });
      }
    }

    const activeCourierCount = new Set(openAssignments.map((a) => a.courierId)).size;

    const alerts: Array<{ type: string; severity: "critical" | "warning" | "info"; message: string; entityId?: string }> = [];
    for (const item of stockAlerts) {
      alerts.push({
        type: "stock",
        severity: item.quantity <= 0 ? "critical" : "warning",
        message:
          item.quantity <= 0
            ? `${item.name} stoğu tükendi`
            : `${item.name} kritik stok seviyesinde (${item.quantity} adet kaldı)`,
        entityId: item.productId,
      });
    }
    if (openAssignments.length > 0) {
      alerts.push({
        type: "assignment",
        severity: "info",
        message: `${openAssignments.length} açık zimmet sahada`,
      });
    }

    res.json({
      date: today,
      kpis: {
        openAssignments: openAssignments.length,
        activeCourierCount,
        stockTotalQuantity,
        stockProductCount: products.length,
        criticalStockCount,
        outOfStockCount,
        assignedToday: todayReport.summary.totalAssigned,
        assignedYesterday: yesterdayReport.summary.totalAssigned,
        assignedDeltaPct: deltaPct(todayReport.summary.totalAssigned, yesterdayReport.summary.totalAssigned),
        soldToday: todayReport.summary.totalSold,
        soldYesterday: yesterdayReport.summary.totalSold,
        soldDeltaPct: deltaPct(todayReport.summary.totalSold, yesterdayReport.summary.totalSold),
        revenueToday: todayReport.summary.totalRevenue,
        revenueYesterday: yesterdayReport.summary.totalRevenue,
        revenueDeltaPct: deltaPct(todayReport.summary.totalRevenue, yesterdayReport.summary.totalRevenue),
        returnedToday: todayReport.summary.totalReturned,
        returnedYesterday: yesterdayReport.summary.totalReturned,
        returnedDeltaPct: deltaPct(todayReport.summary.totalReturned, yesterdayReport.summary.totalReturned),
      },
      alerts,
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        action: log.action,
        description: log.description,
        user: log.user ? { id: log.user.id, name: log.user.name } : null,
        createdAt: log.createdAt,
      })),
    });
  })
);
