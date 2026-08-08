import { useEffect, useState, type FormEvent } from "react";
import { api, type AppUser, type Role } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { hasPermission, ROLE_LABELS } from "../lib/permissions";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge, type BadgeVariant } from "../components/Badge";
import { Modal } from "../components/Modal";
import { DataTable, type Column } from "../components/DataTable";
import { PlusIcon } from "../components/icons";

const ROLE_BADGE: Record<Role, BadgeVariant> = {
  OWNER: "info",
  MANAGER: "success",
  WAREHOUSE: "warning",
  COURIER: "neutral",
};

const ASSIGNABLE_ROLES: Role[] = ["MANAGER", "WAREHOUSE", "COURIER"];

export function Users() {
  const { user: me } = useAuth();
  const { showToast } = useToast();
  const canManage = hasPermission(me?.role, "user.manage");

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("COURIER");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api
      .users()
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createUser({ name, phone, password, role });
      setName("");
      setPhone("");
      setPassword("");
      setRole("COURIER");
      setAddOpen(false);
      showToast("Kullanıcı başarıyla oluşturuldu.");
      load();
    } catch {
      setError("Kullanıcı oluşturulamadı. Telefon numarası zaten kayıtlı olabilir.");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<AppUser>[] = [
    { key: "name", header: "Ad Soyad", render: (u) => u.name, csvValue: (u) => u.name, sortValue: (u) => u.name },
    { key: "phone", header: "Telefon", render: (u) => u.phone, csvValue: (u) => u.phone },
    { key: "role", header: "Rol", render: (u) => <Badge variant={ROLE_BADGE[u.role]}>{ROLE_LABELS[u.role]}</Badge>, csvValue: (u) => ROLE_LABELS[u.role] },
    {
      key: "active",
      header: "Durum",
      render: (u) => <Badge variant={u.active ? "success" : "neutral"}>{u.active ? "Aktif" : "Pasif"}</Badge>,
      csvValue: (u) => (u.active ? "Aktif" : "Pasif"),
    },
    {
      key: "createdAt",
      header: "Kayıt Tarihi",
      render: (u) => new Date(u.createdAt).toLocaleDateString("tr-TR"),
      csvValue: (u) => new Date(u.createdAt).toLocaleDateString("tr-TR"),
      sortValue: (u) => new Date(u.createdAt).getTime(),
    },
  ];

  return (
    <div>
      <div className="dashboard-header">
        <h2 style={{ margin: 0 }}>Kullanıcılar</h2>
        {canManage && (
          <Button onClick={() => setAddOpen(true)} icon={<PlusIcon size={15} />}>
            Kullanıcı Ekle
          </Button>
        )}
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={users}
          rowKey={(u) => u.id}
          loading={loading}
          searchPlaceholder="Ad veya telefon ara..."
          exportFilename="kullanicilar"
          emptyMessage="Henüz kullanıcı yok."
        />
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Yeni Kullanıcı Ekle" width={480}>
        <form onSubmit={handleSubmit}>
          <label>Ad Soyad</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          <label>Telefon</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <label>Şifre</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} required />
          <label>Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          {error && <div className="error-text">{error}</div>}
          <div className="actions">
            <Button type="submit" loading={submitting}>
              Kullanıcıyı Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
