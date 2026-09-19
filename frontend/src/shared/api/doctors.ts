import { authFetch } from "./auth";
import { API_BASE_URL } from "./client";
import { addPageParams, type PageRequest, type PageResult } from "./pagination";

export type DoctorSpecialty = {
  id: number;
  name: string;
};

export type DoctorExpertise = {
  id: number;
  expertise_name: string;
  description: string;
  display_order: number;
};

export type Doctor = {
  id: number;
  full_name: string;
  credentials: string;
  position: string;
  years_of_experience: number | null;
  profile_image_url: string | null;
  professional_description: string;
  specialty: DoctorSpecialty;
  expertises: DoctorExpertise[];
  phone?: string;
  email?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DoctorFilters = PageRequest & {
  search?: string;
  specialtyId?: number;
  includeInactive?: boolean;
  status?: "ALL" | "ACTIVE" | "INACTIVE";
};

export type DoctorExpertiseInput = {
  expertise_name: string;
  description?: string;
  display_order?: number;
};

export type DoctorInput = {
  specialty_id: number;
  full_name: string;
  phone: string;
  email?: string;
  credentials?: string;
  position?: string;
  years_of_experience?: number | null;
  professional_description?: string;
  is_active?: boolean;
  expertises?: DoctorExpertiseInput[];
  profile_image?: File | null;
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
    // Giữ thông báo mặc định khi backend không trả JSON.
  }
  return "Yêu cầu không thành công.";
}

function createQuery(filters: DoctorFilters): string {
  const params = new URLSearchParams();
  if (filters.search?.trim()) {
    params.set("q", filters.search.trim());
  }
  if (filters.specialtyId) {
    params.set("specialty_id", String(filters.specialtyId));
  }
  if (filters.includeInactive !== undefined) {
    params.set("include_inactive", String(filters.includeInactive));
  }
  if (filters.status === "ACTIVE") params.set("is_active", "true");
  if (filters.status === "INACTIVE") params.set("is_active", "false");
  addPageParams(params, filters);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function toFormData(input: Partial<DoctorInput>): FormData {
  const body = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || key === "profile_image") {
      return;
    }
    if (key === "years_of_experience" && value === null) {
      body.set(key, "");
      return;
    }
    if (value === null) {
      return;
    }
    if (key === "expertises") {
      body.set(key, JSON.stringify(value));
      return;
    }
    body.set(key, String(value));
  });
  if (input.profile_image instanceof File) {
    body.set("profile_image", input.profile_image);
  }
  return body;
}

export async function listDoctors(
  filters: DoctorFilters = {},
  signal?: AbortSignal,
): Promise<PageResult<Doctor>> {
  const response = await fetch(
    `${API_BASE_URL}/doctors/${createQuery(filters)}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<PageResult<Doctor>>;
}

export async function getDoctor(id: number, signal?: AbortSignal): Promise<Doctor> {
  const response = await fetch(`${API_BASE_URL}/doctors/${id}/`, { signal });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Doctor>;
}

export async function listAdminDoctors(
  filters: DoctorFilters = { includeInactive: true },
): Promise<PageResult<Doctor>> {
  const response = await authFetch(`/admin/doctors/${createQuery(filters)}`);
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<PageResult<Doctor>>;
}

export async function createDoctor(input: DoctorInput): Promise<Doctor> {
  const response = await authFetch("/admin/doctors/", {
    method: "POST",
    body: toFormData(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Doctor>;
}

export async function updateDoctor(
  id: number,
  input: Partial<DoctorInput>,
): Promise<Doctor> {
  const response = await authFetch(`/admin/doctors/${id}/`, {
    method: "PATCH",
    body: toFormData(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Doctor>;
}

export async function deactivateDoctor(id: number): Promise<void> {
  const response = await authFetch(`/admin/doctors/${id}/`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}

export async function activateDoctor(id: number): Promise<Doctor> {
  return updateDoctor(id, { is_active: true });
}

export async function removeDoctorImage(id: number): Promise<void> {
  const response = await authFetch(`/admin/doctors/${id}/profile-image/`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}
