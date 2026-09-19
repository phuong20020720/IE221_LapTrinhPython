import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { App } from "./App";


afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("Auth and internal routes", () => {
  it("redirects unauthenticated users from /admin to /login", async () => {
    window.history.replaceState({}, "", "/admin");
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "Đăng nhập nội bộ" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Medicare" })).toBeInTheDocument();
    expect(screen.queryByText("MediBook", { exact: true })).not.toBeInTheDocument();
  });

  it("logs in and opens the admin area", async () => {
    window.history.replaceState({}, "", "/login");

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/auth/token/") && init?.method === "POST") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              access: "access-token",
              refresh: "refresh-token",
              user: {
                id: 1,
                username: "emp1",
                full_name: "Employee One",
                role: "EMPLOYEE",
              },
            }),
          };
        }
        if (url.endsWith("/auth/me/")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              id: 1,
              username: "emp1",
              full_name: "Employee One",
              role: "EMPLOYEE",
              is_active: true,
            }),
          };
        }
        return {
          ok: false,
          status: 404,
          json: async () => ({ detail: "not found" }),
        };
      }),
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText("Tên đăng nhập"), {
      target: { value: "emp1" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "EmpPass123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      await screen.findByRole("heading", { name: /Chào Employee One/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Employee One/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Medicare - Tổng quan quản trị" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Medicare" })).toBeInTheDocument();
    expect(screen.getByText("Medicare Admin")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Nhân viên" })).not.toBeInTheDocument();
  });

  it("shows employee management only for admin", async () => {
    window.sessionStorage.setItem("medibook_access_token", "access-token");
    window.sessionStorage.setItem("medibook_refresh_token", "refresh-token");
    window.sessionStorage.setItem(
      "medibook_auth_user",
      JSON.stringify({
        id: 2,
        username: "admin1",
        full_name: "Admin One",
        role: "ADMIN",
      }),
    );
    window.history.replaceState({}, "", "/admin");

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/auth/me/")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              id: 2,
              username: "admin1",
              full_name: "Admin One",
              role: "ADMIN",
              is_active: true,
            }),
          };
        }
        return {
          ok: false,
          status: 404,
          json: async () => ({ detail: "not found" }),
        };
      }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Nhân viên" })).toBeInTheDocument();
    });
  });
});
