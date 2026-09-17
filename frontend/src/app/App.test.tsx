import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { App } from "./App";


afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
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
});

