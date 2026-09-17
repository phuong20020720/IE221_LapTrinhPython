# Image assets

Lưu ảnh thuộc source frontend tại đây và import trực tiếp từ component, ví dụ:

```tsx
import doctorPhoto from "../assets/images/doctor-photo.webp";

<img src={doctorPhoto} alt="Bác sĩ ..." />;
```

Ưu tiên `webp`/`avif` cho ảnh chụp và `svg` cho minh họa vector. Dùng tên file `kebab-case`, luôn cung cấp `alt` có ý nghĩa và không lưu ảnh chứa dữ liệu bệnh nhân thật.

