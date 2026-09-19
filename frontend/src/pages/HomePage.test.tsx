import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../app/App";

const specialties = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  name: `Chuyên khoa ${index + 1}`,
  description: `Mô tả chuyên khoa ${index + 1}`,
}));

const doctors = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  full_name: `Bác sĩ Demo ${index + 1}`,
  credentials: "Bác sĩ chuyên khoa I",
  position: "Bác sĩ",
  years_of_experience: 8 + index,
  profile_image_url: null,
  professional_description: "",
  specialty: { id: 1, name: "Nội tổng quát" },
  expertises: [],
}));

function response(data: unknown, ok = true) {
  return Promise.resolve({ ok, json: async () => data });
}

function page(results: unknown[]) {
  return { count: results.length, next: null, previous: null, results };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("HomePage", () => {
  it("shows API specialties and featured doctors within the approved limits", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      return url.includes("/specialties/") ? response(page(specialties.slice(0, 6))) : response(page(doctors.slice(0, 4)));
    }));

    render(<App />);

    expect(await screen.findByText("Chuyên khoa 6")).toBeInTheDocument();
    expect(screen.queryByText("Chuyên khoa 7")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Bác sĩ Demo 4" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Bác sĩ Demo 5" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Đặt lịch" })[0]).toHaveAttribute(
      "href",
      "/booking?doctor_id=1",
    );
    expect(screen.getByRole("heading", { name: "Bốn bước đơn giản để chủ động lịch khám" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hướng dẫn đặt lịch khám tại Medicare" })).toBeInTheDocument();
  });

  it("lets the visitor retry a failed specialty request", async () => {
    let specialtyAttempts = 0;
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/specialties/")) {
        specialtyAttempts += 1;
        return specialtyAttempts === 1
          ? response({ detail: "Unavailable" }, false)
          : response(page(specialties.slice(0, 1)));
      }
      return response(page([]));
    }));

    render(<App />);

    expect(await screen.findByText("Chưa thể tải danh sách chuyên khoa.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(await screen.findByText("Chuyên khoa 1")).toBeInTheDocument();
    expect(specialtyAttempts).toBe(2);
  });
});
