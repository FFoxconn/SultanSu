import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type AssignmentView } from "../api/client";
import { Card } from "../components/Card";
import { DataTable, type Column } from "../components/DataTable";

export function Assignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .assignments()
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<AssignmentView>[] = [
    { key: "courier", header: "Kurye", render: (a) => a.courier.name, csvValue: (a) => a.courier.name, sortValue: (a) => a.courier.name },
    {
      key: "status",
      header: "Durum",
      render: (a) => <span className={`badge ${a.status === "OPEN" ? "open" : "closed"}`}>{a.status === "OPEN" ? "Sahada" : "Kapandı"}</span>,
      csvValue: (a) => (a.status === "OPEN" ? "Sahada" : "Kapandı"),
    },
    {
      key: "createdAt",
      header: "Oluşturulma",
      render: (a) => new Date(a.createdAt).toLocaleString("tr-TR"),
      csvValue: (a) => new Date(a.createdAt).toLocaleString("tr-TR"),
      sortValue: (a) => new Date(a.createdAt).getTime(),
    },
    { key: "items", header: "Ürün Sayısı", render: (a) => a.items.length, csvValue: (a) => a.items.length, align: "right" },
    {
      key: "totalSalesAmount",
      header: "Ciro",
      render: (a) => `${a.totalSalesAmount.toLocaleString("tr-TR")} ₺`,
      csvValue: (a) => a.totalSalesAmount,
      sortValue: (a) => a.totalSalesAmount,
      align: "right",
    },
  ];

  return (
    <div>
      <h2>Zimmetler</h2>
      <Card>
        <DataTable
          columns={columns}
          data={assignments}
          rowKey={(a) => a.id}
          loading={loading}
          searchPlaceholder="Kurye ara..."
          exportFilename="zimmetler"
          emptyMessage="Henüz zimmet oluşturulmadı."
          onRowClick={(a) => navigate(`/zimmetler/${a.id}`)}
        />
      </Card>
    </div>
  );
}
