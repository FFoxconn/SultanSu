import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogoMark } from "./LogoMark";

const links = [
  { to: "/", label: "Panel", end: true },
  { to: "/zimmet-olustur", label: "Zimmet Oluştur" },
  { to: "/zimmetler", label: "Zimmetler" },
  { to: "/depo", label: "Depo / Stok" },
  { to: "/urunler", label: "Ürünler" },
  { to: "/kuryeler", label: "Kuryeler" },
  { to: "/raporlar", label: "Raporlar" },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <LogoMark size={26} />
          <h1>SultanSu</h1>
        </div>
        <div className="subtitle">Bayi Yönetim Paneli</div>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="user-box">
          <div>{user?.name}</div>
          <div className="muted" style={{ fontSize: "0.78rem" }}>
            {user?.phone}
          </div>
          <button className="secondary" onClick={logout}>
            Çıkış Yap
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
