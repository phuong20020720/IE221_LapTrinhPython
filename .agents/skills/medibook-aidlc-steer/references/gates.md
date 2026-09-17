# Gate và trạng thái AI-DLC của MediBook

## Gate

| Gate | Điều kiện tối thiểu |
|---|---|
| Inception | Phạm vi MVP, actor, business rule và dữ liệu cốt lõi không mâu thuẫn |
| Architecture | Các ADR ảnh hưởng increment ở trạng thái `Chấp nhận`; context/container/API/security đồng bộ |
| Construction | Code, migration, cấu hình và test của increment đã hoàn tất |
| Verification | Lệnh build/lint/test liên quan chạy đạt; requirement và permission có bằng chứng |
| Acceptance | Người dùng xác nhận increment đáp ứng mục tiêu; không tự suy diễn approval |

Nếu một gate không áp dụng, ghi `N/A` kèm lý do; không bỏ qua im lặng.

## State schema

Tạo hoặc cập nhật `inception/aidlc-state.md` theo mẫu:

```markdown
# AI-DLC State

- Profile: MVP
- Increment: <tên ngắn>
- Current stage: <Inception|Architecture|Construction|Verification|Acceptance>
- Gate status: <pending|passed|failed|N/A>
- Last verified: <YYYY-MM-DD hoặc chưa xác minh>

## Scope

<kết quả người dùng cần>

## Sources of truth

- <đường dẫn + heading yêu cầu>
- <ADR liên quan>

## Evidence

- <lệnh/file/kết quả đã kiểm chứng>

## Open decisions

- <quyết định hoặc blocker; ghi `Không` nếu trống>

## Next action

<một hành động cụ thể>
```

Không lưu log hội thoại dài trong state. Dùng Git để lưu lịch sử thay đổi.
