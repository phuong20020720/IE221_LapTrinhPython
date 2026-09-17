import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import clinicIllustration from "../assets/images/clinic-placeholder.svg";
import { getHealth } from "../shared/api/health";


type ConnectionState = "checking" | "connected" | "unavailable";

export function HomePage() {
  const [connection, setConnection] = useState<ConnectionState>("checking");

  useEffect(() => {
    const controller = new AbortController();

    getHealth(controller.signal)
      .then(() => setConnection("connected"))
      .catch(() => setConnection("unavailable"));

    return () => controller.abort();
  }, []);

  const statusText = {
    checking: "Đang kiểm tra kết nối hệ thống…",
    connected: "Backend và PostgreSQL đã kết nối.",
    unavailable: "Chưa kết nối được backend. Hãy kiểm tra Docker Compose.",
  }[connection];

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/">
          MediBook
        </a>
        <nav aria-label="Điều hướng chính">
          <Link to="/doctors">Bác sĩ</Link>
          <Link to="/booking">Đặt lịch</Link>
          <Link to="/lookup">Tra cứu</Link>
          <Link to="/login">Nội bộ</Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">MEDIBOOK FOUNDATION</p>
          <h1>Nền tảng đặt lịch khám đang được khởi tạo.</h1>
          <p className="lead">
            Source base đã sẵn sàng cho các vertical slice tiếp theo. Chưa có
            tính năng nghiệp vụ nào được triển khai trong increment này.
          </p>
          <p className={`status status--${connection}`} role="status">
            <span aria-hidden="true" />
            {statusText}
          </p>
        </div>
        <img
          className="hero-image"
          src={clinicIllustration}
          alt="Minh họa phòng khám MediBook"
        />
      </section>
    </main>
  );
}

