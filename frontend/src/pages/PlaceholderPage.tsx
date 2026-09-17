import { Link } from "react-router-dom";


type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <main className="centered-page">
      <p className="eyebrow">ROUTE PLACEHOLDER</p>
      <h1>{title}</h1>
      <p>Route đã được khai báo; chức năng sẽ được xây dựng ở increment sau.</p>
      <Link className="text-link" to="/">
        Về trang nền tảng
      </Link>
    </main>
  );
}

