# Chatbot nhớ ngữ cảnh hội thoại gần nhất

## Sources

- Requirement: yêu cầu trực tiếp của người dùng ngày 2026-09-20; `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#23-chatbot-ai`
- Architecture: `inception/architecture/api-contract.md#quy-ước-requestresponse`, `inception/architecture/security-and-permission-model.md#chatbot-safety`
- ADR: `inception/architecture/adr/003-chatbot-boundary.md`

## Acceptance criteria

- [x] Widget gửi tối đa 6 tin nhắn gần nhất làm context cho câu hỏi mới.
- [x] Backend validate role, nội dung và giới hạn số lượng history.
- [x] Gemini nhận history theo đúng role `user`/`model` trước câu hỏi hiện tại.
- [x] Lượt user trong history không qua safety bị loại cùng câu trả lời liên quan.
- [x] Lịch sử chỉ tồn tại trong state của SPA, không lưu PostgreSQL hoặc truy cập dữ liệu bệnh nhân/lịch hẹn.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | N/A | Không lưu hội thoại để giữ boundary dữ liệu công khai của ADR-003 |
| Backend | `backend/apps/chatbot/{views,services,gemini}.py` | Validate request, điều phối safety, giới hạn history và tạo Gemini contents |
| Frontend | `frontend/src/features/chatbot/ChatbotWidget.tsx`, `frontend/src/shared/api/chatbot.ts` | Gửi cửa sổ 6 tin nhắn gần nhất bằng typed client |
| Tests | `backend/apps/chatbot/tests.py`, `frontend/src/features/chatbot/ChatbotWidget.test.tsx` | Giới hạn, forwarding, safety filtering và hành vi widget |

## Evidence

| Command/check | Result |
|---|---|
| `.venv/Scripts/python backend/manage.py test apps.chatbot` | passed (13 tests) |
| `npm test -- --run src/features/chatbot/ChatbotWidget.test.tsx` | passed (3 tests) |
| `python manage.py test --keepdb` | passed trong full suite (76 tests) |
| `npm run typecheck && npm run lint && npx vitest run --maxWorkers=1 && npm run build` | passed (38 tests + production build) |

## Open items

- Không
