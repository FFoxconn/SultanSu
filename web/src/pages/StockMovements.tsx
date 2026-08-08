import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type StockMovement } from "../api/client";
import { Card } from "../components/Card";
import { Badge, type BadgeVariant } from "../components/Badge";
import { DataTable, type Column } from "../components/DataTable";
import { CloseIcon } from "../components/icons";

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
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId") ?? undefined;

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredProductName, setFilteredProductName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setFilteredProductName(null);
      return;
    }
    api
      .product(productId)
      .then((p) => setFilteredProductName(p.name))
      .catch(() => setFilteredProductName(null));
  }, [productId]);

  useEffect(() => {
    setLoading(true);
    api
      .stockMovements({ productId })
      .then(setMovements)
      .finally(() => setLoading(false));
  }, [productId]);

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

      {productId && (
        <div className="filter-chip">
          Filtre: {filteredProductName ?? "..."}
          <Link to="/stok-hareketleri" className="filter-chip__remove" aria-label="Filtreyi kaldır">
            <CloseIcon size={12} />
          </Link>
        </div>
      )}

      <Card>
        <DataTable
          columns={columns}
          data={movements}
          rowKey={(m) => m.id}
          loading={loading}
          searchPlaceholder="Ürün veya kullanıcı ara..."
          exportFilename="stok-hareketleri"
          emptyMessage={productId ? "Bu ürün için stok hareketi yok." : "Henüz stok hareketi yok."}
        />
      </Card>
    </div>
  );
}
