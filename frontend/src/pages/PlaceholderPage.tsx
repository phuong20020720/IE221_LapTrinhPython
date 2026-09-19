import { Link } from "react-router-dom";


type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="centered-page customer-placeholder">
      <p className="customer-eyebrow">PHÒNG KHÁM MEDICARE</p>
      <h1>{title}</h1>
      <p>Giao diện chức năng này sẽ được hoàn thiện trong slice tiếp theo.</p>
      <Link className="customer-text-link" to="/">
        Về trang chủ
      </Link>
    </section>
  );
}

