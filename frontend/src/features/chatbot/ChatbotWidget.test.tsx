import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatbotWidget } from "./ChatbotWidget";

vi.mock("../../shared/api/chatbot", () => ({
  sendChatbotMessage: vi.fn(),
}));

describe("ChatbotWidget", () => {
  afterEach(() => cleanup());

  it("shows a hint, keeps the logo visible, and closes from the panel header", () => {
    render(<ChatbotWidget />);

    const launcher = screen.getByRole("button", { name: "Mở trợ lý MediBook" });
    expect(screen.getByText("Bạn cần hỗ trợ? Nhấn để chat")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Trợ lý thông tin" })).not.toBeInTheDocument();

    fireEvent.click(launcher);
    expect(screen.getByRole("heading", { name: "Trợ lý thông tin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đóng trợ lý MediBook" })).toBeInTheDocument();
    expect(screen.queryByText("Bạn cần hỗ trợ? Nhấn để chat")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Đóng khung chat" }));
    expect(screen.queryByRole("heading", { name: "Trợ lý thông tin" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mở trợ lý MediBook" })).toBeInTheDocument();
  });

  it("moves the launcher without opening the panel while dragging", () => {
    render(<ChatbotWidget />);
    const launcher = screen.getByRole("button", { name: "Mở trợ lý MediBook" });

    fireEvent.pointerDown(launcher, { clientX: 120, clientY: 120, pointerId: 1 });
    fireEvent.pointerMove(launcher, { clientX: 220, clientY: 180, pointerId: 1 });
    fireEvent.pointerUp(launcher, { clientX: 220, clientY: 180, pointerId: 1 });
    fireEvent.click(launcher);

    expect(screen.queryByRole("heading", { name: "Trợ lý thông tin" })).not.toBeInTheDocument();
    expect(launcher.parentElement).toHaveStyle({ left: "100px", top: "60px" });
  });
});
