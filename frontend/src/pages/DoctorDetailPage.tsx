import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  getDoctor,
  type Doctor,
} from "../shared/api/doctors";
import { getDoctorImage } from "../shared/lib/doctorImage";

export function DoctorDetailPage() {
  const { doctorId } = useParams();

  const [doctor, setDoctor] =
    useState<Doctor | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const id = Number(doctorId);

    if (!Number.isInteger(id) || id < 1) {
      setError("Mã bác sĩ không hợp lệ.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    getDoctor(id, controller.signal)
      .then(setDoctor)
      .catch((err: unknown) => {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Không tải được thông tin bác sĩ.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [doctorId]);

  if (loading) {
    return (
      <main className="page-shell">
        <p className="doctor-empty">
          Đang tải thông tin bác sĩ...
        </p>
      </main>
    );
  }

  if (error || !doctor) {
    return (
      <main className="page-shell">
        <div className="doctor-empty">
          <p>
            {error ||
              "Không tìm thấy bác sĩ."}
          </p>

          <Link to="/doctors">
            Quay lại danh sách bác sĩ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          MediBook
        </Link>

        <nav aria-label="Điều hướng chính">
          <Link to="/">Trang chủ</Link>
          <Link to="/doctors">Bác sĩ</Link>
          <Link to="/booking">Đặt lịch</Link>
        </nav>
      </header>

      <section className="doctor-detail">
        <Link
          className="doctor-detail__back"
          to="/doctors"
        >
          ← Danh sách bác sĩ
        </Link>

        <div className="doctor-detail__card">
          <img
            className="doctor-detail__image"
            src={getDoctorImage(doctor.image)}
            alt={`Bác sĩ ${doctor.full_name}`}
          />

          <div className="doctor-detail__content">
            <p className="eyebrow">
              THÔNG TIN BÁC SĨ
            </p>

            <h1>{doctor.full_name}</h1>

            <p className="doctor-detail__qualification">
              {doctor.qualification ||
                "Chưa cập nhật học vị"}
            </p>

            <p>
              <strong>Kinh nghiệm:</strong>{" "}
              {doctor.experience_years} năm
            </p>

            <div>
              <strong>Chuyên khoa:</strong>

              <div className="doctor-specialties">
                {doctor.expertises.map(
                  (expertise) => (
                    <span
                      className="doctor-specialty-chip"
                      key={expertise.id}
                    >
                      {expertise.specialty.name}
                      {expertise.is_primary
                        ? " • Chính"
                        : ""}
                    </span>
                  ),
                )}
              </div>
            </div>

            {doctor.bio ? (
              <div className="doctor-detail__bio">
                <h2>Giới thiệu</h2>
                <p>{doctor.bio}</p>
              </div>
            ) : null}

            <Link
              className="doctor-book-button"
              to={`/booking?doctor_id=${doctor.id}`}
            >
              Đặt lịch với bác sĩ
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}