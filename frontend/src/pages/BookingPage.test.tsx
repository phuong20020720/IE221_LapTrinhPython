import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../app/App";

const specialty = { id: 2, name: "Tim mạch", description: "Khám tim mạch" };
const doctor = {
  id: 7,
  full_name: "Nguyễn Minh An",
  credentials: "Bác sĩ chuyên khoa II",
  position: "Bác sĩ điều trị",
  years_of_experience: 12,
  profile_image_url: null,
  professional_description: "",
  specialty: { id: 2, name: "Tim mạch" },
  expertises: [],
};
const createdAppointment = {
  booking_code: "0c97c72d-ea7e-4f53-85d0-d8c4e9346d01",
  specialty: { id: 2, name: "Tim mạch" },
  doctor: { id: 7, name: "Nguyễn Minh An" },
  appointment_date: "2099-10-05",
  session: "MORNING",
  session_label: "Buổi sáng",
  status: "CONFIRMED",
  status_label: "Đã xác nhận",
};

function response(data: unknown, ok = true, status = ok ? 200 : 400) {
  return Promise.resolve({ ok, status, json: async () => data });
}

function page(results: unknown[]) {
  return { count: results.length, next: null, previous: null, results };
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/Ngày khám/), { target: { value: "2099-10-05" } });
  fireEvent.click(screen.getByLabelText("Buổi sáng"));
  fireEvent.change(screen.getByLabelText(/Lý do khám/), { target: { value: "Khám đau ngực" } });
  fireEvent.change(screen.getByLabelText(/Họ và tên/), { target: { value: "Nguyễn Văn Khách" } });
  fireEvent.change(screen.getByLabelText(/Số điện thoại/), { target: { value: "0903456789" } });
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "customer@example.com" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("BookingPage", () => {
  it("preselects a valid doctor and creates an appointment once", async () => {
    window.history.replaceState({}, "", "/booking?doctor_id=7");
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/specialties/")) return response(page([specialty]));
      if (url.includes("/doctors/")) return response(page([doctor]));
      if (url.includes("/appointments/") && init?.method === "POST") return response(createdAppointment, true, 201);
      return response({}, false);
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("scrollTo", vi.fn());

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /Chuyên khoa/ })).toHaveAttribute("data-value", "2");
      expect(screen.getByRole("combobox", { name: /Bác sĩ/ })).toHaveAttribute("data-value", "7");
    });
    expect(screen.getByRole("combobox", { name: /Bác sĩ/ })).toHaveTextContent("Bác sĩ chuyên khoa II Nguyễn Minh An");
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đặt lịch" }));

    expect(await screen.findByRole("heading", { name: "Lịch khám của bạn đã được xác nhận" })).toBeInTheDocument();
    expect(screen.getByText(createdAppointment.booking_code)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tra cứu lịch" })).not.toBeInTheDocument();
    const postCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(postCalls).toHaveLength(1);
    expect(JSON.parse(String(postCalls[0][1]?.body))).toMatchObject({ specialty_id: 2, doctor_id: 7, session: "MORNING" });
  });

  it("validates required fields before sending the appointment", async () => {
    window.history.replaceState({}, "", "/booking");
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      void init;
      return String(input).includes("/specialties/") ? response(page([specialty])) : response(page([doctor]));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await waitFor(() => expect(screen.getByRole("combobox", { name: /Chuyên khoa/ })).not.toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đặt lịch" }));

    expect(screen.getByText("Vui lòng chọn chuyên khoa.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập họ và tên.")).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
  });

  it("shows a warning when the requested doctor is not available", async () => {
    window.history.replaceState({}, "", "/booking?doctor_id=999");
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/specialties/")) return response(page([specialty]));
      if (url.includes("/doctors/")) return response(page([doctor]));
      return response({}, false);
    }));

    render(<App />);

    expect(await screen.findByText(/Bác sĩ được chọn không tồn tại/)).toBeInTheDocument();
  });

  it("maps backend field errors beside the relevant input", async () => {
    window.history.replaceState({}, "", "/booking?doctor_id=7");
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/specialties/")) return response(page([specialty]));
      if (url.includes("/doctors/")) return response(page([doctor]));
      if (init?.method === "POST") return response({ phone: ["Số điện thoại đã bị từ chối."] }, false);
      return response({}, false);
    }));

    render(<App />);

    await waitFor(() => expect(screen.getByRole("combobox", { name: /Chuyên khoa/ })).toHaveAttribute("data-value", "2"));
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đặt lịch" }));

    expect(await screen.findAllByText("Số điện thoại đã bị từ chối.")).not.toHaveLength(0);
  });

  it("allows choosing a specialty from the custom dropdown", async () => {
    window.history.replaceState({}, "", "/booking");
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/specialties/")) return response(page([specialty]));
      if (url.includes("/doctors/")) return response(page([doctor]));
      return response({}, false);
    }));

    render(<App />);

    const specialtyTrigger = screen.getByRole("combobox", { name: /Chuyên khoa/ });
    await waitFor(() => expect(specialtyTrigger).not.toBeDisabled());
    fireEvent.pointerDown(specialtyTrigger, { button: 0, ctrlKey: false, pointerType: "mouse" });
    const specialtyOption = await screen.findByRole("option", { name: "Tim mạch" });
    fireEvent.click(specialtyOption);

    await waitFor(() => expect(specialtyTrigger).toHaveAttribute("data-value", "2"));
    expect(screen.getByRole("combobox", { name: /Bác sĩ/ })).not.toBeDisabled();
  });
});
