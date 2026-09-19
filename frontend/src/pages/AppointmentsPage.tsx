import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Eye, Pencil, Search, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { listDoctors, type Doctor } from "../shared/api/doctors";
import { listPublicSpecialties, type Specialty } from "../shared/api/specialties";
import {
  cancelAppointment,
  listAppointments,
  updateAppointment,
  type Appointment,
  type AppointmentScope,
  type AppointmentSession,
  type AppointmentStatus,
  type CancellationReason,
} from "../shared/api/appointments";
import { Modal } from "../shared/ui/Modal";

const PAGE_SIZE = 10;
const ALL = "ALL";

const scopeOptions: Array<{ value: AppointmentScope; label: string }> = [
  { value: "today", label: "Hôm nay" },
  { value: "upcoming", label: "Sắp tới" },
  { value: "unassigned", label: "Chưa phân công" },
  { value: "history", label: "Lịch sử" },
  { value: "all", label: "Tất cả" },
];

const statusOptions: Array<{ value: AppointmentStatus; label: string }> = [
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "IN_PROGRESS", label: "Đang khám" },
  { value: "COMPLETED", label: "Hoàn tất" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const cancelOptions: Array<{ value: CancellationReason; label: string }> = [
  { value: "PATIENT_REQUEST", label: "Khách hàng yêu cầu" },
  { value: "CLINIC", label: "Phòng khám hủy" },
  { value: "NO_SHOW", label: "Khách không đến" },
];

type EditForm = {
  specialty_id: string;
  doctor_id: string;
  appointment_date: string;
  session: AppointmentSession;
  reason: string;
  status: AppointmentStatus;
};

function statusClass(status: AppointmentStatus): string {
  if (status === "CONFIRMED") return "appointment-status appointment-status--confirmed";
  if (status === "IN_PROGRESS") return "appointment-status appointment-status--progress";
  if (status === "COMPLETED") return "appointment-status appointment-status--completed";
  return "appointment-status appointment-status--cancelled";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string | null): string {
  return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
}

function shortCode(value: string): string {
  return value.split("-")[0].toUpperCase();
}

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | typeof ALL>(ALL);
  const [doctorFilter, setDoctorFilter] = useState<typeof ALL | string>(ALL);
  const [dateFilter, setDateFilter] = useState("");
  const [scope, setScope] = useState<AppointmentScope>("today");
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<CancellationReason>("PATIENT_REQUEST");

  async function loadAppointments() {
    setLoading(true);
    setError("");
    try {
      const appointmentPage = await listAppointments({
        search,
        status: statusFilter === ALL ? "" : statusFilter,
        doctorId: doctorFilter === ALL ? undefined : Number(doctorFilter),
        appointmentDate: dateFilter,
        scope: dateFilter ? "all" : scope,
        page,
        pageSize: PAGE_SIZE,
      });
      setAppointments(appointmentPage.results);
      setTotalCount(appointmentPage.count);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải lịch hẹn.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.all([
      listPublicSpecialties({ pageSize: 100 }),
      listDoctors({ pageSize: 100 }),
    ])
      .then(([specialtyData, doctorData]) => {
        setSpecialties(specialtyData.results);
        setDoctors(doctorData.results);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Không thể tải danh mục lịch hẹn.");
      });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAppointments(), 250);
    return () => window.clearTimeout(timer);
  }, [search, statusFilter, doctorFilter, dateFilter, scope, page]);

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const activeDoctors = useMemo(
    () => doctors.filter((doctor) => !form?.specialty_id || doctor.specialty.id === Number(form.specialty_id)),
    [doctors, form?.specialty_id],
  );

  function openEdit(appointment: Appointment) {
    setEditing(appointment);
    setForm({
      specialty_id: String(appointment.specialty.id),
      doctor_id: appointment.doctor ? String(appointment.doctor.id) : "NONE",
      appointment_date: appointment.appointment_date,
      session: appointment.session,
      reason: appointment.reason,
      status: appointment.status,
    });
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing || !form) return;
    if (form.status === "CANCELLED") {
      setEditing(null);
      setForm(null);
      setCancelTarget(editing);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateAppointment(editing.id, {
        specialty_id: Number(form.specialty_id),
        doctor_id: form.doctor_id === "NONE" ? null : Number(form.doctor_id),
        appointment_date: form.appointment_date,
        session: form.session,
        reason: form.reason,
        status: form.status,
      });
      setAppointments((items) => items.map((item) => item.id === updated.id ? updated : item));
      setEditing(null);
      setForm(null);
      toast.success("Đã cập nhật lịch hẹn.");
      if (page === 1) await loadAppointments();
      else setPage(1);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể cập nhật lịch hẹn.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setSaving(true);
    try {
      const updated = await cancelAppointment(cancelTarget.id, cancelReason);
      setAppointments((items) => items.map((item) => item.id === updated.id ? updated : item));
      setCancelTarget(null);
      toast.success("Đã hủy lịch hẹn.");
      if (page === 1) await loadAppointments();
      else setPage(1);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể hủy lịch hẹn.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <p className="eyebrow">LỊCH KHÁM</p>
          <h1>Lịch hẹn</h1>
          <p>Theo dõi nhu cầu khám, phân công bác sĩ và cập nhật tiến trình tiếp nhận.</p>
        </div>
        <span className="admin-date-chip"><CalendarDays size={15} /> {totalCount} lịch hẹn</span>
      </header>

      <Card className="admin-table-card">
        <div className="appointment-scopes" aria-label="Phạm vi lịch hẹn">
          {scopeOptions.map((item) => (
            <Button
              key={item.value}
              type="button"
              variant="ghost"
              className={scope === item.value && !dateFilter ? "appointment-scope appointment-scope--active" : "appointment-scope"}
              aria-pressed={scope === item.value && !dateFilter}
              onClick={() => {
                setScope(item.value);
                setDateFilter("");
                setPage(1);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="admin-table-toolbar appointment-toolbar">
          <div className="admin-search">
            <span><Search size={15} /></span>
            <Input aria-label="Tìm lịch hẹn" placeholder="Tên, SĐT hoặc mã lịch..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </div>
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as AppointmentStatus | typeof ALL); setPage(1); }}>
            <SelectTrigger aria-label="Lọc trạng thái"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
              {statusOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={doctorFilter} onValueChange={(value) => { setDoctorFilter(value); setPage(1); }}>
            <SelectTrigger aria-label="Lọc bác sĩ"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả bác sĩ</SelectItem>
              {doctors.map((doctor) => <SelectItem key={doctor.id} value={String(doctor.id)}>{doctor.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input aria-label="Lọc ngày khám" type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} />
          <span className="admin-result-count">{totalCount} kết quả</span>
        </div>

        {error ? <Alert variant="destructive" className="admin-alert"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {loading ? <div className="admin-empty">Đang tải lịch hẹn...</div> : null}
        {!loading && !error && appointments.length === 0 ? <div className="admin-empty">Chưa có lịch hẹn phù hợp.</div> : null}
        {!loading && appointments.length > 0 ? (
          <>
            <div className="table-wrap">
              <Table className="data-table appointment-table">
                <TableHeader><TableRow>
                  <TableHead>Mã lịch</TableHead><TableHead>Khách hàng</TableHead><TableHead>Ngày khám</TableHead>
                  <TableHead>Chuyên khoa / Bác sĩ</TableHead><TableHead>Trạng thái</TableHead><TableHead className="data-table__col--center">Thao tác</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell><div className="table-stack"><span>#{shortCode(appointment.booking_code)}</span><small>{appointment.session_label}</small></div></TableCell>
                      <TableCell><div className="table-stack"><span>{appointment.patient.full_name}</span><small>{appointment.patient.phone}</small></div></TableCell>
                      <TableCell><strong>{formatDate(appointment.appointment_date)}</strong></TableCell>
                      <TableCell><div className="table-stack"><span>{appointment.specialty.name}</span><small>{appointment.doctor?.name ?? "Chưa chỉ định bác sĩ"}</small></div></TableCell>
                      <TableCell><Badge className={statusClass(appointment.status)}>{appointment.status_label}</Badge></TableCell>
                      <TableCell><div className="data-table__actions">
                        <Button type="button" size="icon" variant="ghost" aria-label={`Xem lịch ${appointment.patient.full_name}`} onClick={() => setDetail(appointment)}><Eye size={16} /></Button>
                        <Button type="button" size="icon" variant="ghost" disabled={["COMPLETED", "CANCELLED"].includes(appointment.status)} aria-label={`Sửa lịch ${appointment.patient.full_name}`} onClick={() => openEdit(appointment)}><Pencil size={16} /></Button>
                        <Button type="button" size="icon" variant="ghost" className="appointment-cancel-button" disabled={["COMPLETED", "CANCELLED"].includes(appointment.status)} aria-label={`Hủy lịch ${appointment.patient.full_name}`} onClick={() => setCancelTarget(appointment)}><XCircle size={17} /></Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="appointment-pagination">
              <span>Trang {page}/{pageCount}</span>
              <div><Button size="icon" variant="outline" aria-label="Trang trước" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} /></Button><Button size="icon" variant="outline" aria-label="Trang sau" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}><ChevronRight size={16} /></Button></div>
            </div>
          </>
        ) : null}
      </Card>

      <Modal open={detail !== null} title="Chi tiết lịch hẹn" description={detail ? `Mã lịch ${detail.booking_code}` : ""} onClose={() => setDetail(null)}>
        {detail ? <div className="appointment-detail">
          <dl className="appointment-detail__grid">
            <div><dt>Khách hàng</dt><dd>{detail.patient.full_name}</dd></div>
            <div><dt>Liên hệ</dt><dd>{detail.patient.phone}<br />{detail.patient.email}</dd></div>
            <div><dt>Ngày / buổi</dt><dd>{formatDate(detail.appointment_date)} · {detail.session_label}</dd></div>
            <div><dt>Trạng thái</dt><dd><Badge className={statusClass(detail.status)}>{detail.status_label}</Badge></dd></div>
            <div><dt>Chuyên khoa</dt><dd>{detail.specialty.name}</dd></div>
            <div><dt>Bác sĩ</dt><dd>{detail.doctor?.name ?? "Chưa chỉ định"}</dd></div>
          </dl>
          <div className="appointment-detail__reason"><strong>Lý do khám</strong><p>{detail.reason}</p></div>
          <dl className="appointment-detail__timeline">
            <div><dt>Tạo lúc</dt><dd>{formatDateTime(detail.created_at)}</dd></div>
            <div><dt>Bắt đầu khám</dt><dd>{formatDateTime(detail.started_at)}</dd></div>
            <div><dt>Hoàn tất</dt><dd>{formatDateTime(detail.completed_at)}</dd></div>
            <div><dt>Hủy lúc</dt><dd>{formatDateTime(detail.cancelled_at)}</dd></div>
          </dl>
          <div className="admin-form__actions"><Button variant="outline" onClick={() => setDetail(null)}>Đóng</Button></div>
        </div> : null}
      </Modal>

      <Modal open={editing !== null} title="Cập nhật lịch hẹn" description="Điều chỉnh phân công, thời gian hoặc tiến trình khám." onClose={() => { if (!saving) { setEditing(null); setForm(null); } }}>
        {form ? <form className="admin-form" onSubmit={saveEdit}>
          <div className="admin-form__grid">
            <div className="admin-field"><Label>Chuyên khoa</Label><Select value={form.specialty_id} onValueChange={(value) => setForm({ ...form, specialty_id: value, doctor_id: "NONE" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{specialties.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="admin-field"><Label>Bác sĩ</Label><Select value={form.doctor_id} onValueChange={(value) => setForm({ ...form, doctor_id: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Chưa chỉ định</SelectItem>{activeDoctors.map((doctor) => <SelectItem key={doctor.id} value={String(doctor.id)}>{doctor.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="admin-field"><Label htmlFor="appointment-date">Ngày khám</Label><Input id="appointment-date" type="date" required value={form.appointment_date} onChange={(event) => setForm({ ...form, appointment_date: event.target.value })} /></div>
            <div className="admin-field"><Label>Buổi khám</Label><Select value={form.session} onValueChange={(value) => setForm({ ...form, session: value as AppointmentSession })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MORNING">Buổi sáng</SelectItem><SelectItem value="AFTERNOON">Buổi chiều</SelectItem></SelectContent></Select></div>
            <div className="admin-field"><Label>Trạng thái</Label><Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as AppointmentStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map((item) => <SelectItem key={item.value} value={item.value} disabled={(form.status === "CONFIRMED" && item.value === "COMPLETED") || (form.status === "IN_PROGRESS" && item.value === "CONFIRMED")}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="admin-field"><Label htmlFor="appointment-reason">Lý do khám</Label><Textarea id="appointment-reason" required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></div>
          <div className="admin-form__actions"><Button type="button" variant="outline" onClick={() => { setEditing(null); setForm(null); }}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button></div>
        </form> : null}
      </Modal>

      <Modal open={cancelTarget !== null} title="Hủy lịch hẹn?" description={cancelTarget ? `Lịch của ${cancelTarget.patient.full_name} sẽ được lưu lịch sử ở trạng thái Đã hủy.` : ""} onClose={() => { if (!saving) setCancelTarget(null); }}>
        <div className="admin-form"><div className="admin-field"><Label>Lý do hủy</Label><Select value={cancelReason} onValueChange={(value) => setCancelReason(value as CancellationReason)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{cancelOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div><div className="admin-form__actions"><Button variant="outline" disabled={saving} onClick={() => setCancelTarget(null)}>Không hủy</Button><Button variant="destructive" disabled={saving} onClick={() => void confirmCancel()}>{saving ? "Đang xử lý..." : "Xác nhận hủy"}</Button></div></div>
      </Modal>
    </section>
  );
}
