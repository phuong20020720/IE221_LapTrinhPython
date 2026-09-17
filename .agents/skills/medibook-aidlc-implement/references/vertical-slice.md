# Mẫu vertical slice

## Thứ tự triển khai

```text
Requirement
→ model/constraint
→ service/domain rule
→ serializer + permission + endpoint
→ typed frontend client
→ route/UI behavior
→ automated tests
→ verification evidence
```

Không bắt buộc mỗi slice phải thay đổi mọi lớp. Ghi `N/A` và lý do cho lớp không liên quan.

## Increment record

Tạo `inception/implementation/<increment-slug>.md`:

```markdown
# <Tên increment>

## Sources

- Requirement: `<file>#<heading>`
- Architecture: `<file>#<heading>`
- ADR: `ADR-xxx`

## Acceptance criteria

- [ ] <hành vi quan sát được>

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | ... | ... |
| Backend | ... | ... |
| Frontend | ... | ... |
| Tests | ... | ... |

## Evidence

| Command/check | Result |
|---|---|
| `<lệnh>` | passed/failed/blocked |

## Open items

- Không
```

Giữ record theo outcome, không biến nó thành nhật ký từng thao tác.
