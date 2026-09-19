import { authFetch } from "./auth";
import { API_BASE_URL } from "./client";
import { addPageParams, type PageRequest, type PageResult } from "./pagination";

export type Specialty = {
  id: number;
  name: string;
  description: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SpecialtyInput = {
  name: string;
  description?: string;
  is_active?: boolean;
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

export type SpecialtyFilters = PageRequest & {
  search?: string;
  includeInactive?: boolean;
  status?: "ALL" | "ACTIVE" | "INACTIVE";
};

function queryString(filters: SpecialtyFilters): string {
  const params = new URLSearchParams();
  if (filters.search?.trim()) {
    params.set("q", filters.search.trim());
  }
  if (filters.includeInactive !== undefined) {
    params.set("include_inactive", String(filters.includeInactive));
  }
  if (filters.status === "ACTIVE") params.set("is_active", "true");
  if (filters.status === "INACTIVE") params.set("is_active", "false");
  addPageParams(params, filters);
  const value = params.toString();
  return value ? `?${value}` : "";
}

export async function listPublicSpecialties(
  filters: SpecialtyFilters = {},
  signal?: AbortSignal,
): Promise<PageResult<Specialty>> {
  const response = await fetch(
    `${API_BASE_URL}/specialties/${queryString(filters)}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<PageResult<Specialty>>;
}

export async function listAdminSpecialties(
  filters: SpecialtyFilters = { includeInactive: true },
): Promise<PageResult<Specialty>> {
  const response = await authFetch(
    `/admin/specialties/${queryString({ includeInactive: true, ...filters })}`,
  );
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<PageResult<Specialty>>;
}

export async function createSpecialty(input: SpecialtyInput): Promise<Specialty> {
  const response = await authFetch("/admin/specialties/", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Specialty>;
}

export async function updateSpecialty(
  id: number,
  input: Partial<SpecialtyInput>,
): Promise<Specialty> {
  const response = await authFetch(`/admin/specialties/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Specialty>;
}

export async function deactivateSpecialty(id: number): Promise<void> {
  const response = await authFetch(`/admin/specialties/${id}/`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}

export async function activateSpecialty(id: number): Promise<Specialty> {
  return updateSpecialty(id, { is_active: true });
}
