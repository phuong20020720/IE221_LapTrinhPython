import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminAppointmentsPage } from "./AdminAppointmentsPage";
import type { Appointment } from "../shared/api/appointments";

vi.mock("../shared/api/appointments", async () => {
  const actual = await vi.importActual<
    typeof import("../shared/api/appointments")
  >("../shared/api/appointments");
  return {
    ...actual,
    listAppointments: vi.fn(),
    listBookingDoctors: vi.fn(),
    transitionAppointment: vi.fn(),
    updateAppointment: vi.fn(),
  };
});

const api = await import("../shared/api/appointments");

const base = {
  id: 11,
  booking_code: "9f1c0f4e-0000-4000-8000-000000000001",
  patient: 3,
  patient_name: "Nguyen Van A",
  patient_phone: "0901234567",
  specialty: 1,
  specialty_name: "Nội tổng hợp",
  doctor: null,
  doctor_name: null,
  appointment_date: "2026-10-05",
  session: "MORNING" as const,
  session_display: "Buổi sáng",
  reason: "Kham tong quat",
  status: "PENDING_ASSIGNMENT" as const,
  status_display: "Chờ phân công bác sĩ",
  cancellation_reason: "" as const,
  cancelled_by: null,
  cancelled_by_name: null,
  cancelled_at: null,
  started_at: null,
  completed_at: null,
  created_at: "2026-09-19T08:00:00Z",
  updated_at: "2026-09-19T08:00:00Z",
};

function pageOf(
  rows: Appointment[],
  meta: Partial<{ count: number; page: number; total_pages: number }> = {},
) {
  return {
    results: rows,
    count: meta.count ?? rows.length,
    page: meta.page ?? 1,
    page_size: 20,
    total_pages: meta.total_pages ?? 1,
  };
}

describe("AdminAppointmentsPage", () => {
  beforeEach(() => {
    vi.mocked(api.listBookingDoctors).mockResolvedValue([
      {
        id: 7,
        full_name: "BS Tran Van B",
        credentials: "",
        position: "",
        specialty: 1,
        specialty_name: "Nội tổng hợp",
        is_active: true,
      },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("offers only the transitions the state machine allows", async () => {
    vi.mocked(api.listAppointments).mockResolvedValue(pageOf([base]));

    render(<AdminAppointmentsPage />);

    expect(
      await screen.findByRole("button", { name: "Đã xác nhận" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đã hủy" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Đã hoàn tất" }),
    ).not.toBeInTheDocument();
  });

  it("marks a finished appointment as closed with no actions", async () => {
    vi.mocked(api.listAppointments).mockResolvedValue(
      pageOf([
        {
          ...base,
          status: "COMPLETED",
          status_display: "Đã hoàn tất",
          doctor: 7,
          doctor_name: "BS Tran Van B",
        },
      ]),
    );

    render(<AdminAppointmentsPage />);

    expect(await screen.findByText("Đã kết thúc")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Đang khám" }),
    ).not.toBeInTheDocument();
  });

  it("assigns a doctor from the same specialty", async () => {
    vi.mocked(api.listAppointments).mockResolvedValue(pageOf([base]));
    vi.mocked(api.updateAppointment).mockResolvedValue({ ...base, doctor: 7 });

    render(<AdminAppointmentsPage />);

    const select = await screen.findByLabelText("Phân công bác sĩ");
    fireEvent.change(select, { target: { value: "7" } });

    await waitFor(() =>
      expect(vi.mocked(api.updateAppointment)).toHaveBeenCalledWith(11, {
        doctor_id: 7,
      }),
    );
  });

  it("requires a cancellation reason before cancelling", async () => {
    vi.mocked(api.listAppointments).mockResolvedValue(pageOf([base]));
    vi.mocked(api.transitionAppointment).mockResolvedValue({
      ...base,
      status: "CANCELLED",
    });

    render(<AdminAppointmentsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Đã hủy" }));
    expect(
      screen.getByRole("heading", { name: "Hủy lịch hẹn" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Lý do hủy"), {
      target: { value: "NO_SHOW" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận hủy" }));

    await waitFor(() =>
      expect(vi.mocked(api.transitionAppointment)).toHaveBeenCalledWith(
        11,
        "CANCELLED",
        "NO_SHOW",
      ),
    );
  });

  it("surfaces a rejected transition from the backend", async () => {
    vi.mocked(api.listAppointments).mockResolvedValue(
      pageOf([
        {
          ...base,
          status: "CONFIRMED",
          status_display: "Đã xác nhận",
          doctor: 7,
        },
      ]),
    );
    vi.mocked(api.transitionAppointment).mockRejectedValue(
      new Error("Không thể chuyển trạng thái từ CONFIRMED sang COMPLETED."),
    );

    render(<AdminAppointmentsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Đang khám" }));

    expect(
      await screen.findByText(
        "Không thể chuyển trạng thái từ CONFIRMED sang COMPLETED.",
      ),
    ).toBeInTheDocument();
  });

  it("pages forward and requests the next page", async () => {
    vi.mocked(api.listAppointments)
      .mockResolvedValueOnce(pageOf([base], { count: 30, page: 1, total_pages: 2 }))
      .mockResolvedValueOnce(
        pageOf([{ ...base, id: 12, booking_code: "aaaa2222-0000-4000-8000-000000000002" }], {
          count: 30,
          page: 2,
          total_pages: 2,
        }),
      );

    render(<AdminAppointmentsPage />);

    expect(await screen.findByText("Trang 1/2 · 30 lịch hẹn")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));

    expect(await screen.findByText("Trang 2/2 · 30 lịch hẹn")).toBeInTheDocument();
    await waitFor(() =>
      expect(vi.mocked(api.listAppointments)).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );
    expect(screen.getByRole("button", { name: "Trang sau" })).toBeDisabled();
  });

  it("resets to page 1 when a filter changes", async () => {
    vi.mocked(api.listAppointments).mockImplementation((filters) =>
      Promise.resolve(
        pageOf([base], {
          count: 30,
          page: filters?.page ?? 1,
          total_pages: 2,
        }),
      ),
    );

    render(<AdminAppointmentsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Trang sau" }));
    await waitFor(() =>
      expect(vi.mocked(api.listAppointments)).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );

    fireEvent.change(screen.getByLabelText("Trạng thái"), {
      target: { value: "CONFIRMED" },
    });

    await waitFor(() =>
      expect(vi.mocked(api.listAppointments)).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, status: "CONFIRMED" }),
      ),
    );
  });
});
