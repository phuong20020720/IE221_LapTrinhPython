import { authFetch } from "./auth";
import { API_BASE_URL } from "./client";

export type AppointmentSession = "MORNING" | "AFTERNOON";

export type AppointmentStatus =
  | "PENDING_ASSIGNMENT"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type CancellationReason = "PATIENT_REQUEST" | "CLINIC" | "NO_SHOW";

/** The only public fields — matches MVP spec 11.5. */
export type PublicAppointment = {
  booking_code: string;
  specialty_name: string;
  doctor_name: string | null;
  appointment_date: string;
  session: AppointmentSession;
  session_display: string;
  status: AppointmentStatus;
  status_display: string;
};

export type Appointment = PublicAppointment & {
  id: number;
  patient: number;
  patient_name: string;
  patient_phone: string;
  specialty: number;
  doctor: number | null;
  reason: string;
  cancellation_reason: CancellationReason | "";
  cancelled_by: number | null;
  cancelled_by_name: string | null;
  cancelled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingInput = {
  full_name: string;
  phone: string;
  email?: string;
  specialty_id: number;
  doctor_id?: number | null;
  appointment_date: string;
  session: AppointmentSession;
  reason: string;
};

export type AppointmentFilters = {
  date?: string;
  doctorId?: number;
  patientId?: number;
  status?: AppointmentStatus | "";
  query?: string;
  page?: number;
  pageSize?: number;
};

/** Paginated envelope returned by the internal appointment list. */
export type Page<T> = {
  results: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
};

/**
 * Minimal catalogue for the booking form.
 *
 * Deliberately kept apart from Developer 3's `shared/api/doctors.ts`: the type
 * there assumes a doctor has many specialties, while the ERD gives exactly one.
 * Keeping them separate stops the two branches colliding on merge.
 */
export type BookingSpecialty = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
};

export type BookingDoctor = {
  id: number;
  full_name: string;
  credentials: string;
  position: string;
  specialty: number;
  specialty_name: string;
  is_active: boolean;
};

export const SESSION_LABELS: Record<AppointmentSession, string> = {
  MORNING: "Buổi sáng",
  AFTERNOON: "Buổi chiều",
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING_ASSIGNMENT: "Chờ phân công bác sĩ",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang khám",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};

export const CANCELLATION_LABELS: Record<CancellationReason, string> = {
  PATIENT_REQUEST: "Bệnh nhân yêu cầu hủy",
  CLINIC: "Phòng khám hủy",
  NO_SHOW: "Bệnh nhân không đến khám",
};

/** Legal transitions — must match `apps/appointments/state.py`. */
export const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING_ASSIGNMENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as Record<string, unknown>;
    if (typeof data.detail === "string") {
      return data.detail;
    }
    const first = Object.values(data)[0];
    if (Array.isArray(first) && typeof first[0] === "string") {
      return first[0];
    }
    if (typeof first === "string") {
      return first;
    }
  } catch {
    // Ignore responses that are not JSON.
  }
  return "Yêu cầu không thành công.";
}

export async function listBookingSpecialties(
  signal?: AbortSignal,
): Promise<BookingSpecialty[]> {
  const response = await fetch(`${API_BASE_URL}/specialties`, { signal });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<BookingSpecialty[]>;
}

export async function listBookingDoctors(
  specialtyId?: number,
  signal?: AbortSignal,
): Promise<BookingDoctor[]> {
  const params = new URLSearchParams();
  if (specialtyId) {
    params.set("specialty_id", String(specialtyId));
  }
  const query = params.toString();
  const response = await fetch(
    `${API_BASE_URL}/doctors/${query ? `?${query}` : ""}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<BookingDoctor[]>;
}

export async function createBooking(
  input: BookingInput,
): Promise<PublicAppointment> {
  const response = await fetch(`${API_BASE_URL}/appointments/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<PublicAppointment>;
}

export async function lookupAppointments(
  criteria: { booking_code?: string; phone?: string },
  signal?: AbortSignal,
): Promise<PublicAppointment[]> {
  const params = new URLSearchParams();
  if (criteria.booking_code?.trim()) {
    params.set("booking_code", criteria.booking_code.trim());
  }
  if (criteria.phone?.trim()) {
    params.set("phone", criteria.phone.trim());
  }
  const response = await fetch(
    `${API_BASE_URL}/appointments/lookup/?${params}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<PublicAppointment[]>;
}

export async function listAppointments(
  filters: AppointmentFilters = {},
): Promise<Page<Appointment>> {
  const params = new URLSearchParams();
  if (filters.date) {
    params.set("date", filters.date);
  }
  if (filters.doctorId) {
    params.set("doctor_id", String(filters.doctorId));
  }
  if (filters.patientId) {
    params.set("patient_id", String(filters.patientId));
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.query?.trim()) {
    params.set("q", filters.query.trim());
  }
  if (filters.page) {
    params.set("page", String(filters.page));
  }
  if (filters.pageSize) {
    params.set("page_size", String(filters.pageSize));
  }
  const query = params.toString();
  const response = await authFetch(
    `/appointments/${query ? `?${query}` : ""}`,
  );
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Page<Appointment>>;
}

export async function updateAppointment(
  id: number,
  input: Partial<{
    doctor_id: number | null;
    appointment_date: string;
    session: AppointmentSession;
    reason: string;
  }>,
): Promise<Appointment> {
  const response = await authFetch(`/appointments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Appointment>;
}

export async function transitionAppointment(
  id: number,
  status: AppointmentStatus,
  cancellationReason?: CancellationReason,
): Promise<Appointment> {
  const response = await authFetch(`/appointments/${id}/transition/`, {
    method: "POST",
    body: JSON.stringify({
      status,
      cancellation_reason: cancellationReason ?? "",
    }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Appointment>;
}
