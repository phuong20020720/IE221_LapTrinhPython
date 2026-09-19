import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  type AppointmentSession,
  type BookingDoctor,
  type BookingSpecialty,
  type PublicAppointment,
  createBooking,
  listBookingDoctors,
  listBookingSpecialties,
  SESSION_LABELS,
} from "../shared/api/appointments";

const MAX_DAYS_AHEAD = 90;

function isoDate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

const emptyForm = {
  full_name: "",
  phone: "",
  email: "",
  specialty_id: "",
  doctor_id: "",
  appointment_date: "",
  session: "MORNING" as AppointmentSession,
  reason: "",
};

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const [specialties, setSpecialties] = useState<BookingSpecialty[]>([]);
  const [doctors, setDoctors] = useState<BookingDoctor[]>([]);
  const [form, setForm] = useState({
    ...emptyForm,
    doctor_id: searchParams.get("doctor_id") ?? "",
  });
  const [confirmation, setConfirmation] = useState<PublicAppointment | null>(null);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listBookingSpecialties(controller.signal)
      .then(setSpecialties)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setCatalogError(
            err instanceof Error ? err.message : "Không tải được chuyên khoa.",
          );
        }
      });
    return () => controller.abort();
  }, []);

  const specialtyId = form.specialty_id ? Number(form.specialty_id) : undefined;

  useEffect(() => {
    const controller = new AbortController();
    listBookingDoctors(specialtyId, controller.signal)
      .then(setDoctors)
      .catch(() => {
        if (!controller.signal.aborted) {
          setDoctors([]);
        }
      });
    return () => controller.abort();
  }, [specialtyId]);

  // A chosen doctor must belong to the current specialty, otherwise clear it.
  useEffect(() => {
    if (!form.doctor_id) {
      return;
    }
    const stillValid = doctors.some(
      (doctor) => String(doctor.id) === form.doctor_id,
    );
    if (!stillValid) {
      setForm((previous) => ({ ...previous, doctor_id: "" }));
    }
  }, [doctors, form.doctor_id]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor.id) === form.doctor_id) ?? null,
    [doctors, form.doctor_id],
  );

  function update(field: keyof typeof emptyForm, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const appointment = await createBooking({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || undefined,
        specialty_id: Number(form.specialty_id),
        doctor_id: form.doctor_id ? Number(form.doctor_id) : null,
        appointment_date: form.appointment_date,
        session: form.session,
        reason: form.reason,
      });
      setConfirmation(appointment);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đặt lịch không thành công.");
    } finally {
      setSaving(false);
    }
  }

  if (confirmation) {
    return (
      <main className="page-shell booking-page">
        <section className="booking-success" role="status">
          <span className="booking-success__badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6 9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="eyebrow">ĐẶT LỊCH THÀNH CÔNG</p>
          <h1>Lịch khám của bạn đã được đăng ký.</h1>
          <p className="lead">
            Hãy lưu mã tra cứu dưới đây để kiểm tra lịch hẹn bất cứ lúc nào.
          </p>
          <p className="booking-success__code">{confirmation.booking_code}</p>
          <dl className="booking-success__details">
            <div>
              <dt>Chuyên khoa</dt>
              <dd>{confirmation.specialty_name}</dd>
            </div>
            <div>
              <dt>Bác sĩ</dt>
              <dd>{confirmation.doctor_name ?? "Sẽ được phân công"}</dd>
            </div>
            <div>
              <dt>Ngày khám</dt>
              <dd>{confirmation.appointment_date}</dd>
            </div>
            <div>
              <dt>Buổi khám</dt>
              <dd>{confirmation.session_display}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>{confirmation.status_display}</dd>
            </div>
          </dl>
          <div className="booking-success__actions">
            <Link className="text-link" to="/lookup">
              Tra cứu lịch hẹn
            </Link>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setConfirmation(null)}
            >
              Đặt lịch khác
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell booking-page">
      <header className="topbar">
        <Link className="brand" to="/">
          MediBook
        </Link>
        <nav aria-label="Điều hướng chính">
          <Link to="/doctors">Bác sĩ</Link>
          <Link to="/lookup">Tra cứu</Link>
        </nav>
      </header>

      <section className="booking-intro">
        <p className="eyebrow">ĐẶT LỊCH KHÁM</p>
        <h1>Đặt lịch khám không cần tài khoản.</h1>
        <p className="lead">
          Chọn chuyên khoa và thời gian khám. Bạn có thể bỏ qua bác sĩ, phòng
          khám sẽ phân công giúp bạn.
        </p>
      </section>

      {catalogError ? (
        <p className="form-error" role="alert">
          {catalogError}
        </p>
      ) : null}

      <form className="booking-form" onSubmit={onSubmit}>
        <section className="booking-section">
          <p className="booking-section__legend">Thông tin khám</p>

          <label className="booking-field--full" htmlFor="specialty">
            Chuyên khoa
            <select
              id="specialty"
              required
              value={form.specialty_id}
              onChange={(event) => update("specialty_id", event.target.value)}
            >
              <option value="">— Chọn chuyên khoa —</option>
              {specialties.map((specialty) => (
                <option key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </option>
              ))}
            </select>
          </label>

          <div className="booking-row">
            <label htmlFor="doctor">
              Bác sĩ (tùy chọn)
              <select
                id="doctor"
                value={form.doctor_id}
                disabled={!form.specialty_id}
                onChange={(event) => update("doctor_id", event.target.value)}
              >
                <option value="">— Để phòng khám phân công —</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.credentials
                      ? `${doctor.credentials} ${doctor.full_name}`
                      : doctor.full_name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="appointment_date">
              Ngày khám
              <input
                id="appointment_date"
                type="date"
                required
                min={isoDate()}
                max={isoDate(MAX_DAYS_AHEAD)}
                value={form.appointment_date}
                onChange={(event) =>
                  update("appointment_date", event.target.value)
                }
              />
            </label>
          </div>

          <fieldset className="booking-sessions">
            <legend>Buổi khám</legend>
            {(Object.keys(SESSION_LABELS) as AppointmentSession[]).map(
              (value) => (
                <label key={value} htmlFor={`session-${value}`}>
                  <input
                    id={`session-${value}`}
                    type="radio"
                    name="session"
                    value={value}
                    checked={form.session === value}
                    onChange={(event) => update("session", event.target.value)}
                  />
                  {SESSION_LABELS[value]}
                </label>
              ),
            )}
          </fieldset>
        </section>

        <section className="booking-section">
          <p className="booking-section__legend">Thông tin liên hệ</p>

          <div className="booking-row">
            <label htmlFor="full_name">
              Họ và tên
              <input
                id="full_name"
                required
                value={form.full_name}
                onChange={(event) => update("full_name", event.target.value)}
              />
            </label>

            <label htmlFor="phone">
              Số điện thoại
              <input
                id="phone"
                required
                inputMode="tel"
                placeholder="0901234567"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
            </label>
          </div>

          <label className="booking-field--full" htmlFor="email">
            Email (tùy chọn)
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
            />
          </label>

          <label className="booking-field--full" htmlFor="reason">
            Lý do khám
            <textarea
              id="reason"
              required
              rows={3}
              value={form.reason}
              onChange={(event) => update("reason", event.target.value)}
            />
          </label>
        </section>

        <div className="booking-footer">
          {selectedDoctor ? (
            <p className="booking-hint">
              Lịch sẽ được xác nhận ngay với {selectedDoctor.full_name}.
            </p>
          ) : (
            <p className="booking-hint">
              Chưa chọn bác sĩ — lịch sẽ ở trạng thái chờ phân công.
            </p>
          )}

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="booking-submit" disabled={saving}>
            {saving ? "Đang gửi…" : "Đặt lịch khám"}
          </button>
        </div>
      </form>
    </main>
  );
}
