import { Link } from "react-router-dom";


export function LoginPage() {
  return (
    <main className="centered-page">
      <p className="eyebrow">INTERNAL ACCESS</p>
      <h1>Đăng nhập nội bộ</h1>
      <p>JWT endpoint đã được nối ở backend; form đăng nhập chưa được triển khai.</p>
      <Link className="text-link" to="/">
        Về trang nền tảng
      </Link>
    </main>
  );
}

