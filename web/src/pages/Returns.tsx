import { useEffect, useMemo, useState } from "react";
import { api, type ReturnRecord } from "../api/client";
import { Card } from "../components/Card";
import { ChartCard } from "../components/ChartCard";
import { StatCard } from "../components/StatCard";
import { DataTable, type Column } from "../components/DataTable";
import { ReturnsByProductBar } from "../components/charts";
import { DateRangeFilter, useDateRangeDefaults } from "../components/DateRangeFilter";
import { PackageIcon, RotateIcon, TruckIcon } from "../components/icons";

export function Returns() {
  const defaults = useDateRangeDefaults(30);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .returns({ from, to })
      .then(setReturns)
      .finally(() => setLoading(false));
  }, [from, to]);

  const totalQuantity = returns.reduce((sum, r) => sum + r.quantityReturned, 0);
  const courierCount = new Set(returns.map((r) => r.courier.id)).size;

  const byProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of returns) {
      map.set(r.product.name, (map.get(r.product.name) ?? 0) + r.quantityReturned);
    }
    return Array.from(map.entries()).map(([name, quantity]) => ({ name, quantity }));
  }, [returns]);

  const topProduct = byProduct.length > 0 ? [...byProduct].sort((a, b) => b.quantity - a.quantity)[0] : null;

  const columns: Column<ReturnRecord>[] = [
    {
      key: "closedAt",
      header: "Tarih",
      render: (r) => new Date(r.closedAt).toLocaleString("tr-TR"),
      csvValue: (r) => new Date(r.closedAt).toLocaleString("tr-TR"),
      sortValue: (r) => new Date(r.closedAt).getTime(),
    },
    { key: "courier", header: "Kurye", render: (r) => r.courier.name, csvValue: (r) => r.courier.name, sortValue: (r) => r.courier.name },
    { key: "product", header: "Ürün", render: (r) => r.product.name, csvValue: (r) => r.product.name },
    { key: "assigned", header: "Zimmetlenen", render: (r) => r.quantityAssigned, csvValue: (r) => r.quantityAssigned, align: "right" },
    {
      key: "returned",
      header: "İade Edilen",
      render: (r) => `${r.quantityReturned} ${r.product.unit}`,
      csvValue: (r) => r.quantityReturned,
      sortValue: (r) => r.quantityReturned,
      align: "right",
    },
  ];

  return (
    <div>
      <h2>İadeler</h2>
      <p className="muted">
        Kuryelerin gün sonunda zimmetlerinden satmadıkları ve otomatik olarak depo stoğuna geri iade ettikleri ürünler.
      </p>

      <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />

      <div className="stat-row">
        <StatCard icon={<RotateIcon size={19} />} label="İade Kaydı" value={returns.length} />
        <StatCard icon={<PackageIcon size={19} />} label="İade Edilen Adet" value={totalQuantity} />
        <StatCard icon={<TruckIcon size={19} />} label="İadesi Olan Kurye" value={courierCount} />
        <StatCard icon={<PackageIcon size={19} />} label="En Çok İade Edilen" value={topProduct ? topProduct.name : "-"} />
      </div>

      <ChartCard title="Ürün Bazlı İade Dağılımı">
        <ReturnsByProductBar data={byProduct} />
      </ChartCard>

      <Card>
        <DataTable
          columns={columns}
          data={returns}
          rowKey={(r) => r.id}
          loading={loading}
          searchPlaceholder="Kurye veya ürün ara..."
          exportFilename="iadeler"
          emptyMessage="Bu tarih aralığında iade kaydı yok."
        />
      </Card>
    </div>
  );
}
