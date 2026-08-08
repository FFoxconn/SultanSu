import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, stockStatus, type Product, type StockItem } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { hasPermission } from "../lib/permissions";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { DataTable, type Column } from "../components/DataTable";
import { SkeletonCard } from "../components/Skeleton";

type ProductRow = Product & { quantity: number };

export function Products() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const canManage = hasPermission(user?.role, "product.manage");

  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("adet");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [minStock, setMinStock] = useState("0");
  const [initialStock, setInitialStock] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createProduct({
        name,
        unit,
        price: Number(price),
        initialStock: Number(initialStock),
        minStock: Number(minStock) || 0,
        costPrice: costPrice ? Number(costPrice) : undefined,
      });
      setName("");
      setPrice("");
      setCostPrice("");
      setMinStock("0");
      setInitialStock("0");
      showToast("Ürün başarıyla eklendi.");
      load();
    } catch {
      setError("Ürün eklenemedi. Alanları kontrol edin.");
    } finally {
      setSubmitting(false);
    }
  }

  const quantityByProduct = new Map(stock.map((s) => [s.productId, s.quantity]));
  const rows: ProductRow[] = products.map((p) => ({ ...p, quantity: quantityByProduct.get(p.id) ?? 0 }));

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
        ] as Column<ProductRow>[])
      : []),
  ];

  if (loading) return <SkeletonCard lines={5} />;

  return (
    <div>
      <h2>Ürünler</h2>

      {canManage && (
        <Card title="Yeni Ürün Ekle">
          <form onSubmit={handleSubmit}>
            <div className="item-row">
              <div className="grow">
                <label>Ürün Adı</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="19L Damacana" required />
              </div>
              <div>
                <label>Birim</label>
                <input value={unit} onChange={(e) => setUnit(e.target.value)} style={{ width: 100 }} />
              </div>
              <div>
                <label>Satış Fiyatı (₺)</label>
                <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: 120 }} required />
              </div>
            </div>
            <div className="item-row">
              <div>
                <label>Alış Fiyatı (₺, opsiyonel)</label>
                <input type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} style={{ width: 140 }} />
              </div>
              <div>
                <label>Kritik Stok Eşiği</label>
                <input type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} style={{ width: 130 }} />
              </div>
              <div>
                <label>Başlangıç Stok</label>
                <input type="number" min="0" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} style={{ width: 130 }} />
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
          rowKey={(p) => p.id}
          searchPlaceholder="Ürün adı veya kod ara..."
          exportFilename="urunler"
          emptyMessage="Henüz ürün eklenmedi."
          onRowClick={canManage ? (p) => navigate(`/urunler/${p.id}`) : undefined}
        />
      </Card>
    </div>
  );
}
