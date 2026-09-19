import { useEffect, useState } from "react";

import {
  ALLOWED_TRANSITIONS,
  type Appointment,
  type AppointmentStatus,
  type BookingDoctor,
  CANCELLATION_LABELS,
  type CancellationReason,
  listAppointments,
  listBookingDoctors,
  STATUS_LABELS,
  transitionAppointment,
  updateAppointment,
} from "../shared/api/appointments";
import { Modal } from "../shared/ui/Modal";

const STATUS_FILTERS: (AppointmentStatus | "")[] = [
  "",
  "PENDING_ASSIGNMENT",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<BookingDoctor[]>([]);
  const [date, setDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] =
    useState<CancellationReason>("PATIENT_REQUEST");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [reloadToken, setReloadToken] = useState(0);

  // The search box only runs on submit; date and status filter as they change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listAppointments({ date, status: statusFilter, query: appliedQuery, page })
      .then((data) => {
        if (cancelled) {
          return;
        }
        setAppointments(data.results);
        setTotalPages(data.total_pages);
        setCount(data.count);
        // The backend clamps an out-of-range page (e.g. after cancelling the
        // last row on the last page); adopt the page it actually served.
        if (data.page !== page) {
          setPage(data.page);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Không tải được lịch hẹn.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [date, statusFilter, appliedQuery, page, reloadToken]);

  useEffect(() => {
    listBookingDoctors()
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, []);

  async function run(action: () => Promise<unknown>, id: number) {
    setBusyId(id);
    setError("");
    try {
      await action();
      setReloadToken((token) => token + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác không thành công.");
    } finally {
      setBusyId(null);
    }
  }

  function assignDoctor(appointment: Appointment, doctorId: string) {
    if (!doctorId) {
      return;
    }
    void run(
      () => updateAppointment(appointment.id, { doctor_id: Number(doctorId) }),
      appointment.id,
    );
  }

  function moveTo(appointment: Appointment, status: AppointmentStatus) {
    if (status === "CANCELLED") {
      setCancelTarget(appointment);
      setCancelReason("PATIENT_REQUEST");
      return;
    }
    void run(() => transitionAppointment(appointment.id, status), appointment.id);
  }

  function confirmCancel() {
    if (!cancelTarget) {
      return;
    }
    const target = cancelTarget;
    setCancelTarget(null);
    void run(
      () => transitionAppointment(target.id, "CANCELLED", cancelReason),
      target.id,
    );
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <p className="eyebrow">LỊCH HẸN</p>
          <h1>Quản lý lịch hẹn</h1>
          <p>Lọc theo ngày, trạng thái, tên hoặc số điện thoại bệnh nhân.</p>
        </div>
        <div className="admin-panel__actions">
          <span className="admin-panel__meta">
            {appointments.length} lịch hẹn
          </span>
        </div>
      </header>

      <div className="admin-list admin-list--full">
        <form
          className="admin-toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setAppliedQuery(query);
          }}
        >
          <label htmlFor="filter-date" className="sr-only">
            Ngày khám
          </label>
          <input
            id="filter-date"
            type="date"
            value={date}
            onChange={(event) => {
              setPage(1);
              setDate(event.target.value);
            }}
          />

          <label htmlFor="filter-status" className="sr-only">
            Trạng thái
          </label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value as AppointmentStatus | "");
            }}
          >
            {STATUS_FILTERS.map((value) => (
              <option key={value || "all"} value={value}>
                {value ? STATUS_LABELS[value] : "Tất cả trạng thái"}
              </option>
            ))}
          </select>

          <label htmlFor="filter-query" className="sr-only">
            Tìm bệnh nhân
          </label>
          <input
            id="filter-query"
            placeholder="Tên, số điện thoại hoặc mã lịch"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Tìm</button>
        </form>

        {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <p className="admin-empty">Đang tải lịch hẹn…</p> : null}

      {!loading && appointments.length === 0 ? (
        <p className="admin-empty">Không có lịch hẹn nào khớp bộ lọc.</p>
      ) : null}

      {!loading && appointments.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Mã lịch</th>
                <th scope="col">Bệnh nhân</th>
                <th scope="col">Chuyên khoa</th>
                <th scope="col">Bác sĩ</th>
                <th scope="col">Ngày / buổi</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Xử lý</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="appointment-code">
                    {appointment.booking_code.slice(0, 8)}
                  </td>
                  <td>
                    {appointment.patient_name}
                    <br />
                    <small>{appointment.patient_phone}</small>
                  </td>
                  <td>{appointment.specialty_name}</td>
                  <td>
                    {appointment.doctor_name ?? (
                      <label>
                        <span className="sr-only">Phân công bác sĩ</span>
                        <select
                          defaultValue=""
                          disabled={busyId === appointment.id}
                          onChange={(event) =>
                            assignDoctor(appointment, event.target.value)
                          }
                        >
                          <option value="">— Phân công —</option>
                          {doctors
                            .filter(
                              (doctor) =>
                                doctor.specialty === appointment.specialty,
                            )
                            .map((doctor) => (
                              <option key={doctor.id} value={doctor.id}>
                                {doctor.full_name}
                              </option>
                            ))}
                        </select>
                      </label>
                    )}
                  </td>
                  <td>
                    {appointment.appointment_date}
                    <br />
                    <small>{appointment.session_display}</small>
                  </td>
                  <td>
                    <div className="appointment-status">
                      <span
                        className={`status-chip status-chip--${appointment.status.toLowerCase()}`}
                      >
                        {appointment.status_display}
                      </span>
                      {appointment.cancellation_reason ? (
                        <small className="appointment-status__reason">
                          {CANCELLATION_LABELS[appointment.cancellation_reason]}
                        </small>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div className="data-table__actions">
                      {ALLOWED_TRANSITIONS[appointment.status].length === 0 ? (
                        <small className="appointment-actions__done">
                          Đã kết thúc
                        </small>
                      ) : (
                        ALLOWED_TRANSITIONS[appointment.status].map((next) => (
                          <button
                            key={next}
                            type="button"
                            className={
                              next === "CANCELLED"
                                ? "button-secondary"
                                : undefined
                            }
                            disabled={busyId === appointment.id}
                            onClick={() => moveTo(appointment, next)}
                          >
                            {STATUS_LABELS[next]}
                          </button>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && count > 0 ? (
        <nav className="admin-pager" aria-label="Phân trang lịch hẹn">
          <button
            type="button"
            
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Trang trước
          </button>
          <span className="admin-pager__status">
            Trang {page}/{totalPages} · {count} lịch hẹn
          </span>
          <button
            type="button"
            
            disabled={page >= totalPages || loading}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
          >
            Trang sau
          </button>
        </nav>
      ) : null}
      </div>

      <Modal
        open={cancelTarget !== null}
        title="Hủy lịch hẹn"
        onClose={() => setCancelTarget(null)}
      >
        <div className="admin-form">
          <label htmlFor="cancel-reason">
            Lý do hủy
            <select
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) =>
                setCancelReason(event.target.value as CancellationReason)
              }
            >
              {(
                Object.keys(CANCELLATION_LABELS) as CancellationReason[]
              ).map((reason) => (
                <option key={reason} value={reason}>
                  {CANCELLATION_LABELS[reason]}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-form__actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => setCancelTarget(null)}
            >
              Đóng
            </button>
            <button type="button" onClick={confirmCancel}>
              Xác nhận hủy
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
