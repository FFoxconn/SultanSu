import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogoMark } from "../components/LogoMark";
import { Spinner } from "../components/Spinner";
import { CheckIcon, EyeIcon, EyeOffIcon, LockIcon, PhoneIcon, ShieldIcon } from "../components/icons";

const FEATURES = [
  "Hızlı sipariş ve zimmet yönetimi",
  "Güncel stok ve cari bilgiler",
  "Kolay ve güvenli erişim",
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const phoneId = useId();
  const passwordId = useId();
  const rememberId = useId();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(phone, password, remember);
      navigate("/");
    } catch {
      setError("Telefon numarası veya şifre hatalı.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-brand">
        <div className="login-brand__logo">
          <LogoMark size={32} />
          <span className="login-brand__logo-text">SultanSu</span>
        </div>

        <p className="login-brand__eyebrow">Bayi Yönetim Sistemi</p>
        <h1 className="login-brand__title">Bayileriniz için merkezi yönetim platformu</h1>
        <p className="login-brand__desc">
          Satış, sipariş ve bayi işlemlerinizi tek merkezden yönetin.
        </p>

        <ul className="login-brand__features">
          {FEATURES.map((feature) => (
            <li className="login-brand__feature" key={feature}>
              <span className="login-brand__feature-icon">
                <CheckIcon size={12} />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="login-panel">
        <div className="login-box fade-in-up">
          <div className="login-box__header">
            <LogoMark size={30} />
            <span className="login-brand__logo-text login-box__logo-text">SultanSu</span>
          </div>

          <h1>Bayi Portalına Hoş Geldiniz</h1>
          <p className="subtitle">Hesabınıza giriş yaparak bayi panelinize erişin.</p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor={phoneId}>Telefon Numarası</label>
            <div className="input-icon-group">
              <PhoneIcon size={17} className="input-icon" />
              <input
                id={phoneId}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                inputMode="tel"
                autoComplete="username"
                required
              />
            </div>

            <label htmlFor={passwordId}>Şifre</label>
            <div className="input-icon-group">
              <LockIcon size={17} className="input-icon" />
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-icon-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                aria-pressed={showPassword}
                tabIndex={0}
              >
                {showPassword ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
              </button>
            </div>

            <div className="login-box__row">
              <label className="checkbox-label" htmlFor={rememberId}>
                <input
                  id={rememberId}
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Beni Hatırla
              </label>
            </div>

            {error && (
              <div className="error-text" role="alert">
                {error}
              </div>
            )}

            <div className="actions">
              <button type="submit" className="btn-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner size={16} />
                    Giriş yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </button>
            </div>
          </form>

          <div className="trust-note">
            <ShieldIcon size={14} />
            Güvenli bayi erişimi
          </div>

          <div className="footer-note">© {new Date().getFullYear()} SultanSu • Tüm hakları saklıdır</div>
        </div>
      </div>
    </div>
  );
}
