import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogoMark } from "./LogoMark";
import { Topbar } from "./Topbar";
import { NAV_GROUPS } from "./navConfig";
import { hasPermission, ROLE_LABELS } from "../lib/permissions";
import { ChevronLeftIcon, LogOutIcon, MenuIcon } from "./icons";

export function Layout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!user) return false;
      if (item.roles) return item.roles.includes(user.role);
      if (item.permission) return hasPermission(user.role, item.permission);
      return true;
    }),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="app-shell">
      {mobileOpen && <div className="sidebar-overlay open" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar__brand">
          <LogoMark size={26} />
          <h1>SultanSu</h1>
        </div>
        <div className="subtitle">Bayi Yönetim Paneli</div>

        <nav>
          {visibleGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-group__title">{group.title}</div>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)}>
                  <span className="nav-link__icon">{item.icon}</span>
                  <span className="nav-link__label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <button type="button" className="sidebar__collapse-btn" onClick={() => setCollapsed((v) => !v)} aria-label="Menüyü daralt/genişlet">
          {collapsed ? <MenuIcon size={16} /> : <ChevronLeftIcon size={16} />}
        </button>

        <div className="user-box">
          <div className="user-box__details">
            <div>{user?.name}</div>
            <div className="muted" style={{ fontSize: "0.78rem" }}>
              {user ? ROLE_LABELS[user.role] : ""} · {user?.phone}
            </div>
          </div>
          <button className="secondary" onClick={logout} title="Çıkış Yap">
            <LogOutIcon size={15} />
            {!collapsed && <span>Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      <div className="content-area">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
