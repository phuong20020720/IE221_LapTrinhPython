# Bảo mật xác nhận lịch và hiển thị bác sĩ Medicare

## Sources

- Requirement: `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#11-bảo-vệ-thông-tin-lịch-hẹn-công-khai`
- UI spec: `inception/plainning/đặc-tả-ui-trang-khách-medicare.md#11-xác-nhận-và-bảo-vệ-thông-tin-lịch`
- Architecture: `inception/architecture/api-contract.md#public-endpoints`
- ADR: `inception/architecture/adr/010-remove-public-appointment-lookup.md`
- ADR: `inception/architecture/adr/009-local-email-with-mailpit.md`

## Acceptance criteria

- [x] Không còn route, CTA hoặc endpoint tra cứu lịch hẹn công khai; endpoint cũ trả `404`.
- [x] Tên bác sĩ trên trang khách, dropdown và tóm tắt đặt lịch ghép học vị với họ tên, không lặp học vị ở dòng riêng.
- [x] Ảnh bác sĩ có tỷ lệ và vị trí crop ổn định ở card và trang chi tiết.
- [x] Email xác nhận có bản HTML mang nhận diện Medicare, đầy đủ thông tin lịch và hướng dẫn khách đọc số điện thoại hoặc mã lịch khi tiếp nhận.
- [x] Email vẫn có bản text dự phòng.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | N/A | Không thay đổi schema; `booking_code` tiếp tục là mã tham chiếu. |
| Backend | `apps/appointments/{emails,serializers,services,views,urls}.py`, template email, `apps/doctors/models.py` | Gỡ public lookup, ghép tên hiển thị và gửi multipart email. |
| Frontend | `app/{App,CustomerLayout}.tsx`, các trang Home/Doctors/DoctorDetail/Booking, `doctorDisplayName.ts`, `customer.css` | Gỡ luồng tra cứu, chuẩn hóa tên/ảnh bác sĩ và CTA sau đặt lịch. |
| Tests | appointment API tests, public page tests, `doctorDisplayName.test.ts` | Chặn hồi quy endpoint, xác minh HTML email và hành vi UI. |

## Evidence

| Command/check | Result |
|---|---|
| `docker compose exec -T backend python manage.py check` | passed |
| `docker compose exec -T backend python manage.py makemigrations --check --dry-run` | passed — no changes |
| `docker compose exec -T backend python manage.py test` | passed — 67 tests |
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test` | passed — 36 tests |
| `npx vitest run --maxWorkers=1` | passed — 36 tests (retry tuần tự sau một lượt song song chạm timeout môi trường) |
| `npm run build` | passed |
| `docker compose config --quiet` | passed |
| `git diff --check` | passed (chỉ có cảnh báo line ending CRLF) |
| Runtime lookup reference scan | passed — không còn route/endpoint lookup trong runtime code |
| Browser visual QA | blocked — browser bridge không khả dụng trong môi trường hiện tại |

## Open items

- Người dùng kiểm tra trực quan ảnh bác sĩ và email HTML trong Mailpit tại `http://localhost:8025`.
