import { authFetch } from "./auth";

export type Employee = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: "EMPLOYEE";
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployeeCreateInput = {
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  is_active?: boolean;
};

export type EmployeeUpdateInput = {
  first_name?: string;
  last_name?: string;
  password?: string;
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

export async function listEmployees(): Promise<Employee[]> {
  const response = await authFetch("/employees/?include_inactive=true");
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Employee[]>;
}

export async function createEmployee(
  input: EmployeeCreateInput,
): Promise<Employee> {
  const response = await authFetch("/employees/", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Employee>;
}

export async function updateEmployee(
  id: number,
  input: EmployeeUpdateInput,
): Promise<Employee> {
  const response = await authFetch(`/employees/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Employee>;
}

export async function deactivateEmployee(id: number): Promise<Employee> {
  const response = await authFetch(`/employees/${id}/`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<Employee>;
}

export async function activateEmployee(id: number): Promise<Employee> {
  return updateEmployee(id, { is_active: true });
}
