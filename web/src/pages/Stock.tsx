import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, stockStatus, type StockItem, type StockMovement } from "../api/client";
import { StatCard } from "../components/StatCard";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { DataTable, type Column } from "../components/DataTable";
import { SkeletonCard } from "../components/Skeleton";
import { AlertTriangleIcon, HistoryIcon, PackageIcon, WalletIcon } from "../components/icons";

function isToday(dateStr: string) {
  return dateStr.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export function Stock() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.stock(), api.stockMovements()])
      .then(([stock, mv]) => {
        setItems(stock);
        setMovements(mv);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonCard lines={5} />;

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const criticalCount = items.filter((i) => stockStatus(i.quantity, i.product.minStock) !== "NORMAL").length;
  const stockValue = items.reduce((sum, i) => sum + i.quantity * i.product.price, 0);
  const todayIn = movements.filter((m) => isToday(m.createdAt) && m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0);
  const todayOut = movements.filter((m) => isToday(m.createdAt) && m.quantity < 0).reduce((sum, m) => sum + Math.abs(m.quantity), 0);

  const columns: Column<StockItem>[] = [
    { key: "name", header: "Ürün", render: (i) => i.product.name, csvValue: (i) => i.product.name, sortValue: (i) => i.product.name },
    { key: "code", header: "Kod", render: (i) => i.product.code ?? "-", csvValue: (i) => i.product.code ?? "" },
    {
      key: "quantity",
      header: "Depodaki Miktar",
      render: (i) => `${i.quantity} ${i.product.unit}`,
      csvValue: (i) => i.quantity,
      sortValue: (i) => i.quantity,
      align: "right",
    },
    { key: "minStock", header: "Kritik Eşik", render: (i) => i.product.minStock, csvValue: (i) => i.product.minStock, align: "right" },
    {
      key: "status",
      header: "Durum",
      render: (i) => {
        const status = stockStatus(i.quantity, i.product.minStock);
        return status === "NORMAL" ? (
          <Badge variant="success">Normal</Badge>
        ) : status === "CRITICAL" ? (
          <Badge variant="warning">Kritik</Badge>
        ) : (
          <Badge variant="danger">Tükendi</Badge>
        );
      },
      sortValue: (i) => {
        const status = stockStatus(i.quantity, i.product.minStock);
        return status === "OUT" ? 0 : status === "CRITICAL" ? 1 : 2;
      },
    },
  ];

  const sortedItems = [...items].sort((a, b) => {
    const rank = (i: StockItem) => {
      const s = stockStatus(i.quantity, i.product.minStock);
      return s === "OUT" ? 0 : s === "CRITICAL" ? 1 : 2;
    };
    return rank(a) - rank(b);
  });

  return (
    <div>
      <h2>Depo / Merkez Stok</h2>

      <div className="stat-row">
        <StatCard icon={<PackageIcon size={19} />} label="Toplam Ürün" value={items.length} />
        <StatCard icon={<PackageIcon size={19} />} label="Toplam Stok" value={totalQuantity} />
        <StatCard icon={<AlertTriangleIcon size={19} />} label="Kritik Stok" value={criticalCount} tone={criticalCount > 0 ? "warning" : "neutral"} />
        <StatCard icon={<WalletIcon size={19} />} label="Stok Değeri (satış fiyatı ile)" value={`${stockValue.toLocaleString("tr-TR")} ₺`} />
      </div>
      <div className="stat-row">
        <StatCard icon={<HistoryIcon size={19} />} label="Bugünkü Giriş" value={todayIn} />
        <StatCard icon={<HistoryIcon size={19} />} label="Bugünkü Çıkış" value={todayOut} />
      </div>

      <Card actions={<Link to="/stok-hareketleri">Stok Hareketlerini Gör &rarr;</Link>}>
        <DataTable
          columns={columns}
          data={sortedItems}
          rowKey={(i) => i.id}
          searchPlaceholder="Ürün ara..."
          exportFilename="depo-stok"
          emptyMessage="Depoda ürün yok."
        />
      </Card>
    </div>
  );
}
