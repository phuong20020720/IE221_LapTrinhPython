import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";


function IconOverview() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="admin-nav__icon">
      <path
        d="M4 4h7v7H4V4zm9 0h7v5h-7V4zM4 13h7v7H4v-7zm9 3h7v4h-7v-4z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconPatients() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="admin-nav__icon">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.2 0-8 2.1-8 4.7V21h16v-2.3c0-2.6-3.8-4.7-8-4.7z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconEmployees() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="admin-nav__icon">
      <path
        d="M16.5 12a3.5 3.5 0 1 0-3.5-3.5 3.5 3.5 0 0 0 3.5 3.5zM8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8.5 2c-2.5 0-4.7 1.2-4.7 2.8V18h9.4v-2.2c0-1.6-2.2-2.8-4.7-2.8zM8 13c-2.8 0-5 1.3-5 3v2h5.2v-1.6C8.2 14.8 8.7 13.7 10 13A7.4 7.4 0 0 0 8 13z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="admin-nav__icon">
      <path
        d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5v-2H5V6h5V4zm4.6 4.2 4.2 3.8-4.2 3.8v-2.6H9v-2.4h5.6V8.2z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconSpecialties() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="admin-nav__icon"
    >
      <path
        d="M12 2a3 3 0 0 1 3 3v4h4a3 3 0 0 1 0 6h-4v4a3 3 0 0 1-6 0v-4H5a3 3 0 0 1 0-6h4V5a3 3 0 0 1 3-3z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconDoctors() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="admin-nav__icon"
    >
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm7 8v-2c0-2.8-3.1-5-7-5s-7 2.2-7 5v2h14zm1-13h-2V5h-2V3h2V1h2v2h2v2h-2v2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__top">
          <div className="admin-sidebar__brand">
            <span className="admin-sidebar__logo" aria-hidden="true">
              M
            </span>
            <div>
              <p className="admin-sidebar__product">MediBook</p>
              <p className="admin-sidebar__space">Khu vực nội bộ</p>
            </div>
          </div>

          <nav className="admin-sidebar__nav" aria-label="Điều hướng nội bộ">
            <p className="admin-sidebar__label">Menu</p>
            <NavLink to="/admin" end className="admin-nav__item">
              <IconOverview />
              <span>Tổng quan</span>
            </NavLink>
            <NavLink to="/admin/patients" className="admin-nav__item">
              <IconPatients />
              <span>Bệnh nhân</span>
            </NavLink>
            {user?.role === "ADMIN" ? (
              <>
              <NavLink to="/admin/employees" className="admin-nav__item">
                <IconEmployees />
                <span>Nhân viên</span>
              </NavLink>

              <NavLink to="/admin/specialties" className="admin-nav__item">
                <IconSpecialties />
                <span>Chuyên khoa</span>
              </NavLink>

               <NavLink to="/admin/doctors"className="admin-nav__item">
                <IconDoctors />
                <span>Bác sĩ</span>
              </NavLink>
              </>
            ) : null}
          </nav>
        </div>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <span className="admin-sidebar__avatar" aria-hidden="true">
              {(user?.full_name?.[0] ?? "U").toUpperCase()}
            </span>
            <div className="admin-sidebar__user-text">
              <p className="admin-sidebar__name">{user?.full_name}</p>
              <p className="admin-sidebar__role">{user?.role}</p>
            </div>
          </div>
          <button type="button" className="admin-sidebar__logout" onClick={onLogout}>
            <IconLogout />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
