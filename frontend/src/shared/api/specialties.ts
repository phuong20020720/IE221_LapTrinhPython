import { authFetch } from "./auth";

export type Specialty = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  } catch {
    // Ignore invalid JSON response.
  }

  return "Yêu cầu không thành công.";
}

export async function listSpecialties(): Promise<Specialty[]> {
  const response = await authFetch("/specialties/");

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<Specialty[]>;
}

export async function createSpecialty(
  input: SpecialtyInput,
): Promise<Specialty> {
  const response = await authFetch("/specialties/", {
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
  const response = await authFetch(`/specialties/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<Specialty>;
}

export async function deactivateSpecialty(
  id: number,
): Promise<void> {
  const response = await authFetch(`/specialties/${id}/`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }
}

export async function activateSpecialty(
  id: number,
): Promise<Specialty> {
  return updateSpecialty(id, {
    is_active: true,
  });
}