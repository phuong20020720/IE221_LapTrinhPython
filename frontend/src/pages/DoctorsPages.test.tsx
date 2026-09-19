import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../app/App";

const specialty = { id: 2, name: "Tim mạch", description: "" };
const doctor = {
  id: 7,
  full_name: "Nguyễn Minh An",
  credentials: "Bác sĩ chuyên khoa II",
  position: "Bác sĩ điều trị",
  years_of_experience: 12,
  profile_image_url: null,
  professional_description: "Kinh nghiệm khám và điều trị bệnh lý tim mạch.",
  specialty,
  expertises: [
    { id: 1, expertise_name: "Tăng huyết áp", description: "Theo dõi và điều trị lâu dài.", display_order: 1 },
  ],
};

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

describe("public doctor flow", () => {
  it("reads the specialty filter from the URL and submits searchable query parameters", async () => {
    window.history.replaceState({}, "", "/doctors?specialty_id=2");
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      return url.includes("/specialties/") ? response(page([specialty])) : response(page([doctor]));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Bác sĩ chuyên khoa II Nguyễn Minh An" })).toBeInTheDocument();
    expect(screen.getByLabelText("Chuyên khoa")).toHaveValue("2");
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes("specialty_id=2"))).toBe(true);

    fireEvent.change(screen.getByLabelText("Tên bác sĩ"), { target: { value: "Minh An" } });
    fireEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([input]) => String(input).includes("q=Minh+An") && String(input).includes("specialty_id=2"))).toBe(true);
    });
  });

  it("shows an empty state and clears active filters", async () => {
    window.history.replaceState({}, "", "/doctors?q=khongco");
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => (
      String(input).includes("/specialties/") ? response(page([specialty])) : response(page([]))
    )));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Không tìm thấy bác sĩ phù hợp" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Xóa bộ lọc" }).at(-1)!);

    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("shows full doctor details, expertise and a preselected booking link", async () => {
    window.history.replaceState({}, "", "/doctors/7");
    vi.stubGlobal("fetch", vi.fn(() => response(doctor)));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Bác sĩ chuyên khoa II Nguyễn Minh An", level: 1 })).toBeInTheDocument();
    expect(screen.queryByText("Bác sĩ chuyên khoa II")).not.toBeInTheDocument();
    expect(screen.getByText("Bác sĩ điều trị")).toBeInTheDocument();
    expect(screen.getByText("Tăng huyết áp")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đặt lịch với bác sĩ" })).toHaveAttribute("href", "/booking?doctor_id=7");
  });

  it("offers retry when the doctor detail request fails", async () => {
    window.history.replaceState({}, "", "/doctors/7");
    let attempts = 0;
    vi.stubGlobal("fetch", vi.fn(() => {
      attempts += 1;
      return attempts === 1 ? response({ detail: "Tạm thời gián đoạn" }, false) : response(doctor);
    }));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Chưa thể tải hồ sơ bác sĩ" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(await screen.findByRole("heading", { name: "Bác sĩ chuyên khoa II Nguyễn Minh An", level: 1 })).toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});
