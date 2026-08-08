import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, stockStatus, type ProductDetail as ProductDetailType } from "../api/client";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { SkeletonCard } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";

const MOVEMENT_LABELS: Record<string, string> = {
  INITIAL: "Başlangıç Stoğu",
  ASSIGN: "Zimmet (Çıkış)",
  RETURN: "İade (Giriş)",
  ADJUSTMENT: "Düzeltme",
};

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .product(id)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <SkeletonCard lines={6} />;
  if (!product) return <p className="error-text">Ürün bulunamadı.</p>;

  const quantity = product.stockItem?.quantity ?? 0;
  const status = stockStatus(quantity, product.minStock);

  return (
    <div>
      <p>
        <Link to="/urunler">&larr; Ürünler</Link>
      </p>
      <h2>
        {product.name}{" "}
        {status === "NORMAL" ? (
          <Badge variant="success">Normal</Badge>
        ) : status === "CRITICAL" ? (
          <Badge variant="warning">Kritik</Badge>
        ) : (
          <Badge variant="danger">Tükendi</Badge>
        )}
      </h2>
      <p className="muted">Kod: {product.code ?? "-"}</p>

      <div className="dashboard-grid">
        <Card title="Genel & Fiyat Bilgileri">
          <table>
            <tbody>
              <tr>
                <td className="muted">Birim</td>
                <td>{product.unit}</td>
              </tr>
              <tr>
                <td className="muted">Satış Fiyatı</td>
                <td>{product.price.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr>
                <td className="muted">Alış Fiyatı</td>
                <td>{product.costPrice != null ? `${product.costPrice.toLocaleString("tr-TR")} ₺` : "-"}</td>
              </tr>
              <tr>
                <td className="muted">Durum</td>
                <td>{product.active ? "Aktif" : "Pasif"}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card title="Stok Bilgileri">
          <table>
            <tbody>
              <tr>
                <td className="muted">Depodaki Miktar</td>
                <td>
                  {quantity} {product.unit}
                </td>
              </tr>
              <tr>
                <td className="muted">Kritik Stok Eşiği</td>
                <td>
                  {product.minStock} {product.unit}
                </td>
              </tr>
              <tr>
                <td className="muted">Stok Değeri (satış fiyatı ile)</td>
                <td>{(quantity * product.price).toLocaleString("tr-TR")} ₺</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      <Card title="Stok Hareketleri">
        {product.movements.length === 0 ? (
          <EmptyState title="Henüz stok hareketi yok." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>İşlem</th>
                <th>Miktar</th>
                <th>Önceki &rarr; Sonraki</th>
                <th>Not</th>
              </tr>
            </thead>
            <tbody>
              {product.movements.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.createdAt).toLocaleString("tr-TR")}</td>
                  <td>{MOVEMENT_LABELS[m.type] ?? m.type}</td>
                  <td style={{ color: m.quantity >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td>
                    {m.previousQty} &rarr; {m.newQty}
                  </td>
                  <td className="muted">{m.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Satış Geçmişi">
        {product.sales.length === 0 ? (
          <EmptyState title="Henüz satış yok." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Kurye</th>
                <th>Miktar</th>
                <th>Toplam</th>
              </tr>
            </thead>
            <tbody>
              {product.sales.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.createdAt).toLocaleString("tr-TR")}</td>
                  <td>{s.courier.name}</td>
                  <td>{s.quantity}</td>
                  <td>{s.total.toLocaleString("tr-TR")} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
