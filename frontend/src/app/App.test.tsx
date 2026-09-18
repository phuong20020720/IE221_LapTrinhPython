import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { App } from "./App";


afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("App", () => {
  it("renders the source-base page and imported image asset", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "healthy",
          service: "medibook-backend",
          database: "connected",
        }),
      }),
    );

    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Nền tảng đặt lịch khám đang được khởi tạo.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Minh họa phòng khám MediBook" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Backend và PostgreSQL đã kết nối."),
    ).toBeInTheDocument();
  });

  it("shows the chatbot on customer routes", () => {
    window.history.replaceState({}, "", "/doctors");

    render(<App />);

    // expect(screen.getByRole("heading", { name: "Danh sách bác sĩ" })).toBeInTheDocument();
    // expect(screen.getByRole("button", { name: "Mở trợ lý MediBook" })).toBeInTheDocument();
    expect( screen.getByRole("heading", { name: "Tìm bác sĩ phù hợp",}),).toBeInTheDocument();
    expect( screen.getByRole("button", { name: "Mở trợ lý MediBook",}),).toBeInTheDocument();
  });

  it("does not show the chatbot on the internal login route", () => {
    window.history.replaceState({}, "", "/login");

    render(<App />);

    expect(screen.queryByRole("button", { name: "Mở trợ lý MediBook" })).not.toBeInTheDocument();
  });
});

