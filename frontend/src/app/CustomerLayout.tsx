import { Clock3, MapPin, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import medicareLogo from "../assets/images/medicare-logo.png";
import { ChatbotWidget } from "../features/chatbot/ChatbotWidget";
import "../styles/customer.css";

const navigation = [
  { label: "Trang chủ", to: "/" },
  { label: "Giới thiệu", to: "/#gioi-thieu" },
  { label: "Chuyên khoa", to: "/#chuyen-khoa" },
  { label: "Bác sĩ", to: "/doctors" },
  { label: "Tin tức", to: "/#tin-tuc" },
];

export function CustomerLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <div className={`customer-site${menuOpen ? " customer-site--menu-open" : ""}`}>
      <a className="customer-skip-link" href="#customer-main">
        Đi đến nội dung chính
      </a>

      <div className="customer-utility">
        <div className="customer-container customer-utility__inner">
          <a href="tel:19006868">
            <Phone aria-hidden="true" /> Hotline: 1900 6868
          </a>
          <span>
            <Clock3 aria-hidden="true" /> Thứ Hai–Thứ Bảy: 07:00–20:00
          </span>
          <span className="customer-utility__address">
            <MapPin aria-hidden="true" /> 123 Nguyễn Văn Linh, Quận 7, TP.HCM
          </span>
        </div>
      </div>

      <header className="customer-header">
        <div className="customer-container customer-header__inner">
          <Link className="customer-logo" to="/" aria-label="Phòng khám Medicare - Trang chủ">
            <img src={medicareLogo} alt="Phòng khám Medicare" />
          </Link>

          <nav className="customer-nav customer-nav--desktop" aria-label="Điều hướng khách hàng">
            {navigation.map((item) =>
              item.to.includes("#") ? (
                <Link key={item.label} to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => (isActive ? "active" : undefined)}
                >
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="customer-header__actions">
            <Link className="customer-button customer-button--compact" to="/booking">
              Đặt lịch khám
            </Link>
            <button
              className="customer-menu-toggle"
              type="button"
              aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={menuOpen}
              aria-controls="customer-mobile-nav"
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>

        <nav
          className="customer-nav customer-nav--mobile"
          id="customer-mobile-nav"
          aria-label="Điều hướng khách hàng trên di động"
          hidden={!menuOpen}
        >
          {navigation.map((item) => (
            <Link key={item.label} to={item.to}>
              {item.label}
            </Link>
          ))}
          <Link className="customer-button" to="/booking">
            Đặt lịch khám
          </Link>
        </nav>
      </header>

      <main className="customer-main" id="customer-main">
        <Outlet />
      </main>

      <footer className="customer-footer">
        <div className="customer-container customer-footer__grid">
          <div className="customer-footer__brand">
            <img src={medicareLogo} alt="" />
            <p>Tận tâm chăm sóc — Đồng hành sức khỏe.</p>
            <small>Website demo phục vụ đồ án Python.</small>
          </div>
          <div>
            <h2>Liên kết nhanh</h2>
            <Link to="/doctors">Đội ngũ bác sĩ</Link>
            <Link to="/booking">Đặt lịch khám</Link>
            <Link to="/login">Khu vực nội bộ</Link>
          </div>
          <div>
            <h2>Liên hệ</h2>
            <a href="tel:19006868">Hotline: 1900 6868</a>
            <a href="mailto:lienhe@medicare-demo.vn">lienhe@medicare-demo.vn</a>
            <p>123 Nguyễn Văn Linh, Quận 7, TP.HCM</p>
          </div>
          <div>
            <h2>Giờ làm việc</h2>
            <p>Thứ Hai–Thứ Bảy<br />07:00–20:00</p>
            <p>Chủ Nhật<br />07:00–12:00</p>
          </div>
        </div>
        <div className="customer-container customer-footer__note">
          Nội dung sức khỏe và trợ lý AI chỉ mang tính tham khảo, không thay thế chẩn đoán hoặc hỗ trợ y tế khẩn cấp.
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  );
}
