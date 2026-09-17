import { Outlet } from "react-router-dom";

import { ChatbotWidget } from "../features/chatbot/ChatbotWidget";

export function CustomerLayout() {
  return (
    <>
      <Outlet />
      <ChatbotWidget />
    </>
  );
}
