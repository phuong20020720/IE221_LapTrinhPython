# ADR-005: Một SPA cho public và admin

## Trạng thái

Chấp nhận

## Bối cảnh

MediBook có giao diện công khai cho Patient và giao diện nội bộ cho Employee/Admin, nhưng đều dùng chung domain, API client và hệ thống thiết kế. MVP không cần hai frontend triển khai độc lập.

## Quyết định

Dùng một frontend SPA. Public routes gồm `/`, `/doctors`, `/booking`, `/lookup`; khu vực nội bộ nằm dưới `/admin/*` và được bảo vệ bằng authentication guard.

## Lý do

- Một codebase, một pipeline build và một deployment artifact.
- Tái sử dụng component, type và API client.
- Phù hợp phạm vi đồ án và nhóm nhỏ.

## Hệ quả

Public và admin vẫn phải tách theo feature/module để tránh phụ thuộc lộn xộn. Route guard chỉ kiểm soát điều hướng và trải nghiệm; backend luôn phải xác thực token và kiểm tra role. Có thể tách hai frontend sau này bằng ADR mới nếu vòng đời triển khai hoặc đội sở hữu khác nhau.
