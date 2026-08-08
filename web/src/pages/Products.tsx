import { useEffect, useState, type FormEvent } from "react";
import { api, type Product } from "../api/client";

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("adet");
  const [price, setPrice] = useState("");
  const [initialStock, setInitialStock] = useState("0");
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .products()
      .then(setProducts)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createProduct({
        name,
        unit,
        price: Number(price),
        initialStock: Number(initialStock),
      });
      setName("");
      setPrice("");
      setInitialStock("0");
      load();
    } catch {
      setError("Ürün eklenemedi. Alanları kontrol edin.");
    }
  }

  return (
    <div>
      <h2>Ürünler</h2>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Yeni Ürün Ekle</h3>
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
              <label>Fiyat (₺)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{ width: 110 }}
                required
              />
            </div>
            <div>
              <label>Başlangıç Stok</label>
              <input
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                style={{ width: 120 }}
              />
            </div>
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="actions">
            <button type="submit">Ekle</button>
          </div>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <p className="muted">Yükleniyor...</p>
        ) : products.length === 0 ? (
          <p className="empty-state">Henüz ürün eklenmedi.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Birim</th>
                <th>Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.unit}</td>
                  <td>{p.price.toLocaleString("tr-TR")} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
