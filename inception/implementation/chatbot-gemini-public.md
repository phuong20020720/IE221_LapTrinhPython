# Chatbot Gemini công khai

## Sources

- Requirement: `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#2.3-chatbot-ai`, `#15-kịch-bản-5-chatbot-ai`
- Architecture: `inception/architecture/api-contract.md#public-endpoints`, `inception/architecture/security-and-permission-model.md#chatbot-safety`
- ADR: `inception/architecture/adr/003-chatbot-boundary.md`

## Acceptance criteria

- [x] Khách hàng mở chatbot trên trang public mà không cần đăng nhập.
- [x] Câu hỏi hợp lệ được backend gửi tới Gemini cùng knowledge public đã duyệt.
- [x] API key chỉ nằm ở backend qua `GEMINI_API_KEY`.
- [x] Câu hỏi cấp cứu/chẩn đoán/kê đơn được xử lý an toàn trước khi gọi model.
- [x] Chatbot không đọc trực tiếp bảng bệnh nhân, lịch hẹn hoặc dữ liệu nội bộ.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Knowledge | `backend/apps/chatbot/knowledge/clinic.md` | Nội dung public được duyệt và version-control |
| Backend | `backend/apps/chatbot/{views,gemini,knowledge,safety,urls}.py` | API public, prompt grounding, Gemini adapter và safety guard |
| Frontend | `frontend/src/features/chatbot/ChatbotWidget.tsx`, `frontend/src/shared/api/chatbot.ts` | Widget và typed API client |
| Tests | `backend/apps/chatbot/tests.py` | Public access, safety guard, validation |

## Evidence

| Command/check | Result |
|---|---|
| `docker compose run --rm backend python manage.py test apps.chatbot` | passed (3 tests) |
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test -- --run` | passed (1 test) |
| `npm run build` | passed |
| Live `POST /api/v1/chatbot/messages/` với Gemini | passed (`source: gemini`) |

## Open items

- Chưa có màn hình admin để duyệt/sửa knowledge; MVP dùng Markdown version-control theo ADR-003.
