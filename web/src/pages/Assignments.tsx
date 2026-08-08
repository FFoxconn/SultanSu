import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type AssignmentView } from "../api/client";
import { Card } from "../components/Card";
import { ChartCard } from "../components/ChartCard";
import { StatCard } from "../components/StatCard";
import { DataTable, type Column } from "../components/DataTable";
import { AssignmentStatusDonut } from "../components/charts";
import { ClipboardIcon, PackageIcon, WalletIcon } from "../components/icons";

type StatusFilter = "ALL" | "OPEN" | "CLOSED";

export function Assignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  useEffect(() => {
    api
      .assignments()
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, []);

  const openCount = assignments.filter((a) => a.status === "OPEN").length;
  const closedCount = assignments.filter((a) => a.status === "CLOSED").length;
  const totalItems = assignments.reduce((sum, a) => sum + a.items.reduce((x, i) => x + i.quantityAssigned, 0), 0);
  const totalRevenue = assignments.reduce((sum, a) => sum + a.totalSalesAmount, 0);

  const filtered = useMemo(
    () => (statusFilter === "ALL" ? assignments : assignments.filter((a) => a.status === statusFilter)),
    [assignments, statusFilter]
  );

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

      <div className="stat-row">
        <StatCard icon={<ClipboardIcon size={19} />} label="Açık Zimmet" value={openCount} />
        <StatCard icon={<ClipboardIcon size={19} />} label="Kapanan Zimmet" value={closedCount} />
        <StatCard icon={<PackageIcon size={19} />} label="Toplam Zimmetlenen Ürün" value={totalItems} />
        <StatCard icon={<WalletIcon size={19} />} label="Toplam Ciro" value={`${totalRevenue.toLocaleString("tr-TR")} ₺`} />
      </div>

      <ChartCard title="Zimmet Durumu Dağılımı" height={240}>
        <AssignmentStatusDonut open={openCount} closed={closedCount} />
      </ChartCard>

      <Card
        actions={
          <div className="tabs" style={{ margin: 0, border: "none" }}>
            <button type="button" className={statusFilter === "ALL" ? "active" : ""} onClick={() => setStatusFilter("ALL")}>
              Tümü
            </button>
            <button type="button" className={statusFilter === "OPEN" ? "active" : ""} onClick={() => setStatusFilter("OPEN")}>
              Sahada
            </button>
            <button type="button" className={statusFilter === "CLOSED" ? "active" : ""} onClick={() => setStatusFilter("CLOSED")}>
              Kapandı
            </button>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={filtered}
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
