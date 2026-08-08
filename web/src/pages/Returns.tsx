import { useEffect, useState } from "react";
import { api, type ReturnRecord } from "../api/client";
import { Card } from "../components/Card";
import { DataTable, type Column } from "../components/DataTable";

export function Returns() {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .returns()
      .then(setReturns)
      .finally(() => setLoading(false));
  }, []);

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
      <Card>
        <DataTable
          columns={columns}
          data={returns}
          rowKey={(r) => r.id}
          loading={loading}
          searchPlaceholder="Kurye veya ürün ara..."
          exportFilename="iadeler"
          emptyMessage="Henüz iade kaydı yok."
        />
      </Card>
    </div>
  );
}
