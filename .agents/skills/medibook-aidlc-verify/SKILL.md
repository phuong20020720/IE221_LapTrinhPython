---
name: medibook-aidlc-verify
description: Xác minh increment MediBook trước approval gate bằng review diff, truy vết requirement/ADR, build, lint, test, migration và kiểm tra security/permission. Dùng khi yêu cầu review, kiểm thử, đánh giá readiness, chứng minh hoàn thành hoặc quyết định pass/fail gate.
---

# Xác minh increment MediBook

Tuân theo yêu cầu trực tiếp của người dùng trước các mặc định trong skill.

## Thu thập bằng chứng

1. Đọc `AGENTS.md`, `inception/aidlc-state.md`, increment record liên quan và `git status`/diff.
2. Đọc source requirement, API contract và ADR được record dẫn chiếu.
3. Đọc [references/evidence-checklist.md](references/evidence-checklist.md).
4. Xác định rõ phạm vi diff thuộc increment; không quy lỗi cho thay đổi không liên quan của người dùng.

## Review

Ưu tiên phát hiện lỗi hành vi, mất dữ liệu, thiếu permission, rò rỉ dữ liệu bệnh nhân, migration nguy hiểm, vi phạm state transition và thiếu test. Dẫn file/dòng cụ thể cho mỗi finding. Không coi khác biệt style đơn thuần là blocker nếu formatter/linter không quy định.

## Chạy kiểm tra

1. Lấy lệnh chuẩn từ manifest, README và cấu hình đã commit; không phát minh lệnh được hỗ trợ.
2. Chạy test hẹp liên quan trước, rồi suite backend/frontend tương ứng.
3. Chạy Django check/migration check, frontend typecheck/lint/build và Compose validation khi áp dụng.
4. Ghi chính xác exit code/kết quả; phân biệt `failed` với `blocked` do thiếu công cụ hoặc service.
5. Không sửa code trong yêu cầu chỉ review. Nếu người dùng yêu cầu verify-and-fix, sửa theo finding và chạy lại kiểm tra bị ảnh hưởng.

## Quyết định gate

- `passed`: acceptance criteria có bằng chứng, kiểm tra bắt buộc đạt và không còn finding nghiêm trọng.
- `conditional`: hành vi cốt lõi đạt nhưng còn kiểm tra bị block hoặc finding không chặn cần theo dõi.
- `failed`: sai requirement/ADR, test/build thất bại, thiếu bảo vệ dữ liệu hoặc có lỗi nghiêm trọng.

Không tự đánh dấu Acceptance Gate. Cập nhật evidence và Verification Gate trong `inception/aidlc-state.md`; người dùng là người phê duyệt acceptance.

## Báo cáo

Trình bày findings theo mức nghiêm trọng trước, sau đó liệt kê lệnh đã chạy, coverage của acceptance criteria, gate verdict và hành động tiếp theo. Nếu không có finding, nói rõ nhưng vẫn nêu phần chưa kiểm chứng.
