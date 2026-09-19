# Backend Doctors và Specialties

## Sources

- Requirement: `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#7-quy-tắc-bác-sĩ-và-chuyên-khoa`
- Database: `inception/plainning/thiết-kế-database-và-erd.md#42-specialties`, `#43-doctors`, `#44-doctor_expertise`
- Architecture: `inception/architecture/api-contract.md`, `inception/architecture/security-and-permission-model.md`
- ADR: `ADR-004`, `ADR-007`, `ADR-008`

## Acceptance criteria

- [x] Public xem/tìm/lọc chuyên khoa và bác sĩ đang hoạt động qua API riêng.
- [x] Admin CRUD chuyên khoa và bác sĩ qua `/api/v1/admin/`.
- [x] Employee và anonymous bị từ chối khi gọi API quản trị.
- [x] Một bác sĩ thuộc đúng một chuyên khoa đang hoạt động và có nhiều lĩnh vực chuyên sâu.
- [x] Ảnh đại diện nhận JPG/PNG/WEBP tối đa 5 MB và trả URL media.
- [x] DELETE là soft delete; không ngừng chuyên khoa còn bác sĩ hoạt động.
- [x] Model constraint, migration và backend tests đạt.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | `specialties/models.py`, `doctors/models.py`, migrations | Entity, quan hệ, constraint và index |
| Domain | `specialties/services.py`, `doctors/services.py` | Validation, soft delete, expertises atomic và vòng đời ảnh |
| API | serializers, views, public/admin URLs, `config/urls.py` | Public read và Admin CRUD tách biệt |
| Media | `config/settings.py`, `compose.yaml`, `requirements.txt` | ImageField, Pillow và media volume local |
| Frontend | N/A | Người dùng yêu cầu hoàn thành backend trước; frontend sửa sau |
| Tests | `specialties/tests`, `doctors/tests` | Permission, validation, filtering, upload và soft delete |

## Evidence

| Command/check | Result |
|---|---|
| `python manage.py check` | passed |
| `python manage.py makemigrations --check --dry-run` | passed; no changes detected |
| `python manage.py test apps.specialties apps.doctors` | passed; 21 tests |
| `python manage.py test` trên PostgreSQL | passed; 51 tests |
| `python manage.py migrate --noinput` | passed; áp dụng `specialties.0001`, `doctors.0001` |
| `docker compose config --quiet` | passed |
| `git diff --check` | passed |

## Open items

- Production cần chọn object storage/reverse proxy; Docker media volume chỉ là phương án local/MVP.
