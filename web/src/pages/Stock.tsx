import { useEffect, useState } from "react";
import { api, type StockItem } from "../api/client";

export function Stock() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .stock()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Depo / Merkez Stok</h2>
      <div className="card">
        {loading ? (
          <p className="muted">Yükleniyor...</p>
        ) : items.length === 0 ? (
          <p className="empty-state">Depoda ürün yok.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Depodaki Miktar</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product.name}</td>
                  <td>
                    {item.quantity} {item.product.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
