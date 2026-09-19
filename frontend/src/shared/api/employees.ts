import { authFetch } from "./auth";
import { addPageParams, type PageRequest, type PageResult } from "./pagination";

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

export type EmployeeFilters = PageRequest & {
  search?: string;
  status?: "ALL" | "ACTIVE" | "INACTIVE";
};

export async function listEmployees(filters: EmployeeFilters = {}): Promise<PageResult<Employee>> {
  const params = new URLSearchParams({ include_inactive: "true" });
  if (filters.search?.trim()) params.set("q", filters.search.trim());
  if (filters.status === "ACTIVE") params.set("is_active", "true");
  if (filters.status === "INACTIVE") params.set("is_active", "false");
  addPageParams(params, filters);
  const response = await authFetch(`/employees/?${params}`);
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<PageResult<Employee>>;
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
