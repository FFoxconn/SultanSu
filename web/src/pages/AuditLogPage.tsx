import { useEffect, useState } from "react";
import { api, type AuditLogEntry } from "../api/client";
import { Card } from "../components/Card";
import { DataTable, type Column } from "../components/DataTable";

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .auditLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "createdAt",
      header: "Tarih / Saat",
      render: (l) => new Date(l.createdAt).toLocaleString("tr-TR"),
      csvValue: (l) => new Date(l.createdAt).toLocaleString("tr-TR"),
      sortValue: (l) => new Date(l.createdAt).getTime(),
    },
    { key: "user", header: "Kullanıcı", render: (l) => l.user?.name ?? "Sistem", csvValue: (l) => l.user?.name ?? "Sistem" },
    { key: "description", header: "İşlem", render: (l) => l.description, csvValue: (l) => l.description },
    { key: "ip", header: "IP", render: (l) => l.ip ?? "-", csvValue: (l) => l.ip ?? "" },
  ];

  return (
    <div>
      <h2>İşlem Geçmişi</h2>
      <p className="muted">Giriş, zimmet, ürün ve kullanıcı işlemlerinin denetim kaydı (audit log).</p>
      <Card>
        <DataTable
          columns={columns}
          data={logs}
          rowKey={(l) => l.id}
          loading={loading}
          searchPlaceholder="Kullanıcı veya işlem ara..."
          exportFilename="islem-gecmisi"
          emptyMessage="Henüz işlem kaydı yok."
        />
      </Card>
    </div>
  );
}
