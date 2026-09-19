import { authFetch } from "./auth";
import { addPageParams, type PageRequest, type PageResult } from "./pagination";

export type Patient = {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PatientInput = {
  family_name: string;
  given_name: string;
  phone: string;
  email?: string;
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
  } catch {
    /* ignore */
  }
  return "Yêu cầu không thành công.";
}

export type PatientFilters = PageRequest & {
  search?: string;
  status?: "ALL" | "ACTIVE" | "INACTIVE";
};

export async function listPatients(filters: PatientFilters = {}): Promise<PageResult<Patient>> {
  const params = new URLSearchParams();
  params.set("include_inactive", "true");
  if (filters.search?.trim()) params.set("q", filters.search.trim());
  if (filters.status === "ACTIVE") params.set("is_active", "true");
  if (filters.status === "INACTIVE") params.set("is_active", "false");
  addPageParams(params, filters);
  const response = await authFetch(`/patients/?${params}`);
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<PageResult<Patient>>;
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  const response = await authFetch("/patients/", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Patient>;
}

export async function updatePatient(
  id: number,
  input: Partial<PatientInput>,
): Promise<Patient> {
  const response = await authFetch(`/patients/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Patient>;
}

export async function deactivatePatient(id: number): Promise<Patient> {
  const response = await authFetch(`/patients/${id}/`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Patient>;
}

export async function activatePatient(id: number): Promise<Patient> {
  return updatePatient(id, { is_active: true });
}
