import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminDoctorsPage } from "./AdminDoctorsPage";
import { SpecialtiesPage } from "./SpecialtiesPage";

function response(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  } as Response;
}

function page(results: unknown[]) {
  return { count: results.length, next: null, previous: null, results };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Admin doctor and specialty pages", () => {
  it("renders doctor data from the separate admin API and opens the upload form", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/admin/doctors/")) {
        return response(page([{ id: 1, full_name: "Nguyễn An", credentials: "BS.CKII", position: "Trưởng khoa", years_of_experience: 12, profile_image_url: null, professional_description: "", specialty: { id: 2, name: "Nội khoa" }, expertises: [], phone: "0901234567", email: "an@example.com", is_active: true }]));
      }
      if (url.includes("/admin/specialties/")) {
        return response(page([{ id: 2, name: "Nội khoa", description: "", is_active: true }]));
      }
      return response([]);
    }));

    render(<AdminDoctorsPage />);

    expect(await screen.findByText("Nguyễn An")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Họ tên bác sĩ" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xem chi tiết Nguyễn An" }));
    expect(await screen.findByRole("heading", { name: "Chi tiết bác sĩ" })).toBeInTheDocument();
    expect(screen.getAllByText("0901234567").length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    fireEvent.click(screen.getByRole("button", { name: "Ngừng Nguyễn An" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Ngừng hoạt động bác sĩ?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    fireEvent.click(screen.getByRole("button", { name: /Thêm bác sĩ/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Họ tên")).toBeInTheDocument();
    expect(screen.getByLabelText("Chọn ảnh")).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  });

  it("renders specialty catalog data without contact fields and opens the shadcn dialog form", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(page([{ id: 3, name: "Tim mạch", description: "Khám tim", is_active: true }]))));

    render(<SpecialtiesPage />);

    expect(await screen.findByText("Tim mạch")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Liên hệ" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Thêm chuyên khoa/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên chuyên khoa")).toBeInTheDocument();
    expect(screen.queryByLabelText("Số điện thoại")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });
});
