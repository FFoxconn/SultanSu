import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogoMark } from "../components/LogoMark";
import { WaterLoader } from "../components/WaterLoader";

const FEATURES = [
  "Kuryeye anlık ürün zimmetleme",
  "Mobil uygulamadan saha satışı",
  "Gün sonu otomatik stok iadesi",
  "Zimmet, satış ve ciro raporları",
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(phone, password);
      navigate("/");
    } catch {
      setError("Telefon veya şifre hatalı");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-brand">
        <div className="login-brand__logo">
          <LogoMark size={34} />
          <span className="login-brand__logo-text">SultanSu</span>
        </div>

        <h1 className="login-brand__title">Su bayiniz için uçtan uca saha yönetimi</h1>
        <p className="login-brand__desc">
          Kuryelerinize zimmetlediğiniz ürünleri, saha satışlarını ve gün sonu iadelerini
          tek panelden anlık olarak takip edin.
        </p>

        <div className="login-brand__features">
          {FEATURES.map((feature) => (
            <div className="login-brand__feature" key={feature}>
              <span className="login-brand__feature-dot" />
              {feature}
            </div>
          ))}
        </div>
      </div>

      <div className="login-panel">
        <div className="login-box">
          <h1>Hoş Geldiniz</h1>
          <div className="subtitle">Patron / Bayi Yönetim Paneline Giriş Yapın</div>
          <form onSubmit={handleSubmit}>
            <label>Telefon</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5550000001"
              autoComplete="username"
              required
            />
            <label>Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && <div className="error-text">{error}</div>}
            <div className="actions">
              <button type="submit" className="btn-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <WaterLoader size="small" inverted />
                    Giriş yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </button>
            </div>
          </form>
          <div className="footer-note">© {new Date().getFullYear()} SultanSu Bayi Yönetim Sistemi</div>
        </div>
      </div>
    </div>
  );
}
