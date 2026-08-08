import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Courier, type DashboardSummary, type StockItem } from "../api/client";
import { useToast } from "../context/ToastContext";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { StatCard } from "../components/StatCard";
import { Stepper } from "../components/Stepper";
import { PackageIcon, TruckIcon, ClipboardIcon } from "../components/icons";

type Row = { productId: string; quantity: string };

const STEPS = ["Kurye Seç", "Ürün ve Miktar", "Onayla ve Oluştur"];

export function CreateAssignment() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [courierId, setCourierId] = useState("");
  const [rows, setRows] = useState<Row[]>([{ productId: "", quantity: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.couriers().then(setCouriers);
    api.stock().then(setStock);
    api.dashboardSummary().then(setSummary).catch(() => {});
  }, []);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { productId: "", quantity: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const stockByProduct = new Map(stock.map((s) => [s.productId, s]));
  const selectedCourier = couriers.find((c) => c.id === courierId);

  const summaryRows = rows
    .filter((r) => r.productId && Number(r.quantity) > 0)
    .map((r) => ({ row: r, item: stockByProduct.get(r.productId) }));

  const activeStep = !courierId ? 0 : summaryRows.length === 0 ? 1 : 2;
  const totalStock = stock.reduce((sum, s) => sum + s.quantity, 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const items = rows
      .filter((r) => r.productId && Number(r.quantity) > 0)
      .map((r) => ({ productId: r.productId, quantity: Number(r.quantity) }));

    if (!courierId || items.length === 0) {
      setError("Kurye ve en az bir ürün/miktar seçmelisiniz.");
      return;
    }

    const insufficient = items.find((i) => {
      const s = stockByProduct.get(i.productId);
      return s && i.quantity > s.quantity;
    });
    if (insufficient) {
      setError("Girdiğiniz miktar depodaki mevcut stoktan fazla.");
      return;
    }

    setSubmitting(true);
    try {
      const assignment = await api.createAssignment({ courierId, items });
      showToast(`${selectedCourier?.name ?? "Kurye"} için zimmet başarıyla oluşturuldu.`);
      navigate(`/zimmetler/${assignment.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Zimmet oluşturulamadı";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2>Zimmet Oluştur</h2>
      <p className="muted">Kuryeye teslim edeceğiniz ürün ve miktarları girin. Onaylandığında depo stoğundan otomatik düşülür.</p>

      <div className="stat-row">
        <StatCard icon={<TruckIcon size={19} />} label="Aktif Kurye (Sahada)" value={summary?.kpis.activeCourierCount ?? "-"} />
        <StatCard icon={<ClipboardIcon size={19} />} label="Bugün Açılan Zimmet" value={summary?.kpis.assignedToday ?? "-"} />
        <StatCard icon={<PackageIcon size={19} />} label="Depo Toplam Stok" value={totalStock} />
      </div>

      <Card>
        <Stepper steps={STEPS} activeIndex={activeStep} />

        <form onSubmit={handleSubmit}>
          <label>Kurye</label>
          <select value={courierId} onChange={(e) => setCourierId(e.target.value)} required>
            <option value="">Kurye seçin</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>

          <label>Ürün ve Miktar</label>
          {rows.map((row, index) => {
            const item = stockByProduct.get(row.productId);
            return (
              <div className="item-row" key={index}>
                <div className="grow">
                  <select value={row.productId} onChange={(e) => updateRow(index, { productId: e.target.value })}>
                    <option value="">Ürün seçin</option>
                    {stock.map((s) => (
                      <option key={s.productId} value={s.productId}>
                        {s.product.name} {s.product.code ? `(${s.product.code})` : ""} — Stok: {s.quantity} {s.product.unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    max={item?.quantity}
                    placeholder="Miktar"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, { quantity: e.target.value })}
                    style={{ width: 110 }}
                  />
                </div>
                <button type="button" className="secondary" onClick={() => removeRow(index)} disabled={rows.length === 1}>
                  Sil
                </button>
              </div>
            );
          })}
          <div style={{ marginTop: 10 }}>
            <button type="button" className="secondary" onClick={addRow}>
              + Ürün Ekle
            </button>
          </div>

          {summaryRows.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <label>Özet</label>
              <table>
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Miktar</th>
                    <th>Depoda Kalan (sonrası)</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map(({ row, item }, i) => (
                    <tr key={i}>
                      <td>{item?.product.name ?? "-"}</td>
                      <td>
                        {row.quantity} {item?.product.unit}
                      </td>
                      <td>{item ? item.quantity - Number(row.quantity) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && <div className="error-text">{error}</div>}
          <div className="actions">
            <Button type="submit" loading={submitting}>
              Zimmeti Onayla ve Oluştur
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
