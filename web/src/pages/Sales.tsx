import { useEffect, useState } from "react";
import { api, type SaleRecord } from "../api/client";
import { Card } from "../components/Card";
import { DataTable, type Column } from "../components/DataTable";

export function Sales() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .sales()
      .then(setSales)
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

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
      <div className="stat-row">
        <div className="stat">
          <div className="label">Toplam Satış Kaydı</div>
          <div className="value">{sales.length}</div>
        </div>
        <div className="stat">
          <div className="label">Toplam Ciro</div>
          <div className="value">{totalRevenue.toLocaleString("tr-TR")} ₺</div>
        </div>
      </div>
      <Card>
        <DataTable
          columns={columns}
          data={sales}
          rowKey={(s) => s.id}
          loading={loading}
          searchPlaceholder="Kurye veya ürün ara..."
          exportFilename="satislar"
          emptyMessage="Henüz satış kaydı yok."
        />
      </Card>
    </div>
  );
}
