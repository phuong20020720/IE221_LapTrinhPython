import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatbotWidget } from "./ChatbotWidget";
import { sendChatbotMessage } from "../../shared/api/chatbot";

vi.mock("../../shared/api/chatbot", () => ({
  sendChatbotMessage: vi.fn(),
}));

describe("ChatbotWidget", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows a hint, keeps the logo visible, and closes from the panel header", () => {
    render(<ChatbotWidget />);

    const launcher = screen.getByRole("button", { name: "Mở trợ lý Medicare" });
    expect(screen.getByText("Bạn cần hỗ trợ? Nhấn để chat")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Trợ lý thông tin" })).not.toBeInTheDocument();

    fireEvent.click(launcher);
    expect(screen.getByRole("heading", { name: "Trợ lý thông tin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đóng trợ lý Medicare" })).toBeInTheDocument();
    expect(screen.queryByText("Bạn cần hỗ trợ? Nhấn để chat")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Đóng khung chat" }));
    expect(screen.queryByRole("heading", { name: "Trợ lý thông tin" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mở trợ lý Medicare" })).toBeInTheDocument();
  });

  it("moves the launcher without opening the panel while dragging", () => {
    render(<ChatbotWidget />);
    const launcher = screen.getByRole("button", { name: "Mở trợ lý Medicare" });

    fireEvent.pointerDown(launcher, { clientX: 120, clientY: 120, pointerId: 1 });
    fireEvent.pointerMove(launcher, { clientX: 220, clientY: 180, pointerId: 1 });
    fireEvent.pointerUp(launcher, { clientX: 220, clientY: 180, pointerId: 1 });
    fireEvent.click(launcher);

    expect(screen.queryByRole("heading", { name: "Trợ lý thông tin" })).not.toBeInTheDocument();
    expect(launcher.parentElement).toHaveStyle({ left: "100px", top: "60px" });
  });

  it("sends only the six most recent conversation messages as history", async () => {
    const send = vi.mocked(sendChatbotMessage);
    render(<ChatbotWidget />);
    fireEvent.click(screen.getByRole("button", { name: "Mở trợ lý Medicare" }));

    const input = screen.getByLabelText("Câu hỏi");
    for (let index = 1; index <= 4; index += 1) {
      send.mockResolvedValueOnce({
        answer: `Trả lời ${index}`,
        source: "gemini",
        policy: { category: "ALLOWED", action: "ALLOW" },
      });
      fireEvent.change(input, { target: { value: `Câu hỏi ${index}` } });
      fireEvent.click(screen.getByRole("button", { name: "Gửi" }));
      expect(await screen.findByText(`Trả lời ${index}`)).toBeInTheDocument();
    }

    expect(send).toHaveBeenNthCalledWith(1, "Câu hỏi 1", []);
    expect(send).toHaveBeenNthCalledWith(4, "Câu hỏi 4", [
      { role: "user", text: "Câu hỏi 1" },
      { role: "assistant", text: "Trả lời 1" },
      { role: "user", text: "Câu hỏi 2" },
      { role: "assistant", text: "Trả lời 2" },
      { role: "user", text: "Câu hỏi 3" },
      { role: "assistant", text: "Trả lời 3" },
    ]);
  });
});
