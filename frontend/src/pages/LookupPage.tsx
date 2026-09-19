import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import {
  type PublicAppointment,
  lookupAppointments,
} from "../shared/api/appointments";

type LookupMode = "code" | "phone";

const MODES: { value: LookupMode; label: string; hint: string }[] = [
  {
    value: "code",
    label: "Mã lịch hẹn",
    hint: "Mã 36 ký tự bạn nhận được ngay sau khi đặt lịch.",
  },
  {
    value: "phone",
    label: "Số điện thoại",
    hint: "Số bạn đã dùng khi đặt lịch, dạng 0901234567.",
  },
];

export function LookupPage() {
  const [mode, setMode] = useState<LookupMode>("code");
  const [value, setValue] = useState("");
  const [results, setResults] = useState<PublicAppointment[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const active = MODES.find((item) => item.value === mode)!;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const found = await lookupAppointments(
        mode === "code" ? { booking_code: value } : { phone: value },
      );
      setResults(found);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tra cứu được lịch hẹn.",
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: LookupMode) {
    setMode(next);
    setValue("");
    setResults(null);
    setError("");
  }

  return (
    <main className="page-shell lookup-page">
      <header className="topbar">
        <Link className="brand" to="/">
          MediBook
        </Link>
        <nav aria-label="Điều hướng chính">
          <Link to="/doctors">Bác sĩ</Link>
          <Link to="/booking">Đặt lịch</Link>
        </nav>
      </header>

      <section className="booking-intro">
        <p className="eyebrow">TRA CỨU LỊCH HẸN</p>
        <h1>Kiểm tra lịch khám của bạn.</h1>
        <p className="lead">
          Nhập mã lịch hẹn hoặc số điện thoại đã đăng ký — chỉ cần một trong
          hai, không cần đăng nhập.
        </p>
      </section>

      <form className="lookup-card" onSubmit={onSubmit}>
          <div
            className="lookup-segment"
            role="tablist"
            aria-label="Cách tra cứu"
          >
            {MODES.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={mode === item.value}
                className={`lookup-segment__option${
                  mode === item.value ? " is-active" : ""
                }`}
                onClick={() => switchMode(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="lookup-field" htmlFor="lookup-value">
            <span className="sr-only">{active.label}</span>
            <svg
              className="lookup-field__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M10 4a6 6 0 1 0 3.87 10.59l4.77 4.77 1.41-1.41-4.77-4.77A6 6 0 0 0 10 4zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"
                fill="currentColor"
              />
            </svg>
            <input
              id="lookup-value"
              required
              autoComplete="off"
              inputMode={mode === "phone" ? "tel" : "text"}
              value={value}
              placeholder={
                mode === "code"
                  ? "36062497-b56a-41d0-9797-4776d38fd978"
                  : "0901234567"
              }
              onChange={(event) => setValue(event.target.value)}
            />
            <button
              type="submit"
              className="lookup-field__submit"
              disabled={loading}
            >
              {loading ? "Đang tìm…" : "Tra cứu"}
            </button>
          </label>

          <p className="lookup-card__hint">{active.hint}</p>
        </form>

      {error ? (
        <p className="lookup-feedback" role="alert">
          {error}
        </p>
      ) : null}

      {results ? (
        <section className="lookup-results" aria-live="polite">
          <div className="lookup-results__head">
            <h2>Tìm thấy {results.length} lịch hẹn</h2>
            <span className="lookup-results__count">
              {mode === "code" ? "Theo mã lịch hẹn" : "Theo số điện thoại"}
            </span>
          </div>
          {results.length === 0 ? (
            <div className="lookup-empty">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M10 4a6 6 0 1 0 3.87 10.59l4.77 4.77 1.41-1.41-4.77-4.77A6 6 0 0 0 10 4zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"
                  fill="currentColor"
                />
              </svg>
              <p className="lookup-empty__title">Không có lịch hẹn nào</p>
              <p className="lookup-empty__hint">
                Kiểm tra lại {active.label.toLowerCase()} và thử tra cứu lần nữa.
              </p>
            </div>
          ) : null}
          <ul className="lookup-grid">
            {results.map((appointment) => (
              <li key={appointment.booking_code} className="appt-card">
                <div className="appt-card__head">
                  <span className="appt-card__label">Mã lịch hẹn</span>
                  <span
                    className={`status-chip status-chip--${appointment.status.toLowerCase()}`}
                  >
                    {appointment.status_display}
                  </span>
                </div>
                <p className="appt-card__code">{appointment.booking_code}</p>
                <dl className="appt-card__meta">
                  <div>
                    <dt>Chuyên khoa</dt>
                    <dd>{appointment.specialty_name}</dd>
                  </div>
                  <div>
                    <dt>Bác sĩ</dt>
                    <dd>{appointment.doctor_name ?? "Chưa phân công"}</dd>
                  </div>
                  <div>
                    <dt>Ngày khám</dt>
                    <dd>{appointment.appointment_date}</dd>
                  </div>
                  <div>
                    <dt>Buổi khám</dt>
                    <dd>{appointment.session_display}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
