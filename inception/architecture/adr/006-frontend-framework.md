# ADR-006: React, Vite và TypeScript cho SPA

## Trạng thái

Chấp nhận

## Bối cảnh

Frontend được xác định là SPA thuần, render phía client và giao tiếp với Django qua REST API. MVP chưa có yêu cầu SEO nâng cao, SSR hoặc React Server Components.

## Quyết định

Dùng React, TypeScript, Vite và React Router. Dùng Vitest cho unit/component test; thư viện UI và state/data-fetching sẽ được chọn khi scaffold theo nhu cầu thực tế.

## Lý do

- Vite cung cấp dev server và build đơn giản cho SPA.
- React Router hỗ trợ rõ public/protected routes.
- TypeScript giúp đồng bộ kiểu dữ liệu với API contract.
- Tránh dùng các tính năng server-side không cần thiết của Next.js.

## Hệ quả

Frontend không tự cung cấp SSR, backend routes hay server actions. Deep link phải được web server fallback về `index.html`. Nếu xuất hiện yêu cầu SEO/SSR thực tế, quyết định framework phải được đánh giá lại bằng ADR mới.
