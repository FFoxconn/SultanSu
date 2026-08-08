import { prisma } from "./prisma";

export async function getDailyReport(date: string) {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59.999`);

  const assignments = await prisma.assignment.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: {
      courier: { select: { id: true, name: true, phone: true } },
      items: { include: { product: true } },
      sales: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = assignments.map((assignment) => {
    const soldByProduct = new Map<string, number>();
    for (const sale of assignment.sales) {
      soldByProduct.set(sale.productId, (soldByProduct.get(sale.productId) ?? 0) + sale.quantity);
    }

    const totalAssigned = assignment.items.reduce((sum, i) => sum + i.quantityAssigned, 0);
    const totalSold = assignment.sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalReturned =
      assignment.status === "CLOSED"
        ? assignment.items.reduce((sum, i) => sum + (i.quantityReturned ?? 0), 0)
        : totalAssigned - totalSold;
    const totalRevenue = assignment.sales.reduce((sum, s) => sum + s.total, 0);

    return {
      assignmentId: assignment.id,
      courier: assignment.courier,
      status: assignment.status,
      items: assignment.items.map((item) => ({
        product: { id: item.product.id, name: item.product.name },
        assigned: item.quantityAssigned,
        sold: soldByProduct.get(item.productId) ?? 0,
        returned: item.quantityReturned,
      })),
      totalAssigned,
      totalSold,
      totalReturned,
      totalRevenue,
    };
  });

  return {
    date,
    couriers: rows,
    summary: {
      totalAssigned: rows.reduce((sum, r) => sum + r.totalAssigned, 0),
      totalSold: rows.reduce((sum, r) => sum + r.totalSold, 0),
      totalReturned: rows.reduce((sum, r) => sum + r.totalReturned, 0),
      totalRevenue: rows.reduce((sum, r) => sum + r.totalRevenue, 0),
    },
  };
}

export function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
