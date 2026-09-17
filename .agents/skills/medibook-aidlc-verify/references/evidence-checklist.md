# Evidence checklist

## Traceability

- Mỗi acceptance criterion liên kết tới code và ít nhất một bằng chứng test/check phù hợp.
- API implementation khớp method, route, status code và permission trong contract.
- Thay đổi kiến trúc khớp ADR đã chấp nhận hoặc có ADR thay thế.

## Backend

- Django system check và migration check đạt.
- Model constraint, transaction và state transition đúng business rule.
- Public/internal endpoint tách quyền rõ ràng.
- Test có happy path, invalid input và forbidden path theo rủi ro.

## Frontend

- Typecheck và production build đạt.
- Public/protected routing hoạt động; guard không được xem là authorization duy nhất.
- Loading, empty, validation và server-error states không làm mất dữ liệu người dùng.

## Security và privacy

- Không có secret hoặc dữ liệu bệnh nhân thật trong source/log/fixture.
- Chatbot không truy cập trực tiếp Patient/Appointment.
- Public lookup không trả quá mức dữ liệu cần thiết.
- JWT/role được backend kiểm tra cho internal API.

## Gate blockers

Xem là blocker khi có build/test bắt buộc thất bại, migration không nhất quán, requirement chính chưa được triển khai, permission bypass, mất dữ liệu hoặc rò rỉ dữ liệu nhạy cảm. Thiếu công cụ ngoài môi trường là `blocked`, không phải `passed`.
