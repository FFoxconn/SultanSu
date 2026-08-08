import { useEffect, useState, type FormEvent } from "react";
import { api, type AssignmentView, type Courier } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { hasPermission } from "../lib/permissions";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { DataTable, type Column } from "../components/DataTable";
import { Drawer } from "../components/Drawer";
import { SkeletonCard } from "../components/Skeleton";

type CourierRow = Courier & {
  status: "Sahada" | "Müsait" | "Pasif";
  totalAssigned: number;
  totalSold: number;
  totalReturned: number;
  totalRevenue: number;
  lastActivity: string | null;
};

export function Couriers() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canManage = hasPermission(user?.role, "user.manage") || user?.role === "MANAGER" || user?.role === "OWNER";

  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [assignments, setAssignments] = useState<AssignmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CourierRow | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.couriers(), api.assignments()])
      .then(([c, a]) => {
        setCouriers(c);
        setAssignments(a);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createCourier({ name, phone, password });
      setName("");
      setPhone("");
      setPassword("");
      showToast("Kurye başarıyla eklendi.");
      load();
    } catch {
      setError("Kurye eklenemedi. Telefon numarası zaten kayıtlı olabilir.");
    } finally {
      setSubmitting(false);
    }
  }

  const rows: CourierRow[] = couriers.map((c) => {
    const own = assignments.filter((a) => a.courier.id === c.id);
    const hasOpen = own.some((a) => a.status === "OPEN");
    const totalAssigned = own.reduce((s, a) => s + a.items.reduce((x, i) => x + i.quantityAssigned, 0), 0);
    const totalSold = own.reduce((s, a) => s + a.items.reduce((x, i) => x + i.quantitySold, 0), 0);
    const totalReturned = own.reduce((s, a) => s + a.items.reduce((x, i) => x + (i.quantityReturned ?? 0), 0), 0);
    const totalRevenue = own.reduce((s, a) => s + a.totalSalesAmount, 0);
    const lastActivity = own.length > 0 ? own.map((a) => a.createdAt).sort().reverse()[0] : null;

    return {
      ...c,
      status: hasOpen ? "Sahada" : c.active ? "Müsait" : "Pasif",
      totalAssigned,
      totalSold,
      totalReturned,
      totalRevenue,
      lastActivity,
    };
  });

  const columns: Column<CourierRow>[] = [
    { key: "name", header: "Kurye", render: (c) => c.name, csvValue: (c) => c.name, sortValue: (c) => c.name },
    {
      key: "status",
      header: "Durum",
      render: (c) => <Badge variant={c.status === "Sahada" ? "warning" : c.status === "Müsait" ? "success" : "neutral"}>{c.status}</Badge>,
      csvValue: (c) => c.status,
    },
    { key: "totalAssigned", header: "Zimmet", render: (c) => c.totalAssigned, csvValue: (c) => c.totalAssigned, align: "right", sortValue: (c) => c.totalAssigned },
    { key: "totalSold", header: "Satış", render: (c) => c.totalSold, csvValue: (c) => c.totalSold, align: "right", sortValue: (c) => c.totalSold },
    { key: "totalReturned", header: "İade", render: (c) => c.totalReturned, csvValue: (c) => c.totalReturned, align: "right" },
    {
      key: "totalRevenue",
      header: "Ciro",
      render: (c) => `${c.totalRevenue.toLocaleString("tr-TR")} ₺`,
      csvValue: (c) => c.totalRevenue,
      sortValue: (c) => c.totalRevenue,
      align: "right",
    },
    {
      key: "salesRate",
      header: "Satış Oranı",
      render: (c) => (c.totalAssigned > 0 ? `%${Math.round((c.totalSold / c.totalAssigned) * 100)}` : "-"),
      csvValue: (c) => (c.totalAssigned > 0 ? Math.round((c.totalSold / c.totalAssigned) * 100) : ""),
    },
    {
      key: "lastActivity",
      header: "Son İşlem",
      render: (c) => (c.lastActivity ? new Date(c.lastActivity).toLocaleDateString("tr-TR") : "-"),
      csvValue: (c) => (c.lastActivity ? new Date(c.lastActivity).toLocaleDateString("tr-TR") : ""),
    },
  ];

  if (loading) return <SkeletonCard lines={5} />;

  const selectedAssignments = selected ? assignments.filter((a) => a.courier.id === selected.id).slice(0, 8) : [];

  return (
    <div>
      <h2>Kuryeler</h2>

      {canManage && (
        <Card title="Yeni Kurye Ekle">
          <form onSubmit={handleSubmit}>
            <div className="item-row">
              <div className="grow">
                <label>Ad Soyad</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grow">
                <label>Telefon</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="grow">
                <label>Mobil Uygulama Şifresi</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} required />
              </div>
            </div>
            {error && <div className="error-text">{error}</div>}
            <div className="actions">
              <Button type="submit" loading={submitting}>
                Ekle
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(c) => c.id}
          searchPlaceholder="Kurye ara..."
          exportFilename="kuryeler"
          emptyMessage="Henüz kurye eklenmedi."
          onRowClick={setSelected}
        />
      </Card>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""}>
        {selected && (
          <>
            <p className="muted" style={{ marginTop: -8 }}>
              {selected.phone}
            </p>
            <Badge variant={selected.status === "Sahada" ? "warning" : selected.status === "Müsait" ? "success" : "neutral"}>
              {selected.status}
            </Badge>

            <div className="stat-row" style={{ marginTop: 18 }}>
              <div className="stat">
                <div className="label">Toplam Zimmet</div>
                <div className="value">{selected.totalAssigned}</div>
              </div>
              <div className="stat">
                <div className="label">Toplam Satış</div>
                <div className="value">{selected.totalSold}</div>
              </div>
            </div>
            <div className="stat-row">
              <div className="stat">
                <div className="label">Toplam İade</div>
                <div className="value">{selected.totalReturned}</div>
              </div>
              <div className="stat">
                <div className="label">Toplam Ciro</div>
                <div className="value">{selected.totalRevenue.toLocaleString("tr-TR")} ₺</div>
              </div>
            </div>

            <h3 style={{ fontSize: "0.95rem", marginTop: 24 }}>Son Zimmetler</h3>
            {selectedAssignments.length === 0 ? (
              <p className="empty-state">Henüz zimmet oluşturulmadı.</p>
            ) : (
              <div className="timeline">
                {selectedAssignments.map((a) => (
                  <div className="timeline-item" key={a.id}>
                    <div>
                      <div className="timeline-item__body">
                        {new Date(a.createdAt).toLocaleDateString("tr-TR")} ·{" "}
                        <span className={`badge ${a.status === "OPEN" ? "open" : "closed"}`}>
                          {a.status === "OPEN" ? "Sahada" : "Kapandı"}
                        </span>
                      </div>
                      <div className="timeline-item__meta">
                        {a.items.length} ürün kalemi · {a.totalSalesAmount.toLocaleString("tr-TR")} ₺ ciro
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
