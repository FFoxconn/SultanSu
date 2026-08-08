import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, stockStatus, type Product, type StockItem } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { hasPermission } from "../lib/permissions";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { StatCard } from "../components/StatCard";
import { Modal } from "../components/Modal";
import { RowMenu } from "../components/RowMenu";
import { DataTable, type Column } from "../components/DataTable";
import { SkeletonCard } from "../components/Skeleton";
import { AlertTriangleIcon, EditIcon, HistoryIcon, PackageIcon, PlusIcon, WalletIcon } from "../components/icons";

type ProductRow = Product & { quantity: number };

const EMPTY_ADD_FORM = { name: "", unit: "adet", price: "", costPrice: "", minStock: "0", initialStock: "0" };

export function Products() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const canManage = hasPermission(user?.role, "product.manage");

  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: "", unit: "", price: "", costPrice: "", minStock: "", code: "", active: true });
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.products(), canManage ? api.stock() : Promise.resolve([])])
      .then(([p, s]) => {
        setProducts(p);
        setStock(s);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [canManage]);

  async function handleAddSubmit(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    setSubmitting(true);
    try {
      await api.createProduct({
        name: addForm.name,
        unit: addForm.unit,
        price: Number(addForm.price),
        initialStock: Number(addForm.initialStock) || 0,
        minStock: Number(addForm.minStock) || 0,
        costPrice: addForm.costPrice ? Number(addForm.costPrice) : undefined,
      });
      setAddForm(EMPTY_ADD_FORM);
      setAddOpen(false);
      showToast("Ürün başarıyla eklendi.");
      load();
    } catch {
      setAddError("Ürün eklenemedi. Alanları kontrol edin.");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(product: Product) {
    setEditing(product);
    setEditForm({
      name: product.name,
      unit: product.unit,
      price: String(product.price),
      costPrice: product.costPrice != null ? String(product.costPrice) : "",
      minStock: String(product.minStock),
      code: product.code ?? "",
      active: product.active,
    });
    setEditError(null);
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);
    setSavingEdit(true);
    try {
      await api.updateProduct(editing.id, {
        name: editForm.name,
        unit: editForm.unit,
        price: Number(editForm.price),
        costPrice: editForm.costPrice ? Number(editForm.costPrice) : undefined,
        minStock: Number(editForm.minStock) || 0,
        code: editForm.code || undefined,
        active: editForm.active,
      });
      showToast("Ürün güncellendi.");
      setEditing(null);
      load();
    } catch {
      setEditError("Ürün güncellenemedi. Alanları kontrol edin.");
    } finally {
      setSavingEdit(false);
    }
  }

  const quantityByProduct = new Map(stock.map((s) => [s.productId, s.quantity]));
  const rows: ProductRow[] = products.map((p) => ({ ...p, quantity: quantityByProduct.get(p.id) ?? 0 }));

  const activeCount = products.filter((p) => p.active).length;
  const criticalCount = rows.filter((p) => stockStatus(p.quantity, p.minStock) !== "NORMAL").length;
  const totalStockValue = rows.reduce((sum, p) => sum + p.quantity * p.price, 0);

  const columns: Column<ProductRow>[] = [
    { key: "code", header: "Kod", render: (p) => p.code ?? "-", csvValue: (p) => p.code ?? "" },
    { key: "name", header: "Ürün", render: (p) => p.name, csvValue: (p) => p.name, sortValue: (p) => p.name },
    { key: "unit", header: "Birim", render: (p) => p.unit, csvValue: (p) => p.unit },
    {
      key: "price",
      header: "Satış Fiyatı",
      render: (p) => `${p.price.toLocaleString("tr-TR")} ₺`,
      csvValue: (p) => p.price,
      sortValue: (p) => p.price,
      align: "right",
    },
    ...(canManage
      ? ([
          {
            key: "costPrice",
            header: "Alış Fiyatı",
            render: (p) => (p.costPrice != null ? `${p.costPrice.toLocaleString("tr-TR")} ₺` : "-"),
            csvValue: (p) => p.costPrice ?? "",
            align: "right",
          },
          {
            key: "quantity",
            header: "Stok",
            render: (p) => `${p.quantity} ${p.unit}`,
            csvValue: (p) => p.quantity,
            sortValue: (p) => p.quantity,
            align: "right",
          },
          {
            key: "status",
            header: "Durum",
            render: (p) => {
              const status = stockStatus(p.quantity, p.minStock);
              return status === "NORMAL" ? (
                <Badge variant="success">Normal</Badge>
              ) : status === "CRITICAL" ? (
                <Badge variant="warning">Kritik</Badge>
              ) : (
                <Badge variant="danger">Tükendi</Badge>
              );
            },
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (p) => (
              <RowMenu
                actions={[
                  { label: "Düzenle", icon: <EditIcon size={14} />, onClick: () => openEdit(p) },
                  { label: "Stok Hareketleri", icon: <HistoryIcon size={14} />, onClick: () => navigate(`/stok-hareketleri?productId=${p.id}`) },
                ]}
              />
            ),
          },
        ] as Column<ProductRow>[])
      : []),
  ];

  if (loading) return <SkeletonCard lines={5} />;

  return (
    <div>
      <div className="dashboard-header">
        <h2 style={{ margin: 0 }}>Ürünler</h2>
        {canManage && (
          <Button onClick={() => setAddOpen(true)} icon={<PlusIcon size={15} />}>
            Ürün Ekle
          </Button>
        )}
      </div>

      {canManage && (
        <div className="stat-row">
          <StatCard icon={<PackageIcon size={19} />} label="Toplam Ürün" value={products.length} />
          <StatCard icon={<PackageIcon size={19} />} label="Aktif Ürün" value={activeCount} />
          <StatCard icon={<AlertTriangleIcon size={19} />} label="Kritik/Tükenen Stok" value={criticalCount} tone={criticalCount > 0 ? "warning" : "neutral"} />
          <StatCard icon={<WalletIcon size={19} />} label="Toplam Stok Değeri" value={`${totalStockValue.toLocaleString("tr-TR")} ₺`} />
        </div>
      )}

      <Card>
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(p) => p.id}
          searchPlaceholder="Ürün adı veya kod ara..."
          exportFilename="urunler"
          emptyMessage="Henüz ürün eklenmedi."
          onRowClick={canManage ? (p) => navigate(`/urunler/${p.id}`) : undefined}
        />
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Yeni Ürün Ekle" width={520}>
        <form onSubmit={handleAddSubmit}>
          <label>Ürün Adı</label>
          <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="19L Damacana" required />

          <div className="item-row">
            <div className="grow">
              <label>Birim</label>
              <input value={addForm.unit} onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })} />
            </div>
            <div className="grow">
              <label>Satış Fiyatı (₺)</label>
              <input type="number" min="0" step="0.01" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} required />
            </div>
          </div>
          <div className="item-row">
            <div className="grow">
              <label>Alış Fiyatı (₺, opsiyonel)</label>
              <input type="number" min="0" step="0.01" value={addForm.costPrice} onChange={(e) => setAddForm({ ...addForm, costPrice: e.target.value })} />
            </div>
            <div className="grow">
              <label>Kritik Stok Eşiği</label>
              <input type="number" min="0" value={addForm.minStock} onChange={(e) => setAddForm({ ...addForm, minStock: e.target.value })} />
            </div>
            <div className="grow">
              <label>Başlangıç Stok</label>
              <input type="number" min="0" value={addForm.initialStock} onChange={(e) => setAddForm({ ...addForm, initialStock: e.target.value })} />
            </div>
          </div>
          {addError && <div className="error-text">{addError}</div>}
          <div className="actions">
            <Button type="submit" loading={submitting}>
              Ürünü Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`"${editing?.name}" Düzenle`} width={520}>
        <form onSubmit={handleEditSubmit}>
          <label>Ürün Adı</label>
          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />

          <div className="item-row">
            <div className="grow">
              <label>Ürün Kodu</label>
              <input value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} />
            </div>
            <div className="grow">
              <label>Birim</label>
              <input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} />
            </div>
          </div>
          <div className="item-row">
            <div className="grow">
              <label>Satış Fiyatı (₺)</label>
              <input type="number" min="0" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} required />
            </div>
            <div className="grow">
              <label>Alış Fiyatı (₺)</label>
              <input type="number" min="0" step="0.01" value={editForm.costPrice} onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })} />
            </div>
            <div className="grow">
              <label>Kritik Stok Eşiği</label>
              <input type="number" min="0" value={editForm.minStock} onChange={(e) => setEditForm({ ...editForm, minStock: e.target.value })} />
            </div>
          </div>

          <label className="checkbox-label" style={{ marginTop: 16 }}>
            <input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} />
            Aktif
          </label>

          <p className="muted" style={{ fontSize: "0.8rem", marginTop: 14 }}>
            Stok miktarı buradan değiştirilemez — zimmet/iade hareketleriyle otomatik güncellenir.
          </p>

          {editError && <div className="error-text">{editError}</div>}
          <div className="actions">
            <Button type="submit" loading={savingEdit}>
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
