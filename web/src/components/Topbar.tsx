import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, type AssignmentView, type Courier, type Product } from "../api/client";
import { hasPermission, ROLE_LABELS } from "../lib/permissions";
import { AlertTriangleIcon, BellIcon, MenuIcon, PackageIcon, SearchIcon, TruckIcon, ClipboardIcon } from "./icons";
import { NAV_GROUPS } from "./navConfig";

function usePageTitle() {
  const location = useLocation();
  return useMemo(() => {
    for (const group of NAV_GROUPS) {
      const match = group.items.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)));
      if (match) return { title: match.label, breadcrumb: `${group.title} / ${match.label}` };
    }
    if (location.pathname.startsWith("/zimmetler/")) return { title: "Zimmet Detayı", breadcrumb: "Operasyon / Zimmetler / Detay" };
    if (location.pathname.startsWith("/urunler/")) return { title: "Ürün Detayı", breadcrumb: "Stok & Ürün / Ürünler / Detay" };
    return { title: "SultanSu", breadcrumb: "" };
  }, [location.pathname]);
}

type SearchResult = { type: string; label: string; sublabel: string; to: string };

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { title, breadcrumb } = usePageTitle();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [assignments, setAssignments] = useState<AssignmentView[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState<Array<{ type: string; severity: string; message: string; entityId?: string }>>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    function onDocumentClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".topbar__menu")) {
        setSearchOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (hasPermission(user.role, "dashboard.view")) {
      api
        .dashboardSummary()
        .then((s) => setAlerts(s.alerts))
        .catch(() => {});
    }
  }, [user]);

  function loadSearchSources() {
    if (user && hasPermission(user.role, "product.view") && products.length === 0) {
      api.products().then(setProducts).catch(() => {});
    }
    if (user && (hasPermission(user.role, "user.view") || user.role === "WAREHOUSE" || user.role === "MANAGER" || user.role === "OWNER") && couriers.length === 0) {
      api.couriers().then(setCouriers).catch(() => {});
    }
    if (user && hasPermission(user.role, "assignment.view") && assignments.length === 0) {
      api.assignments().then(setAssignments).catch(() => {});
    }
  }

  const results: SearchResult[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: SearchResult[] = [];
    for (const p of products) {
      if (p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)) {
        out.push({ type: "Ürün", label: p.name, sublabel: p.code ?? "", to: `/urunler/${p.id}` });
      }
    }
    for (const c of couriers) {
      if (c.name.toLowerCase().includes(q) || c.phone.includes(q)) {
        out.push({ type: "Kurye", label: c.name, sublabel: c.phone, to: `/kuryeler` });
      }
    }
    for (const a of assignments) {
      if (a.courier.name.toLowerCase().includes(q)) {
        out.push({ type: "Zimmet", label: `${a.courier.name} zimmeti`, sublabel: new Date(a.createdAt).toLocaleDateString("tr-TR"), to: `/zimmetler/${a.id}` });
      }
    }
    return out.slice(0, 8);
  }, [query, products, couriers, assignments]);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button type="button" className="topbar__hamburger" onClick={onOpenSidebar} aria-label="Menü">
          <MenuIcon size={20} />
        </button>
        <div className="topbar__titles">
          <h2>{title}</h2>
          {breadcrumb && <div className="topbar__breadcrumb">{breadcrumb}</div>}
        </div>
      </div>

      <div className="topbar__right">
        <div className="topbar__menu">
          <div className="topbar__search">
            <SearchIcon size={15} />
            <input
              ref={searchRef}
              value={query}
              onFocus={() => {
                setSearchOpen(true);
                loadSearchSources();
              }}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara... (Ctrl+K)"
            />
          </div>
          {searchOpen && query.trim() && (
            <div className="dropdown-panel" style={{ left: 0, right: "auto", minWidth: 320 }}>
              <div className="dropdown-panel__list">
                {results.length === 0 ? (
                  <div className="dropdown-panel__empty">Sonuç bulunamadı.</div>
                ) : (
                  results.map((r, i) => (
                    <div
                      key={i}
                      className="dropdown-panel__item"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSearchOpen(false);
                        setQuery("");
                        navigate(r.to);
                      }}
                    >
                      <span className="dropdown-panel__item-icon dropdown-panel__item-icon--info">
                        {r.type === "Ürün" ? <PackageIcon size={13} /> : r.type === "Kurye" ? <TruckIcon size={13} /> : <ClipboardIcon size={13} />}
                      </span>
                      <span>
                        <div>{r.label}</div>
                        <div className="dropdown-panel__meta" style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>
                          {r.type} {r.sublabel && `· ${r.sublabel}`}
                        </div>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="topbar__menu">
          <button
            type="button"
            className="topbar__icon-btn"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Bildirimler"
          >
            <BellIcon size={18} />
            {alerts.length > 0 && <span className="topbar__badge-dot" />}
          </button>
          {notifOpen && (
            <div className="dropdown-panel">
              <div className="dropdown-panel__header">Canlı Uyarılar ({alerts.length})</div>
              <div className="dropdown-panel__list">
                {alerts.length === 0 ? (
                  <div className="dropdown-panel__empty">Şu anda uyarı yok.</div>
                ) : (
                  alerts.map((a, i) => (
                    <div className="dropdown-panel__item" key={i}>
                      <span
                        className={`dropdown-panel__item-icon dropdown-panel__item-icon--${
                          a.severity === "critical" ? "critical" : a.severity === "warning" ? "warning" : "info"
                        }`}
                      >
                        <AlertTriangleIcon size={13} />
                      </span>
                      <span>{a.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="topbar__menu">
          <button type="button" className="topbar__user" onClick={() => setUserMenuOpen((v) => !v)}>
            <span className="topbar__avatar">{user?.name?.slice(0, 1) ?? "?"}</span>
            <span>
              <div className="topbar__user-name">{user?.name}</div>
              <div className="topbar__user-role">{user ? ROLE_LABELS[user.role] : ""}</div>
            </span>
          </button>
          {userMenuOpen && (
            <div className="dropdown-panel" style={{ minWidth: 220 }}>
              <div className="dropdown-panel__header">{user?.name}</div>
              <div style={{ padding: "10px 16px", fontSize: "0.82rem", color: "var(--text-muted)" }}>{user?.phone}</div>
              <div className="dropdown-panel__footer">
                <button type="button" onClick={logout}>
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
