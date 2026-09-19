import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BookingPage } from "./BookingPage";

vi.mock("../shared/api/appointments", async () => {
  const actual = await vi.importActual<
    typeof import("../shared/api/appointments")
  >("../shared/api/appointments");
  return {
    ...actual,
    listBookingSpecialties: vi.fn(),
    listBookingDoctors: vi.fn(),
    createBooking: vi.fn(),
  };
});

const api = await import("../shared/api/appointments");

const specialty = {
  id: 1,
  name: "Nội tổng hợp",
  description: "",
  is_active: true,
};

const doctor = {
  id: 7,
  full_name: "BS Tran Van B",
  credentials: "BS.CKII",
  position: "",
  specialty: 1,
  specialty_name: "Nội tổng hợp",
  is_active: true,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <BookingPage />
    </MemoryRouter>,
  );
}

describe("BookingPage", () => {
  beforeEach(() => {
    vi.mocked(api.listBookingSpecialties).mockResolvedValue([specialty]);
    vi.mocked(api.listBookingDoctors).mockResolvedValue([doctor]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("warns that the appointment waits for assignment when no doctor is picked", async () => {
    renderPage();

    expect(
      await screen.findByText(
        "Chưa chọn bác sĩ — lịch sẽ ở trạng thái chờ phân công.",
      ),
    ).toBeInTheDocument();
  });

  it("submits the booking and shows the returned code", async () => {
    vi.mocked(api.createBooking).mockResolvedValue({
      booking_code: "9f1c0f4e-0000-4000-8000-000000000001",
      specialty_name: "Nội tổng hợp",
      doctor_name: "BS Tran Van B",
      appointment_date: "2026-10-05",
      session: "MORNING",
      session_display: "Buổi sáng",
      status: "CONFIRMED",
      status_display: "Đã xác nhận",
    });

    renderPage();

    await screen.findByRole("option", { name: "Nội tổng hợp" });

    fireEvent.change(screen.getByLabelText("Chuyên khoa"), {
      target: { value: "1" },
    });
    await screen.findByRole("option", { name: "BS.CKII BS Tran Van B" });
    fireEvent.change(screen.getByLabelText("Bác sĩ (tùy chọn)"), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Ngày khám"), {
      target: { value: "2026-10-05" },
    });
    fireEvent.change(screen.getByLabelText("Họ và tên"), {
      target: { value: "Nguyen Van A" },
    });
    fireEvent.change(screen.getByLabelText("Số điện thoại"), {
      target: { value: "0901234567" },
    });
    fireEvent.change(screen.getByLabelText("Lý do khám"), {
      target: { value: "Kham tong quat" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Đặt lịch khám" }));

    expect(
      await screen.findByText("9f1c0f4e-0000-4000-8000-000000000001"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(vi.mocked(api.createBooking)).toHaveBeenCalledWith(
        expect.objectContaining({ specialty_id: 1, doctor_id: 7 }),
      ),
    );
  });

  it("surfaces a backend validation error without clearing the form", async () => {
    vi.mocked(api.createBooking).mockRejectedValue(
      new Error("Bác sĩ không thuộc chuyên khoa đã chọn."),
    );

    renderPage();
    await screen.findByRole("option", { name: "Nội tổng hợp" });

    fireEvent.change(screen.getByLabelText("Chuyên khoa"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Ngày khám"), {
      target: { value: "2026-10-05" },
    });
    fireEvent.change(screen.getByLabelText("Họ và tên"), {
      target: { value: "Nguyen Van A" },
    });
    fireEvent.change(screen.getByLabelText("Số điện thoại"), {
      target: { value: "0901234567" },
    });
    fireEvent.change(screen.getByLabelText("Lý do khám"), {
      target: { value: "Kham" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đặt lịch khám" }));

    expect(
      await screen.findByText("Bác sĩ không thuộc chuyên khoa đã chọn."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Họ và tên")).toHaveValue("Nguyen Van A");
  });
});
