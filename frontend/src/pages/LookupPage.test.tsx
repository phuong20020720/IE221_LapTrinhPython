import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LookupPage } from "./LookupPage";

vi.mock("../shared/api/appointments", async () => {
  const actual = await vi.importActual<
    typeof import("../shared/api/appointments")
  >("../shared/api/appointments");
  return { ...actual, lookupAppointments: vi.fn() };
});

const api = await import("../shared/api/appointments");

function renderPage() {
  return render(
    <MemoryRouter>
      <LookupPage />
    </MemoryRouter>,
  );
}

describe("LookupPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("looks up by booking code by default", async () => {
    vi.mocked(api.lookupAppointments).mockResolvedValue([
      {
        booking_code: "9f1c0f4e-0000-4000-8000-000000000001",
        specialty_name: "Nội tổng hợp",
        doctor_name: null,
        appointment_date: "2026-10-05",
        session: "MORNING",
        session_display: "Buổi sáng",
        status: "PENDING_ASSIGNMENT",
        status_display: "Chờ phân công bác sĩ",
      },
    ]);

    renderPage();
    fireEvent.change(screen.getByLabelText("Mã lịch hẹn"), {
      target: { value: "9f1c0f4e-0000-4000-8000-000000000001" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));

    expect(await screen.findByText("Tìm thấy 1 lịch hẹn")).toBeInTheDocument();
    expect(screen.getByText("Chưa phân công")).toBeInTheDocument();
    expect(vi.mocked(api.lookupAppointments)).toHaveBeenCalledWith({
      booking_code: "9f1c0f4e-0000-4000-8000-000000000001",
    });
  });

  it("switches to phone mode and sends the phone criterion", async () => {
    vi.mocked(api.lookupAppointments).mockResolvedValue([]);

    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Số điện thoại" }));
    fireEvent.change(screen.getByLabelText("Số điện thoại"), {
      target: { value: "0901234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));

    expect(await screen.findByText("Tìm thấy 0 lịch hẹn")).toBeInTheDocument();
    expect(vi.mocked(api.lookupAppointments)).toHaveBeenCalledWith({
      phone: "0901234567",
    });
  });

  it("shows the not-found message instead of other patients' data", async () => {
    vi.mocked(api.lookupAppointments).mockRejectedValue(
      new Error("Không tìm thấy lịch hẹn phù hợp."),
    );

    renderPage();
    fireEvent.change(screen.getByLabelText("Mã lịch hẹn"), {
      target: { value: "khong-ton-tai" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));

    expect(
      await screen.findByText("Không tìm thấy lịch hẹn phù hợp."),
    ).toBeInTheDocument();
  });
});
