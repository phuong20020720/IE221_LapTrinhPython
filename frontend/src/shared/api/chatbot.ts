import { API_BASE_URL } from "./client";


export type ChatbotResponse = {
  answer: string;
  source: "gemini" | "policy";
  policy: {
    category:
      | "ALLOWED"
      | "EMERGENCY"
      | "MEDICAL_DECISION"
      | "PROMPT_INJECTION"
      | "PRIVATE_DATA_REQUEST"
      | "PERSONAL_DATA_INPUT"
      | "OUT_OF_SCOPE";
    action: "ALLOW" | "REDIRECT" | "ESCALATE" | "BLOCK";
  };
};

export type ChatbotHistoryMessage = {
  role: "assistant" | "user";
  text: string;
};


export async function sendChatbotMessage(
  message: string,
  history: ChatbotHistoryMessage[] = [],
  signal?: AbortSignal,
): Promise<ChatbotResponse> {
  const response = await fetch(`${API_BASE_URL}/chatbot/messages/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
    signal,
  });
  if (!response.ok) {
    throw new Error("Chatbot unavailable");
  }
  return response.json() as Promise<ChatbotResponse>;
}
