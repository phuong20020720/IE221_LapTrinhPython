import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EmployeesPage } from "./EmployeesPage";
import { PatientsPage } from "./PatientsPage";

function response(data: unknown) {
  return { ok: true, status: 200, json: async () => data } as Response;
}

function page(results: unknown[]) {
  return { count: results.length, next: null, previous: null, results };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Admin people pages with shadcn UI", () => {
  it("renders patients, opens the form and uses an alert dialog for status changes", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(page([{ id: 1, full_name: "Nguyễn Văn An", phone: "0901234567", email: "an@example.com", is_active: true, created_at: "2026-09-19T08:00:00Z", updated_at: "2026-09-19T08:00:00Z" }]))));
    render(<PatientsPage />);

    expect(await screen.findByText("Nguyễn Văn An")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Họ tên bệnh nhân" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ngừng Nguyễn Văn An" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    fireEvent.click(screen.getByRole("button", { name: /Thêm bệnh nhân/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Số điện thoại")).toBeInTheDocument();
  });

  it("renders employees and opens the shadcn account form", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(page([{ id: 2, username: "employee1", first_name: "An", last_name: "Nguyễn", full_name: "Nguyễn An", role: "EMPLOYEE", is_active: true, last_login: null, created_at: "2026-09-19T08:00:00Z", updated_at: "2026-09-19T08:00:00Z" }]))));
    render(<EmployeesPage />);

    expect(await screen.findByText("Nguyễn An")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Tên đăng nhập" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Thêm nhân viên/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên đăng nhập")).toBeInTheDocument();
  });

  it("loads the next patient page from the server", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const patient = url.includes("page=2")
        ? { id: 11, full_name: "Bệnh nhân trang hai", phone: "0900000011", email: "", is_active: true, created_at: "2026-09-19T08:00:00Z", updated_at: "2026-09-19T08:00:00Z" }
        : { id: 1, full_name: "Bệnh nhân trang một", phone: "0900000001", email: "", is_active: true, created_at: "2026-09-19T08:00:00Z", updated_at: "2026-09-19T08:00:00Z" };
      return response({ count: 11, next: "page=2", previous: null, results: [patient] });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<PatientsPage />);

    expect(await screen.findByText("Bệnh nhân trang một")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));

    expect(await screen.findByText("Bệnh nhân trang hai")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes("page=2"))).toBe(true);
  });
});
