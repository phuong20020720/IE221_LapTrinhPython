import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { App } from "./App";


afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("App", () => {
  it("renders the branded Medicare home and shared customer layout", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Chăm sóc sức khỏe tận tâm, đặt lịch thật thuận tiện",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Mặt tiền Phòng khám Medicare hiện đại" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Website demo phục vụ đồ án Python."),
    ).toBeInTheDocument();
  });

  it("shows the chatbot on customer routes", () => {
    window.history.replaceState({}, "", "/doctors");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
    );

    render(<App />);

    expect(screen.getByRole("heading", { name: "Đội ngũ bác sĩ Medicare" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mở trợ lý Medicare" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Phòng khám Medicare - Trang chủ" })).toBeInTheDocument();
  });

  it("opens the accessible mobile navigation", () => {
    render(<App />);

    const menuButton = screen.getByLabelText("Mở menu");
    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("customer-mobile-nav")).not.toHaveAttribute("hidden");
  });

  it("does not show the chatbot on the internal login route", () => {
    window.history.replaceState({}, "", "/login");

    render(<App />);

    expect(screen.queryByRole("button", { name: "Mở trợ lý Medicare" })).not.toBeInTheDocument();
  });

  it("does not expose public appointment lookup navigation or route", () => {
    window.history.replaceState({}, "", "/lookup");

    render(<App />);

    expect(window.location.pathname).toBe("/");
    expect(screen.queryByRole("link", { name: /Tra cứu/ })).not.toBeInTheDocument();
  });
});

