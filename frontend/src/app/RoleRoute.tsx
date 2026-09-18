import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";
import type { UserRole } from "../shared/api/auth";


export function RoleRoute({ roles }: { roles: UserRole[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="centered-page">
        <p>Đang kiểm tra quyền truy cập…</p>
      </main>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
