import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import medicareLogo from "../assets/images/medicare-logo.png";
import { useAuth } from "../features/auth/AuthContext";

type IconProps = { children: React.ReactNode };

function Icon({ children }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="admin-nav__icon">
      {children}
    </svg>
  );
}

const navItems = [
  { to: "/admin", end: true, label: "Tổng quan", icon: "overview" },
  { to: "/admin/appointments", label: "Lịch hẹn", icon: "appointments" },
  { to: "/admin/patients", label: "Bệnh nhân", icon: "patients" },
  { to: "/admin/doctors", label: "Bác sĩ", icon: "doctors", adminOnly: true },
  { to: "/admin/specialties", label: "Chuyên khoa", icon: "specialties", adminOnly: true },
  { to: "/admin/employees", label: "Nhân viên", icon: "employees", adminOnly: true },
] as const;

function NavIcon({ name }: { name: (typeof navItems)[number]["icon"] }) {
  if (name === "overview") {
    return <Icon><path d="M4 4h7v7H4V4Zm9 0h7v5h-7V4ZM4 13h7v7H4v-7Zm9-2h7v9h-7v-9Z" fill="currentColor" /></Icon>;
  }
  if (name === "patients") {
    return <Icon><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" fill="currentColor" /></Icon>;
  }
  if (name === "appointments") {
    return <Icon><path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2h2V2Zm12 8H5v8h14v-8ZM7 12h4v4H7v-4Z" fill="currentColor" /></Icon>;
  }
  if (name === "doctors") {
    return <Icon><path d="M9 3a3 3 0 0 0-3 3v3a6 6 0 0 0 12 0V6a3 3 0 0 0-3-3h-1v2h1a1 1 0 0 1 1 1v3a4 4 0 0 1-8 0V6a1 1 0 0 1 1-1h1V3H9Zm3 12c-4.4 0-8 2-8 4.5V21h16v-1.5C20 17 16.4 15 12 15Z" fill="currentColor" /></Icon>;
  }
  if (name === "specialties") {
    return <Icon><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z" fill="currentColor" /></Icon>;
  }
  return <Icon><path d="M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8.5 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 13c-3.9 0-7 2-7 4.5V20h11v-2.5c0-1.2.5-2.3 1.4-3.2A10.6 10.6 0 0 0 8 13Zm8.5 1c-1 0-2 .2-2.8.5.8.9 1.3 1.9 1.3 3V20h7v-2c0-2.2-2.5-4-5.5-4Z" fill="currentColor" /></Icon>;
}

const pageNames: Record<string, string> = {
  "/admin": "Tổng quan",
  "/admin/appointments": "Lịch hẹn",
  "/admin/patients": "Bệnh nhân",
  "/admin/doctors": "Bác sĩ",
  "/admin/specialties": "Chuyên khoa",
  "/admin/employees": "Nhân viên",
};

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className={`admin-shell${menuOpen ? " admin-shell--menu-open" : ""}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar__top">
          <NavLink className="admin-sidebar__brand" to="/admin" aria-label="Medicare - Tổng quan quản trị" onClick={() => setMenuOpen(false)}>
            <img className="admin-sidebar__brand-logo" src={medicareLogo} alt="Medicare" />
            <span className="admin-sidebar__space">Hệ thống quản trị</span>
          </NavLink>

          <nav className="admin-sidebar__nav" aria-label="Điều hướng nội bộ">
            <p className="admin-sidebar__label">Quản lý</p>
            {navItems
              .filter((item) => !("adminOnly" in item) || user?.role === "ADMIN")
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={"end" in item ? item.end : false}
                  className="admin-nav__item"
                  onClick={() => setMenuOpen(false)}
                >
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
          </nav>
        </div>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <Avatar className="admin-sidebar__avatar">
              <AvatarFallback>{(user?.full_name?.[0] ?? "U").toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="admin-sidebar__user-text">
              <p className="admin-sidebar__name">{user?.full_name}</p>
              <p className="admin-sidebar__role">
                {user?.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" className="admin-sidebar__logout" onClick={onLogout}>
            <Icon><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5v-2H5V6h5V4Zm4.6 4.2L20 12l-5.4 3.8v-2.6H9v-2.4h5.6V8.2Z" fill="currentColor" /></Icon>
            <span>Đăng xuất</span>
          </Button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="admin-menu-toggle"
              aria-label="Mở menu quản trị"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span /> <span /> <span />
            </Button>
            <div>
              <span className="admin-topbar__context">Medicare Admin</span>
              <strong>{pageNames[location.pathname] ?? "Quản trị"}</strong>
            </div>
          </div>
        </header>
        <Outlet />
      </div>
      {menuOpen ? <Button variant="ghost" className="admin-menu-backdrop" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} /> : null}
    </div>
  );
}
