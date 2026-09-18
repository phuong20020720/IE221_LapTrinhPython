import { Link } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";


export function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <p className="eyebrow">TỔNG QUAN</p>
          <h1>Xin chào, {user?.full_name}</h1>
          <p>
            Quản lý hồ sơ bệnh nhân
            {user?.role === "ADMIN" ? " và tài khoản nhân viên" : ""} trong phạm
            vi quyền của bạn. Dashboard số liệu sẽ bổ sung sau.
          </p>
        </div>
      </header>

      <div className="admin-stat-grid">
        <Link className="admin-stat" to="/admin/patients">
          <span className="admin-stat__label">Hồ sơ</span>
          <strong>Bệnh nhân</strong>
          <span className="admin-stat__hint">Tìm kiếm · thêm · cập nhật</span>
        </Link>
        {user?.role === "ADMIN" ? (
          <Link className="admin-stat" to="/admin/employees">
            <span className="admin-stat__label">Tài khoản</span>
            <strong>Nhân viên</strong>
            <span className="admin-stat__hint">Tạo · sửa · vô hiệu hóa</span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
