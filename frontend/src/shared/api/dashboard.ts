import { authFetch } from "./auth";

export type DashboardSummary = {
  generated_at: string;
  summary: {
    appointments_today: number;
    appointments_total: number;
    patients_total: number;
    doctors_total: number;
  };
  appointments_by_weekday: Array<{
    date: string;
    label: string;
    count: number;
  }>;
  patients_by_month: Array<{
    month: string;
    label: string;
    count: number;
  }>;
};

export async function getDashboardSummary(filters: { weekDate?: string; month?: string } = {}): Promise<DashboardSummary> {
  const params = new URLSearchParams();
  if (filters.weekDate) params.set("week_date", filters.weekDate);
  if (filters.month) params.set("month", filters.month);
  const query = params.size ? `?${params.toString()}` : "";
  const response = await authFetch(`/dashboard/summary/${query}`);
  if (!response.ok) {
    throw new Error("Không thể tải dữ liệu tổng quan.");
  }
  return response.json() as Promise<DashboardSummary>;
}
