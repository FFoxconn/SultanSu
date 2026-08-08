import { useEffect, useState } from "react";
import { api, type StockMovement } from "../api/client";
import { Card } from "../components/Card";
import { Badge, type BadgeVariant } from "../components/Badge";
import { DataTable, type Column } from "../components/DataTable";

const MOVEMENT_LABELS: Record<string, string> = {
  INITIAL: "Başlangıç Stoğu",
  ASSIGN: "Zimmet (Çıkış)",
  RETURN: "İade (Giriş)",
  ADJUSTMENT: "Düzeltme",
};

const MOVEMENT_VARIANT: Record<string, BadgeVariant> = {
  INITIAL: "info",
  ASSIGN: "warning",
  RETURN: "success",
  ADJUSTMENT: "neutral",
};

export function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .stockMovements()
      .then(setMovements)
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<StockMovement>[] = [
    {
      key: "createdAt",
      header: "Tarih",
      render: (m) => new Date(m.createdAt).toLocaleString("tr-TR"),
      csvValue: (m) => new Date(m.createdAt).toLocaleString("tr-TR"),
      sortValue: (m) => new Date(m.createdAt).getTime(),
    },
    { key: "product", header: "Ürün", render: (m) => m.product.name, csvValue: (m) => m.product.name },
    {
      key: "type",
      header: "İşlem Tipi",
      render: (m) => <Badge variant={MOVEMENT_VARIANT[m.type] ?? "neutral"}>{MOVEMENT_LABELS[m.type] ?? m.type}</Badge>,
      csvValue: (m) => MOVEMENT_LABELS[m.type] ?? m.type,
    },
    {
      key: "quantity",
      header: "Miktar",
      render: (m) => (
        <span style={{ color: m.quantity >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
        </span>
      ),
      csvValue: (m) => m.quantity,
      sortValue: (m) => m.quantity,
      align: "right",
    },
    {
      key: "change",
      header: "Önceki → Sonraki",
      render: (m) => `${m.previousQty} → ${m.newQty}`,
      csvValue: (m) => `${m.previousQty} -> ${m.newQty}`,
    },
    { key: "user", header: "Kullanıcı", render: (m) => m.user?.name ?? "Sistem", csvValue: (m) => m.user?.name ?? "Sistem" },
    { key: "note", header: "Not", render: (m) => m.note ?? "-", csvValue: (m) => m.note ?? "" },
  ];

  return (
    <div>
      <h2>Stok Hareketleri</h2>
      <p className="muted">Zimmet, iade ve ürün oluşturma sırasında otomatik oluşan tüm depo stok hareketleri.</p>
      <Card>
        <DataTable
          columns={columns}
          data={movements}
          rowKey={(m) => m.id}
          loading={loading}
          searchPlaceholder="Ürün veya kullanıcı ara..."
          exportFilename="stok-hareketleri"
          emptyMessage="Henüz stok hareketi yok."
        />
      </Card>
    </div>
  );
}
