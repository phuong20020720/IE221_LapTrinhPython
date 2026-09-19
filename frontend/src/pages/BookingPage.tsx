import {
  CalendarDays,
  Check,
  Clipboard,
  Info,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AppointmentValidationError,
  createPublicAppointment,
  type AppointmentSession,
  type PublicAppointment,
  type PublicAppointmentInput,
} from "../shared/api/appointments";
import { listDoctors, type Doctor } from "../shared/api/doctors";
import { listPublicSpecialties, type Specialty } from "../shared/api/specialties";
import { getDoctorDisplayName } from "../shared/lib/doctorDisplayName";

type BookingForm = {
  specialty_id: string;
  doctor_id: string;
  appointment_date: string;
  session: AppointmentSession | "";
  reason: string;
  full_name: string;
  phone: string;
  email: string;
};

const initialForm: BookingForm = {
  specialty_id: "",
  doctor_id: "",
  appointment_date: "",
  session: "",
  reason: "",
  full_name: "",
  phone: "",
  email: "",
};

function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`));
}

function validate(form: BookingForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.specialty_id) errors.specialty_id = "Vui lòng chọn chuyên khoa.";
  if (!form.appointment_date) errors.appointment_date = "Vui lòng chọn ngày khám.";
  else if (form.appointment_date < localToday()) errors.appointment_date = "Ngày khám không được ở trong quá khứ.";
  if (!form.session) errors.session = "Vui lòng chọn buổi khám.";
  if (!form.reason.trim()) errors.reason = "Vui lòng nhập lý do khám.";
  if (!form.full_name.trim()) errors.full_name = "Vui lòng nhập họ và tên.";
  const phoneDigits = form.phone.replace(/\D/g, "").replace(/^84(?=\d{9}$)/, "0");
  if (!/^0\d{9}$/.test(phoneDigits)) errors.phone = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Vui lòng nhập email hợp lệ.";
  return errors;
}

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const requestedDoctorId = searchParams.get("doctor_id") ?? "";
  const [form, setForm] = useState<BookingForm>(initialForm);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [catalogReload, setCatalogReload] = useState(0);
  const [handledDoctorQuery, setHandledDoctorQuery] = useState("");
  const [selectionWarning, setSelectionWarning] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PublicAppointment | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setCatalogLoading(true);
    setCatalogError("");
    Promise.all([
      listPublicSpecialties({ pageSize: 100 }, controller.signal),
      listDoctors({ pageSize: 100 }, controller.signal),
    ])
      .then(([specialtyData, doctorData]) => {
        setSpecialties(specialtyData.results);
        setDoctors(doctorData.results);
      })
      .catch(() => {
        if (!controller.signal.aborted) setCatalogError("Chưa thể tải danh sách chuyên khoa và bác sĩ.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [catalogReload, requestedDoctorId]);

  useEffect(() => {
    if (catalogLoading || !requestedDoctorId || handledDoctorQuery === requestedDoctorId) return;
    const parsedId = Number(requestedDoctorId);
    const requestedDoctor = Number.isInteger(parsedId)
      ? doctors.find((doctor) => doctor.id === parsedId)
      : undefined;
    if (requestedDoctor) {
      setForm((current) => ({
        ...current,
        specialty_id: String(requestedDoctor.specialty.id),
        doctor_id: String(requestedDoctor.id),
      }));
      setSelectionWarning("");
    } else {
      setSelectionWarning("Bác sĩ được chọn không tồn tại hoặc hiện không nhận lịch. Vui lòng chọn lại.");
    }
    setHandledDoctorQuery(requestedDoctorId);
  }, [catalogLoading, doctors, handledDoctorQuery, requestedDoctorId]);

  const availableDoctors = useMemo(
    () => doctors.filter((doctor) => !form.specialty_id || doctor.specialty.id === Number(form.specialty_id)),
    [doctors, form.specialty_id],
  );
  const selectedSpecialty = specialties.find((item) => item.id === Number(form.specialty_id));
  const selectedDoctor = doctors.find((item) => item.id === Number(form.doctor_id));

  function updateField<K extends keyof BookingForm>(field: K, value: BookingForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const errors = validate(form);
    setFieldErrors(errors);
    setSubmitError("");
    if (Object.keys(errors).length > 0) return;

    const payload: PublicAppointmentInput = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      specialty_id: Number(form.specialty_id),
      doctor_id: form.doctor_id ? Number(form.doctor_id) : null,
      appointment_date: form.appointment_date,
      session: form.session as AppointmentSession,
      reason: form.reason.trim(),
    };

    setSubmitting(true);
    try {
      setResult(await createPublicAppointment(payload));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (error instanceof AppointmentValidationError) {
        setFieldErrors(error.fields);
        setSubmitError(error.message);
      } else {
        setSubmitError("Không thể kết nối hệ thống. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function copyBookingCode() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.booking_code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (result) {
    return (
      <div className="customer-container customer-page booking-success" aria-live="polite">
        <div className="booking-success__icon"><Check aria-hidden="true" /></div>
        <p className="customer-eyebrow">ĐẶT LỊCH THÀNH CÔNG</p>
        <h1>Lịch khám của bạn đã được xác nhận</h1>
        <p>Vui lòng lưu mã lịch hẹn dưới đây và kiểm tra email xác nhận từ Medicare.</p>
        <div className="booking-code"><span>Mã lịch hẹn</span><strong>{result.booking_code}</strong><button type="button" onClick={copyBookingCode}>{copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}{copied ? "Đã sao chép" : "Sao chép"}</button></div>
        <dl className="booking-success__summary">
          <div><dt>Chuyên khoa</dt><dd>{result.specialty.name}</dd></div>
          <div><dt>Bác sĩ</dt><dd>{result.doctor?.name ?? "Phòng khám sẽ phân công"}</dd></div>
          <div><dt>Ngày khám</dt><dd>{formatDate(result.appointment_date)}</dd></div>
          <div><dt>Buổi khám</dt><dd>{result.session_label}</dd></div>
        </dl>
        <div className="booking-success__actions"><Link className="customer-button" to="/booking">Đặt lịch khác</Link><Link className="customer-button customer-button--outline" to="/">Về trang chủ</Link></div>
      </div>
    );
  }

  return (
    <div className="customer-container customer-page booking-page">
      <header className="booking-page__header"><p className="customer-eyebrow">ĐẶT LỊCH KHÁM</p><h1>Đặt lịch nhanh cùng Medicare</h1><p>Chọn ngày và buổi khám phù hợp. Bạn không cần đăng nhập để gửi lịch hẹn.</p></header>

      {catalogError ? <div className="booking-alert booking-alert--error" role="alert"><Info aria-hidden="true" /><div><strong>Không tải được dữ liệu đặt lịch</strong><p>{catalogError}</p><button type="button" onClick={() => setCatalogReload((value) => value + 1)}>Thử lại</button></div></div> : null}
      {selectionWarning ? <div className="booking-alert booking-alert--warning" role="status"><Info aria-hidden="true" /><p>{selectionWarning}</p></div> : null}

      <div className="booking-layout">
        <form className="booking-form" onSubmit={submit} noValidate>
          {submitError ? <div className="booking-alert booking-alert--error" role="alert"><Info aria-hidden="true" /><p>{submitError}</p></div> : null}

          <fieldset disabled={catalogLoading || Boolean(catalogError) || submitting}>
            <legend><Stethoscope aria-hidden="true" /><span>Thông tin khám<small>Chọn chuyên khoa, ngày và buổi khám</small></span></legend>
            <div className="booking-form__grid">
              <div className="booking-field">
                <label id="booking-specialty-label">Chuyên khoa <b>*</b></label>
                <Select
                  value={form.specialty_id}
                  onValueChange={(value) => {
                    updateField("specialty_id", value);
                    updateField("doctor_id", "");
                    setSelectionWarning("");
                  }}
                  disabled={catalogLoading}
                >
                  <SelectTrigger
                    className="booking-select-trigger"
                    aria-labelledby="booking-specialty-label"
                    aria-invalid={Boolean(fieldErrors.specialty_id)}
                    data-value={form.specialty_id}
                  >
                    <SelectValue placeholder="Chọn chuyên khoa" />
                  </SelectTrigger>
                  <SelectContent className="booking-select-content">
                    {specialties.map((specialty) => (
                      <SelectItem className="booking-select-item" key={specialty.id} value={String(specialty.id)}>
                        {specialty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.specialty_id ? <small>{fieldErrors.specialty_id}</small> : null}
              </div>
              <div className="booking-field">
                <label id="booking-doctor-label">Bác sĩ <em>Tùy chọn</em></label>
                <Select
                  value={form.doctor_id || "UNASSIGNED"}
                  onValueChange={(value) => updateField("doctor_id", value === "UNASSIGNED" ? "" : value)}
                  disabled={!form.specialty_id}
                >
                  <SelectTrigger
                    className="booking-select-trigger"
                    aria-labelledby="booking-doctor-label"
                    aria-invalid={Boolean(fieldErrors.doctor_id)}
                    data-value={form.doctor_id}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="booking-select-content">
                    <SelectItem className="booking-select-item" value="UNASSIGNED">Phòng khám phân công</SelectItem>
                    {availableDoctors.map((doctor) => (
                      <SelectItem className="booking-select-item" key={doctor.id} value={String(doctor.id)}>
                        {getDoctorDisplayName(doctor)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.doctor_id ? <small>{fieldErrors.doctor_id}</small> : null}
              </div>
              <label className="booking-field"><span>Ngày khám <b>*</b></span><input type="date" min={localToday()} value={form.appointment_date} onChange={(event) => updateField("appointment_date", event.target.value)} aria-invalid={Boolean(fieldErrors.appointment_date)} />{fieldErrors.appointment_date ? <small>{fieldErrors.appointment_date}</small> : null}</label>
              <div className="booking-field"><span>Buổi khám <b>*</b></span><div className="booking-session"><label><input type="radio" name="session" value="MORNING" checked={form.session === "MORNING"} onChange={() => updateField("session", "MORNING")} /><span>Buổi sáng</span></label><label><input type="radio" name="session" value="AFTERNOON" checked={form.session === "AFTERNOON"} onChange={() => updateField("session", "AFTERNOON")} /><span>Buổi chiều</span></label></div>{fieldErrors.session ? <small>{fieldErrors.session}</small> : null}</div>
              <label className="booking-field booking-field--full"><span>Lý do khám <b>*</b></span><textarea rows={4} maxLength={2000} placeholder="Mô tả ngắn triệu chứng hoặc nhu cầu khám..." value={form.reason} onChange={(event) => updateField("reason", event.target.value)} aria-invalid={Boolean(fieldErrors.reason)} />{fieldErrors.reason ? <small>{fieldErrors.reason}</small> : null}</label>
            </div>
          </fieldset>

          <fieldset disabled={submitting}>
            <legend><UserRound aria-hidden="true" /><span>Thông tin khách hàng<small>Dùng để xác nhận và hỗ trợ lịch hẹn</small></span></legend>
            <div className="booking-form__grid">
              <label className="booking-field booking-field--full"><span>Họ và tên <b>*</b></span><input autoComplete="name" value={form.full_name} onChange={(event) => updateField("full_name", event.target.value)} aria-invalid={Boolean(fieldErrors.full_name)} />{fieldErrors.full_name ? <small>{fieldErrors.full_name}</small> : null}</label>
              <label className="booking-field"><span>Số điện thoại <b>*</b></span><div className="booking-field__icon"><Phone aria-hidden="true" /><input type="tel" autoComplete="tel" placeholder="0901234567" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} aria-invalid={Boolean(fieldErrors.phone)} /></div>{fieldErrors.phone ? <small>{fieldErrors.phone}</small> : null}</label>
              <label className="booking-field"><span>Email <b>*</b></span><div className="booking-field__icon"><Mail aria-hidden="true" /><input type="email" autoComplete="email" placeholder="ban@example.com" value={form.email} onChange={(event) => updateField("email", event.target.value)} aria-invalid={Boolean(fieldErrors.email)} /></div>{fieldErrors.email ? <small>{fieldErrors.email}</small> : null}</label>
            </div>
          </fieldset>

          <button className="customer-button booking-submit" type="submit" disabled={catalogLoading || Boolean(catalogError) || submitting}>{submitting ? "Đang gửi lịch hẹn..." : "Xác nhận đặt lịch"}</button>
        </form>

        <aside className="booking-summary" aria-label="Tóm tắt lịch hẹn">
          <div className="booking-summary__heading"><CalendarDays aria-hidden="true" /><div><p className="customer-eyebrow">TÓM TẮT</p><h2>Lịch khám của bạn</h2></div></div>
          <dl><div><dt>Chuyên khoa</dt><dd>{selectedSpecialty?.name ?? "Chưa chọn"}</dd></div><div><dt>Bác sĩ</dt><dd>{selectedDoctor ? getDoctorDisplayName(selectedDoctor) : (form.specialty_id ? "Phòng khám phân công" : "Chưa chọn")}</dd></div><div><dt>Ngày khám</dt><dd>{form.appointment_date ? formatDate(form.appointment_date) : "Chưa chọn"}</dd></div><div><dt>Buổi khám</dt><dd>{form.session === "MORNING" ? "Buổi sáng" : form.session === "AFTERNOON" ? "Buổi chiều" : "Chưa chọn"}</dd></div></dl>
          <div className="booking-summary__note"><ShieldCheck aria-hidden="true" /><p>Thông tin chỉ được dùng để xử lý lịch hẹn. Lịch được chọn theo buổi, không phải giờ cụ thể.</p></div>
          <a href="tel:19006868"><Phone aria-hidden="true" /> Cần hỗ trợ? 1900 6868</a>
        </aside>
      </div>
    </div>
  );
}
