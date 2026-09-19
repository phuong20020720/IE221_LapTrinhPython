import { authFetch } from "./auth";
import { API_BASE_URL } from "./client";

export type AppointmentStatus = "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type AppointmentSession = "MORNING" | "AFTERNOON";
export type CancellationReason = "PATIENT_REQUEST" | "CLINIC" | "NO_SHOW";
export type AppointmentScope = "today" | "upcoming" | "unassigned" | "history" | "all";

export type Appointment = {
  id: number;
  booking_code: string;
  patient: { id: number; full_name: string; phone: string; email: string };
  specialty: { id: number; name: string };
  doctor: { id: number; name: string } | null;
  appointment_date: string;
  session: AppointmentSession;
  session_label: string;
  reason: string;
  status: AppointmentStatus;
  status_label: string;
  cancellation_reason: CancellationReason | "";
  cancelled_by_name: string | null;
  cancelled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentFilters = {
  search?: string;
  status?: AppointmentStatus | "";
  session?: AppointmentSession | "";
  specialtyId?: number;
  doctorId?: number;
  appointmentDate?: string;
  scope?: AppointmentScope;
  page?: number;
  pageSize?: number;
};

export type AppointmentPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Appointment[];
};

export type AppointmentUpdate = {
  specialty_id?: number;
  doctor_id?: number | null;
  appointment_date?: string;
  session?: AppointmentSession;
  reason?: string;
  status?: AppointmentStatus;
  cancellation_reason?: CancellationReason;
};

export type PublicAppointment = {
  booking_code: string;
  specialty: { id: number; name: string };
  doctor: { id: number; name: string } | null;
  appointment_date: string;
  session: AppointmentSession;
  session_label: string;
  status: AppointmentStatus;
  status_label: string;
};

export type PublicAppointmentInput = {
  full_name: string;
  phone: string;
  email: string;
  specialty_id: number;
  doctor_id: number | null;
  appointment_date: string;
  session: AppointmentSession;
  reason: string;
};

export class AppointmentValidationError extends Error {
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string>) {
    super(message);
    this.name = "AppointmentValidationError";
    this.fields = fields;
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as Record<string, unknown>;
    if (typeof data.detail === "string") return data.detail;
    const first = Object.values(data)[0];
    if (typeof first === "string") return first;
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  } catch {
    // Giữ thông báo mặc định nếu response không phải JSON.
  }
  return "Không thể xử lý yêu cầu lịch hẹn.";
}

async function readPublicError(response: Response): Promise<AppointmentValidationError> {
  const fields: Record<string, string> = {};
  let message = "Không thể tạo lịch hẹn. Vui lòng kiểm tra lại thông tin.";
  try {
    const data = (await response.json()) as Record<string, unknown>;
    for (const [field, value] of Object.entries(data)) {
      const fieldMessage = Array.isArray(value) && typeof value[0] === "string"
        ? value[0]
        : typeof value === "string" ? value : "";
      if (fieldMessage) fields[field] = fieldMessage;
    }
    message = fields.detail ?? fields.non_field_errors ?? Object.values(fields)[0] ?? message;
  } catch {
    // Giữ thông báo tổng quát nếu response không phải JSON.
  }
  return new AppointmentValidationError(message, fields);
}

export async function createPublicAppointment(
  input: PublicAppointmentInput,
): Promise<PublicAppointment> {
  const response = await fetch(`${API_BASE_URL}/appointments/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await readPublicError(response);
  return response.json() as Promise<PublicAppointment>;
}

function queryString(filters: AppointmentFilters): string {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("q", filters.search.trim());
  if (filters.status) params.set("status", filters.status);
  if (filters.session) params.set("session", filters.session);
  if (filters.specialtyId) params.set("specialty_id", String(filters.specialtyId));
  if (filters.doctorId) params.set("doctor_id", String(filters.doctorId));
  if (filters.appointmentDate) params.set("appointment_date", filters.appointmentDate);
  if (filters.scope) params.set("scope", filters.scope);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("page_size", String(filters.pageSize));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listAppointments(filters: AppointmentFilters = {}): Promise<AppointmentPage> {
  const response = await authFetch(`/appointments/${queryString(filters)}`);
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<AppointmentPage>;
}

export async function updateAppointment(id: number, input: AppointmentUpdate): Promise<Appointment> {
  const response = await authFetch(`/appointments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<Appointment>;
}

export async function cancelAppointment(
  id: number,
  cancellationReason: CancellationReason,
): Promise<Appointment> {
  const response = await authFetch(`/appointments/${id}/`, {
    method: "DELETE",
    body: JSON.stringify({ cancellation_reason: cancellationReason }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<Appointment>;
}
