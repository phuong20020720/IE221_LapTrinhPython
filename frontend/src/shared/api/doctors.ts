import { API_BASE_URL } from "./client";
import { authFetch } from "./auth";


export type Specialty = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DoctorExpertise = {
  id: number;
  specialty: Specialty;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type Doctor = {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  qualification: string;
  experience_years: number;
  bio: string;
  image: string;
  is_active: boolean;
  expertises: DoctorExpertise[];
  created_at: string;
  updated_at: string;
};

export type DoctorFilters = {
  search?: string;
  specialtyId?: number;
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
    // Ignore invalid JSON error responses.
  }

  return "Yêu cầu không thành công.";
}

export async function listDoctors(
  filters: DoctorFilters = {},
  signal?: AbortSignal,
): Promise<Doctor[]> {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.specialtyId) {
    params.set("specialty_id", String(filters.specialtyId));
  }

  const query = params.toString();

  const response = await fetch(
    `${API_BASE_URL}/doctors/${query ? `?${query}` : ""}`,
    {
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<Doctor[]>;
}

export async function getDoctor(
  id: number,
  signal?: AbortSignal,
): Promise<Doctor> {
  const response = await fetch(
    `${API_BASE_URL}/doctors/${id}/`,
    {
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<Doctor>;
}

export async function listSpecialties(
  signal?: AbortSignal,
): Promise<Specialty[]> {
  const response = await fetch(
    `${API_BASE_URL}/specialties/`,
    {
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<Specialty[]>;
}

export type DoctorExpertiseInput = {
  specialty_id: number;
  is_primary: boolean;
};

export type DoctorInput = {
  full_name: string;
  phone?: string;
  email?: string;
  qualification?: string;
  experience_years?: number;
  bio?: string;
  image?: string;
  is_active?: boolean;
  expertises?: DoctorExpertiseInput[];
};

async function readAdminError(response: Response): Promise<string> {
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
    // Ignore invalid JSON response.
  }

  return "Yêu cầu không thành công.";
}

export async function listAdminDoctors(): Promise<Doctor[]> {
  const response = await authFetch("/doctors/");

  if (!response.ok) {
    throw new Error(await readAdminError(response));
  }

  return response.json() as Promise<Doctor[]>;
}

export async function createDoctor(
  input: DoctorInput,
): Promise<Doctor> {
  const response = await authFetch("/doctors/", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readAdminError(response));
  }

  return response.json() as Promise<Doctor>;
}

export async function updateDoctor(
  id: number,
  input: Partial<DoctorInput>,
): Promise<Doctor> {
  const response = await authFetch(`/doctors/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readAdminError(response));
  }

  return response.json() as Promise<Doctor>;
}

export async function deactivateDoctor(
  id: number,
): Promise<void> {
  const response = await authFetch(`/doctors/${id}/`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readAdminError(response));
  }
}

export async function activateDoctor(
  id: number,
): Promise<Doctor> {
  return updateDoctor(id, {
    is_active: true,
  });
}