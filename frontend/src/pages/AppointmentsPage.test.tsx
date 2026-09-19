import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppointmentsPage } from "./AppointmentsPage";

const appointment = {
  id: 7,
  booking_code: "0c97c72d-ea7e-4f53-85d0-d8c4e9346d01",
  patient: { id: 3, full_name: "Nguyễn Văn Khách", phone: "0903456789", email: "customer@example.com" },
  specialty: { id: 2, name: "Tim mạch" },
  doctor: null,
  appointment_date: "2026-10-05",
  session: "MORNING",
  session_label: "Buổi sáng",
  reason: "Khám đau ngực",
  status: "CONFIRMED",
  status_label: "Đã xác nhận",
  cancellation_reason: "",
  cancelled_by_name: null,
  cancelled_at: null,
  started_at: null,
  completed_at: null,
  created_at: "2026-09-19T08:00:00+07:00",
  updated_at: "2026-09-19T08:00:00+07:00",
};

function response(data: unknown) {
  return { ok: true, status: 200, json: async () => data } as Response;
}

function stubApis() {
  let currentAppointment = appointment;
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/appointments/7/") && init?.method === "DELETE") {
      currentAppointment = { ...appointment, status: "CANCELLED", status_label: "Đã hủy", cancellation_reason: "PATIENT_REQUEST" } as typeof appointment;
      return response(currentAppointment);
    }
    if (url.includes("/appointments/")) return response({ count: 1, next: null, previous: null, results: [currentAppointment] });
    if (url.includes("/specialties/")) return response({ count: 1, next: null, previous: null, results: [{ id: 2, name: "Tim mạch", description: "" }] });
    if (url.includes("/doctors/")) return response({ count: 1, next: null, previous: null, results: [{ id: 4, full_name: "BS Nguyễn An", specialty: { id: 2, name: "Tim mạch" }, credentials: "", position: "", years_of_experience: 8, profile_image_url: null, professional_description: "", expertises: [] }] });
    return response([]);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AppointmentsPage", () => {
  it("renders appointments and opens the detail dialog", async () => {
    const fetchMock = stubApis();
    render(<AppointmentsPage />);

    expect(await screen.findByText("Nguyễn Văn Khách")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hôm nay" })).toHaveAttribute("aria-pressed", "true");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("scope=today"),
      expect.anything(),
    );
    expect(screen.getByText("Chưa chỉ định bác sĩ")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xem lịch Nguyễn Văn Khách" }));

    expect(await screen.findByRole("heading", { name: "Chi tiết lịch hẹn" })).toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.tagName === "DD" && node.textContent?.includes("customer@example.com") === true)).toBeInTheDocument();
    expect(screen.getByText("Khám đau ngực")).toBeInTheDocument();
  });

  it("requires a cancellation reason and sends a soft-cancel request", async () => {
    const fetchMock = stubApis();
    render(<AppointmentsPage />);

    expect(await screen.findByText("Nguyễn Văn Khách")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hủy lịch Nguyễn Văn Khách" }));
    expect(await screen.findByRole("heading", { name: "Hủy lịch hẹn?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận hủy" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/appointments/7/"),
        expect.objectContaining({ method: "DELETE", body: JSON.stringify({ cancellation_reason: "PATIENT_REQUEST" }) }),
      );
    });
    expect(await screen.findByText("Đã hủy")).toBeInTheDocument();
  });

  it("switches from today's worklist to all appointments", async () => {
    const fetchMock = stubApis();
    render(<AppointmentsPage />);

    expect(await screen.findByText("Nguyễn Văn Khách")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tất cả" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("scope=all"),
        expect.anything(),
      );
    });
    expect(screen.getByRole("button", { name: "Tất cả" })).toHaveAttribute("aria-pressed", "true");
  });
});
