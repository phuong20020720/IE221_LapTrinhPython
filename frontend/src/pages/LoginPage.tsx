import { type FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import medicareLogo from "../assets/images/medicare-logo.png";
import { useAuth } from "../features/auth/AuthContext";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/admin";

  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(username.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-page__brand">
        <Link className="login-page__logo" to="/" aria-label="Medicare - Trang chủ"><img src={medicareLogo} alt="Medicare" /></Link>
        <div><p className="eyebrow">HỆ THỐNG QUẢN LÝ PHÒNG KHÁM</p><h2>Vận hành tập trung.<br />Chăm sóc tốt hơn.</h2><p>Quản lý bệnh nhân, bác sĩ, chuyên khoa và đội ngũ nội bộ trong một không gian bảo mật.</p></div>
        <small>© 2026 Phòng khám Medicare</small>
      </section>

      <section className="login-page__content">
        <Card className="login-card">
          <CardHeader>
            <CardTitle className="login-card__title"><h1>Đăng nhập nội bộ</h1></CardTitle>
            <CardDescription>Dành cho tài khoản Admin và Employee của phòng khám.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="login-card__form" onSubmit={onSubmit}>
              <div className="admin-field"><Label htmlFor="login-username">Tên đăng nhập</Label><Input id="login-username" autoComplete="username" required autoFocus value={username} onChange={(event) => setUsername(event.target.value)} /></div>
              <div className="admin-field"><Label htmlFor="login-password">Mật khẩu</Label><Input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
              {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
              <Button className="login-card__submit" type="submit" disabled={submitting}>{submitting ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
            </form>
            <p className="login-card__note">Bệnh nhân không cần tài khoản để đặt lịch khám.</p>
            <Button asChild variant="link" className="login-card__back"><Link to="/">← Quay về trang chủ</Link></Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
