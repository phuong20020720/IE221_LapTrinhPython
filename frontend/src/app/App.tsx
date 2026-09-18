import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AdminLayout } from "./AdminLayout";
import { CustomerLayout } from "./CustomerLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import { AuthProvider } from "../features/auth/AuthContext";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { EmployeesPage } from "../pages/EmployeesPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { PatientsPage } from "../pages/PatientsPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";


export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/doctors"
              element={<PlaceholderPage title="Danh sách bác sĩ" />}
            />
            <Route
              path="/booking"
              element={<PlaceholderPage title="Đặt lịch khám" />}
            />
            <Route
              path="/lookup"
              element={<PlaceholderPage title="Tra cứu lịch hẹn" />}
            />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route element={<RoleRoute roles={["ADMIN"]} />}>
                <Route path="employees" element={<EmployeesPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
