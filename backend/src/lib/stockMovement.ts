import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type StockMovementType = "INITIAL" | "ASSIGN" | "RETURN" | "ADJUSTMENT";

/**
 * Depo stok miktarını değiştirir ve aynı işlemde bir StockMovement kaydı bırakır.
 * delta pozitifse stok artar (RETURN/INITIAL/ADJUSTMENT+), negatifse azalır (ASSIGN/ADJUSTMENT-).
 */
export async function applyStockMovement(
  tx: Tx,
  params: {
    productId: string;
    type: StockMovementType;
    delta: number;
    userId?: string;
    note?: string;
  }
) {
  const stock = await tx.stockItem.update({
    where: { productId: params.productId },
    data: { quantity: { increment: params.delta } },
  });

  await tx.stockMovement.create({
    data: {
      productId: params.productId,
      type: params.type,
      quantity: params.delta,
      previousQty: stock.quantity - params.delta,
      newQty: stock.quantity,
      userId: params.userId,
      note: params.note,
    },
  });

  return stock;
}
