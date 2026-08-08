import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Courier, type Product } from "../api/client";

type Row = { productId: string; quantity: string };

export function CreateAssignment() {
  const navigate = useNavigate();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [courierId, setCourierId] = useState("");
  const [rows, setRows] = useState<Row[]>([{ productId: "", quantity: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.couriers().then(setCouriers);
    api.products().then(setProducts);
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

    setSubmitting(true);
    try {
      const assignment = await api.createAssignment({ courierId, items });
      navigate(`/zimmetler/${assignment.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Zimmet oluşturulamadı";
      setError(message.includes("stok") ? "Depoda yeterli stok yok." : message.includes("409") ? "Bu kuryenin zaten açık bir zimmeti var." : "Zimmet oluşturulamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2>Zimmet Oluştur</h2>
      <p className="muted">Kuryeye teslim edeceğiniz ürün ve miktarları girin. Onaylandığında depo stoğundan otomatik düşülür.</p>

      <div className="card">
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

          <label>Ürünler</label>
          {rows.map((row, index) => (
            <div className="item-row" key={index}>
              <div className="grow">
                <select value={row.productId} onChange={(e) => updateRow(index, { productId: e.target.value })}>
                  <option value="">Ürün seçin</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  min="1"
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
          ))}
          <div style={{ marginTop: 10 }}>
            <button type="button" className="secondary" onClick={addRow}>
              + Ürün Ekle
            </button>
          </div>

          {error && <div className="error-text">{error}</div>}
          <div className="actions">
            <button type="submit" disabled={submitting}>
              Zimmeti Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
