import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  listDoctors,
  listSpecialties,
  type Doctor,
  type Specialty,
} from "../shared/api/doctors";
import { getDoctorImage } from "../shared/lib/doctorImage";

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  const [search, setSearch] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDoctors() {
    setLoading(true);
    setError("");

    try {
      const data = await listDoctors({
        search,
        specialtyId: specialtyId
          ? Number(specialtyId)
          : undefined,
      });

      setDoctors(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không tải được danh sách bác sĩ.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      listDoctors({}, controller.signal),
      listSpecialties(controller.signal),
    ])
      .then(([doctorData, specialtyData]) => {
        setDoctors(doctorData);
        setSpecialties(specialtyData);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Không tải được dữ liệu bác sĩ.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    void loadDoctors();
  }

  function clearFilters() {
    setSearch("");
    setSpecialtyId("");

    setLoading(true);
    setError("");

    listDoctors()
      .then(setDoctors)
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "Không tải được danh sách bác sĩ.",
        );
      })
      .finally(() => setLoading(false));
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
          <Link to="/lookup">Tra cứu</Link>
          <Link to="/login">Nội bộ</Link>
        </nav>
      </header>

      <section className="doctor-page">
        <header className="doctor-page__header">
          <p className="eyebrow">ĐỘI NGŨ BÁC SĨ</p>

          <h1>Tìm bác sĩ phù hợp</h1>

          <p>
            Tìm kiếm bác sĩ theo tên hoặc lựa chọn chuyên khoa
            phù hợp với nhu cầu khám.
          </p>
        </header>

        <form
          className="doctor-filter"
          onSubmit={onSearch}
        >
          <input
            aria-label="Tìm bác sĩ"
            placeholder="Nhập tên bác sĩ..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            aria-label="Chuyên khoa"
            value={specialtyId}
            onChange={(event) =>
              setSpecialtyId(event.target.value)
            }
          >
            <option value="">
              Tất cả chuyên khoa
            </option>

            {specialties.map((specialty) => (
              <option
                key={specialty.id}
                value={specialty.id}
              >
                {specialty.name}
              </option>
            ))}
          </select>

          <button type="submit">
            Tìm kiếm
          </button>

          <button
            type="button"
            className="button-secondary"
            onClick={clearFilters}
          >
            Xóa bộ lọc
          </button>
        </form>

        {error ? (
          <p className="form-error">{error}</p>
        ) : null}

        {loading ? (
          <p className="doctor-empty">
            Đang tải danh sách bác sĩ...
          </p>
        ) : null}

        {!loading && doctors.length === 0 ? (
          <p className="doctor-empty">
            Không tìm thấy bác sĩ phù hợp.
          </p>
        ) : null}

        {!loading && doctors.length > 0 ? (
          <div className="doctor-grid">
            {doctors.map((doctor) => {
              const primaryExpertise =
                doctor.expertises.find(
                  (item) => item.is_primary,
                );

              return (
                <article
                  className="doctor-card"
                  key={doctor.id}
                >
                  <img
                    className="doctor-card__image"
                    src={getDoctorImage(doctor.image)}
                    alt={`Bác sĩ ${doctor.full_name}`}
                  />

                  <div className="doctor-card__content">
                    <p className="doctor-card__specialty">
                      {primaryExpertise
                        ?.specialty.name ??
                        "Chưa cập nhật chuyên khoa"}
                    </p>

                    <h2>{doctor.full_name}</h2>

                    <p>
                      {doctor.qualification ||
                        "Chưa cập nhật học vị"}
                    </p>

                    <p>
                      {doctor.experience_years} năm
                      kinh nghiệm
                    </p>

                    <Link
                      className="doctor-card__link"
                      to={`/doctors/${doctor.id}`}
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}