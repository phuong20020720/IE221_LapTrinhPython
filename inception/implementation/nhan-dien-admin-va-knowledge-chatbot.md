# Nhận diện admin và knowledge chatbot Medicare

## Sources

- Requirement: yêu cầu trực tiếp của người dùng ngày 2026-09-19.
- UI: `inception/plainning/đặc-tả-ui-trang-khách-medicare.md#4-nhận-diện-thương-hiệu`
- API: `inception/architecture/api-contract.md#public-endpoints`
- Security: `inception/architecture/security-and-permission-model.md#chatbot-safety`
- ADR: `inception/architecture/adr/003-chatbot-boundary.md`, `ADR-010`

## Acceptance criteria

- [x] Sidebar admin và trang đăng nhập dùng asset logo Medicare hiện tại, không còn logo chữ M/MediBook cũ.
- [x] Tên context nội bộ đổi thành Medicare Admin.
- [x] Knowledge runtime dùng đúng liên hệ demo đã duyệt, chuyên khoa seed, luồng đặt lịch/email và quy tắc không public lookup.
- [x] Knowledge mô tả đúng API public hiện tại và không trao quyền API nội bộ cho chatbot.
- [x] Có test hồi quy cho nhận diện và nội dung knowledge quan trọng.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | N/A | Không thay đổi schema |
| Backend | `backend/apps/chatbot/knowledge/*.md` | Approved knowledge theo chủ đề clinic, booking, specialty và API |
| Backend | `backend/apps/chatbot/tests.py` | Regression cho liên hệ, privacy, API và loại bỏ nội dung cũ |
| Frontend | `frontend/src/app/AdminLayout.tsx`, `frontend/src/pages/LoginPage.tsx`, `frontend/src/styles/index.css` | Nhận diện Medicare trong luồng nội bộ |
| Frontend tests | `frontend/src/app/App.auth.test.tsx` | Xác nhận logo mới ở login/admin |
| Architecture | `inception/architecture/adr/003-chatbot-boundary.md` | Chốt không public lookup và phạm vi API facade chatbot |

## Evidence

| Command/check | Result |
|---|---|
| `docker compose exec -T backend python manage.py check` | passed, 0 issues |
| `docker compose exec -T backend python manage.py makemigrations --check --dry-run` | passed, no changes |
| `docker compose exec -T backend python manage.py test apps.chatbot` | passed, 10/10 |
| `docker compose exec -T backend python manage.py test` | passed, 69/69 |
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test -- --run src/app/App.auth.test.tsx` | passed, 3/3 |
| `npx vitest run --maxWorkers=1` | passed, 36/36 |
| `npm run build` | passed; chỉ còn cảnh báo chunk lớn đã có |
| `docker compose config --quiet` | passed |
| `git diff --check` | passed; chỉ có cảnh báo CRLF của môi trường Windows |
| Browser smoke test `/login`, `/admin` | blocked: browser-client native pipe bridge không khả dụng |

## Verification verdict

`conditional` — các kiểm tra tự động bắt buộc đều đạt; cần xác nhận trực quan logo trên desktop/mobile để đóng gate.

## Open items

- Visual smoke test `/login` và `/admin` trên desktop/mobile.
