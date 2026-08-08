import { useEffect, useState } from "react";
import { api, type RangeReport, type SaleRecord } from "../api/client";
import { Card } from "../components/Card";
import { ChartCard } from "../components/ChartCard";
import { StatCard } from "../components/StatCard";
import { DataTable, type Column } from "../components/DataTable";
import { SalesTrendChart } from "../components/charts";
import { DateRangeFilter, useDateRangeDefaults } from "../components/DateRangeFilter";
import { PackageIcon, ReportIcon, WalletIcon } from "../components/icons";

export function Sales() {
  const defaults = useDateRangeDefaults(7);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [range, setRange] = useState<RangeReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.sales({ from, to }), api.rangeReport({ from, to })])
      .then(([s, r]) => {
        setSales(s);
        setRange(r);
      })
      .finally(() => setLoading(false));
  }, [from, to]);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);

  const columns: Column<SaleRecord>[] = [
    {
      key: "createdAt",
      header: "Tarih",
      render: (s) => new Date(s.createdAt).toLocaleString("tr-TR"),
      csvValue: (s) => new Date(s.createdAt).toLocaleString("tr-TR"),
      sortValue: (s) => new Date(s.createdAt).getTime(),
    },
    { key: "courier", header: "Kurye", render: (s) => s.courier.name, csvValue: (s) => s.courier.name, sortValue: (s) => s.courier.name },
    { key: "product", header: "Ürün", render: (s) => s.product.name, csvValue: (s) => s.product.name },
    { key: "quantity", header: "Miktar", render: (s) => `${s.quantity} ${s.product.unit}`, csvValue: (s) => s.quantity, sortValue: (s) => s.quantity, align: "right" },
    { key: "unitPrice", header: "Birim Fiyat", render: (s) => `${s.unitPrice.toLocaleString("tr-TR")} ₺`, csvValue: (s) => s.unitPrice, align: "right" },
    {
      key: "total",
      header: "Toplam",
      render: (s) => `${s.total.toLocaleString("tr-TR")} ₺`,
      csvValue: (s) => s.total,
      sortValue: (s) => s.total,
      align: "right",
    },
  ];

  return (
    <div>
      <h2>Satışlar</h2>
      <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />

      <div className="stat-row">
        <StatCard icon={<ReportIcon size={19} />} label="Satış Kaydı" value={sales.length} />
        <StatCard icon={<PackageIcon size={19} />} label="Satılan Adet" value={totalQuantity} />
        <StatCard icon={<WalletIcon size={19} />} label="Toplam Ciro" value={`${totalRevenue.toLocaleString("tr-TR")} ₺`} />
      </div>

      <ChartCard title="Günlük Satış & Ciro">{range && <SalesTrendChart days={range.days} />}</ChartCard>

      <Card>
        <DataTable
          columns={columns}
          data={sales}
          rowKey={(s) => s.id}
          loading={loading}
          searchPlaceholder="Kurye veya ürün ara..."
          exportFilename="satislar"
          emptyMessage="Bu tarih aralığında satış kaydı yok."
        />
      </Card>
    </div>
  );
}
