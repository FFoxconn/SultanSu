import { useEffect, useState, type FormEvent } from "react";
import { api, type Courier } from "../api/client";

export function Couriers() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .couriers()
      .then(setCouriers)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createCourier({ name, phone, password });
      setName("");
      setPhone("");
      setPassword("");
      load();
    } catch {
      setError("Kurye eklenemedi. Telefon numarası zaten kayıtlı olabilir.");
    }
  }

  return (
    <div>
      <h2>Kuryeler</h2>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Yeni Kurye Ekle</h3>
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={4}
                required
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
        ) : couriers.length === 0 ? (
          <p className="empty-state">Henüz kurye eklenmedi.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ad</th>
                <th>Telefon</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {couriers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.active ? "Aktif" : "Pasif"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
