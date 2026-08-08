import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
      <div className="login-box">
        <h1>SultanSu</h1>
        <div className="subtitle">Patron / Bayi Girişi</div>
        <form onSubmit={handleSubmit}>
          <label>Telefon</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5550000001" required />
          <label>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="error-text">{error}</div>}
          <div className="actions">
            <button type="submit" disabled={submitting}>
              Giriş Yap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
