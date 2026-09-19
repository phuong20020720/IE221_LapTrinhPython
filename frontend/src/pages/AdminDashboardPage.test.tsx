import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../app/App";

const dashboardData = {
  generated_at: "2026-09-19T09:00:00+07:00",
  summary: {
    appointments_today: 8,
    appointments_total: 42,
    patients_total: 31,
    doctors_total: 6,
  },
  appointments_by_weekday: [
    { date: "2026-09-14", label: "T2", count: 4 },
    { date: "2026-09-15", label: "T3", count: 7 },
    { date: "2026-09-16", label: "T4", count: 5 },
    { date: "2026-09-17", label: "T5", count: 9 },
    { date: "2026-09-18", label: "T6", count: 6 },
    { date: "2026-09-19", label: "T7", count: 8 },
  ],
  patients_by_month: [
    { month: "2026-04", label: "T4/2026", count: 2 },
    { month: "2026-05", label: "T5/2026", count: 4 },
    { month: "2026-06", label: "T6/2026", count: 3 },
    { month: "2026-07", label: "T7/2026", count: 6 },
    { month: "2026-08", label: "T8/2026", count: 8 },
    { month: "2026-09", label: "T9/2026", count: 9 },
  ],
};

function authenticate() {
  window.sessionStorage.setItem("medibook_access_token", "access-token");
  window.sessionStorage.setItem("medibook_refresh_token", "refresh-token");
  window.sessionStorage.setItem("medibook_auth_user", JSON.stringify({
    id: 1,
    username: "employee",
    full_name: "Nhân viên Medicare",
    role: "EMPLOYEE",
  }));
  window.history.replaceState({}, "", "/admin");
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("AdminDashboardPage", () => {
  it("renders operational metrics and both charts from the summary API", async () => {
    authenticate();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me/")) {
        return { ok: true, status: 200, json: async () => ({ id: 1, username: "employee", full_name: "Nhân viên Medicare", role: "EMPLOYEE", is_active: true }) };
      }
      if (url.includes("/dashboard/summary/")) {
        return { ok: true, status: 200, json: async () => dashboardData };
      }
      return { ok: false, status: 404, json: async () => ({ detail: "not found" }) };
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const todayCard = (await screen.findByText("Lịch hôm nay")).closest(".admin-summary-card");
    await waitFor(() => expect(todayCard).toHaveTextContent("8"));
    expect(screen.getByText("Tổng lịch ghi nhận").closest(".admin-summary-card")).toHaveTextContent("42");
    expect(screen.getByText("Bệnh nhân", { selector: ".admin-summary-card__label" }).closest(".admin-summary-card")).toHaveTextContent("31");
    expect(screen.getByText("Bác sĩ hoạt động").closest(".admin-summary-card")).toHaveTextContent("6");
    expect(screen.getByText("Lịch hẹn theo ngày")).toBeInTheDocument();
    expect(screen.getByText("Bệnh nhân mới theo tháng")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Số lịch hẹn từ thứ Hai đến thứ Bảy/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Số bệnh nhân mới trong sáu tháng/ })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/dashboard/summary/"),
      expect.anything(),
    ));

    fireEvent.change(screen.getByLabelText("Chọn tuần thống kê"), { target: { value: "2025-01-15" } });
    fireEvent.change(screen.getByLabelText("Chọn tháng thống kê"), { target: { value: "2025-06" } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/week_date=2025-01-15.*month=2025-06/),
      expect.anything(),
    ));
  });

  it("shows an actionable error when dashboard loading fails", async () => {
    authenticate();
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me/")) {
        return { ok: true, status: 200, json: async () => ({ id: 1, username: "employee", full_name: "Nhân viên Medicare", role: "EMPLOYEE", is_active: true }) };
      }
      return { ok: false, status: 500, json: async () => ({ detail: "error" }) };
    }));

    render(<App />);

    expect(await screen.findByText("Không thể tải dữ liệu tổng quan.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Thử lại/ })).toBeInTheDocument();
  });
});
