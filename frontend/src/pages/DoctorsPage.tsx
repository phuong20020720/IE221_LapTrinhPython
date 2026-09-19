import { ArrowRight, CalendarDays, RotateCcw, Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { listDoctors, type Doctor } from "../shared/api/doctors";
import { listPublicSpecialties, type Specialty } from "../shared/api/specialties";
import { getDoctorDisplayName } from "../shared/lib/doctorDisplayName";
import { getDoctorImage, handleDoctorImageError } from "../shared/lib/doctorImage";
import { PaginationControls } from "../shared/ui/PaginationControls";

type LoadState = "loading" | "success" | "error";

function validSpecialtyId(value: string | null): string {
  if (!value) return "";
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? String(id) : "";
}

function validPage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function DoctorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const selectedSpecialty = validSpecialtyId(searchParams.get("specialty_id"));
  const page = validPage(searchParams.get("page"));
  const [searchDraft, setSearchDraft] = useState(query);
  const [specialtyDraft, setSpecialtyDraft] = useState(selectedSpecialty);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctorState, setDoctorState] = useState<LoadState>("loading");
  const [specialtyState, setSpecialtyState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setSearchDraft(query);
    setSpecialtyDraft(selectedSpecialty);
  }, [query, selectedSpecialty]);

  useEffect(() => {
    const controller = new AbortController();
    setSpecialtyState("loading");
    listPublicSpecialties({ pageSize: 100 }, controller.signal)
      .then((data) => {
        setSpecialties(data.results);
        setSpecialtyState("success");
      })
      .catch(() => {
        if (!controller.signal.aborted) setSpecialtyState("error");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setDoctorState("loading");
    setError("");
    listDoctors(
      {
        search: query || undefined,
        specialtyId: selectedSpecialty ? Number(selectedSpecialty) : undefined,
        page,
      },
      controller.signal,
    )
      .then((data) => {
        setDoctors(data.results);
        setTotalCount(data.count);
        setDoctorState("success");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Không tải được danh sách bác sĩ.");
        setDoctorState("error");
      });
    return () => controller.abort();
  }, [page, query, reload, selectedSpecialty]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (searchDraft.trim()) next.set("q", searchDraft.trim());
    if (specialtyDraft) next.set("specialty_id", specialtyDraft);
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchDraft("");
    setSpecialtyDraft("");
    setSearchParams(new URLSearchParams());
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete("page");
    else next.set("page", String(nextPage));
    setSearchParams(next);
  }

  return (
    <div className="customer-container customer-page doctor-page">
      <nav className="customer-breadcrumb" aria-label="Đường dẫn trang"><Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><span>Đội ngũ bác sĩ</span></nav>
      <header className="doctor-page__header">
        <p className="customer-eyebrow">ĐỘI NGŨ BÁC SĨ</p>
        <h1>Đội ngũ bác sĩ Medicare</h1>
        <p>Tìm kiếm bác sĩ theo tên hoặc lựa chọn chuyên khoa phù hợp với nhu cầu khám.</p>
      </header>

      <form className="doctor-filter" onSubmit={onSearch}>
        <div className="doctor-filter__field">
          <label htmlFor="doctor-search">Tên bác sĩ</label>
          <div className="doctor-filter__input"><Search aria-hidden="true" /><input id="doctor-search" placeholder="Nhập tên bác sĩ..." value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} /></div>
        </div>
        <div className="doctor-filter__field">
          <label htmlFor="doctor-specialty">Chuyên khoa</label>
          <select id="doctor-specialty" value={specialtyDraft} disabled={specialtyState === "loading"} onChange={(event) => setSpecialtyDraft(event.target.value)}>
            <option value="">{specialtyState === "loading" ? "Đang tải chuyên khoa..." : "Tất cả chuyên khoa"}</option>
            {specialties.map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}
          </select>
          {specialtyState === "error" ? <small role="status">Không tải được bộ lọc chuyên khoa.</small> : null}
        </div>
        <div className="doctor-filter__actions">
          <button type="submit"><Search aria-hidden="true" /> Tìm kiếm</button>
          <button type="button" className="button-secondary" onClick={clearFilters}><RotateCcw aria-hidden="true" /> Xóa bộ lọc</button>
        </div>
      </form>

      <div className="doctor-results-heading" aria-live="polite">
        <h2>Kết quả tìm kiếm</h2>
        {doctorState === "success" ? <span>{totalCount} bác sĩ</span> : null}
      </div>

      {doctorState === "loading" ? <div className="doctor-grid" aria-label="Đang tải danh sách bác sĩ">{Array.from({ length: 6 }, (_, index) => <div className="doctor-card-skeleton" key={index} />)}</div> : null}

      {doctorState === "error" ? <div className="doctor-empty" role="alert"><p>{error}</p><button className="customer-button customer-button--outline" type="button" onClick={() => setReload((value) => value + 1)}>Thử lại</button></div> : null}

      {doctorState === "success" && doctors.length === 0 ? <div className="doctor-empty"><Search aria-hidden="true" /><h2>Không tìm thấy bác sĩ phù hợp</h2><p>Hãy thử tên khác hoặc xóa bộ lọc chuyên khoa.</p><button className="customer-button customer-button--outline" type="button" onClick={clearFilters}>Xóa bộ lọc</button></div> : null}

      {doctorState === "success" && doctors.length > 0 ? (
        <>
          <div className="doctor-grid">
            {doctors.map((doctor) => (
            <article className="doctor-card" key={doctor.id}>
              <img className="doctor-card__image" src={getDoctorImage(doctor.profile_image_url)} onError={handleDoctorImageError} alt={getDoctorDisplayName(doctor)} />
              <div className="doctor-card__content">
                <p className="doctor-card__specialty">{doctor.specialty.name}</p>
                <h2>{getDoctorDisplayName(doctor)}</h2>
                {doctor.position ? <p>{doctor.position}</p> : null}
                {doctor.years_of_experience !== null ? <p>{doctor.years_of_experience} năm kinh nghiệm</p> : null}
                <div className="doctor-card__actions"><Link className="doctor-card__link" to={`/doctors/${doctor.id}`}>Xem hồ sơ <ArrowRight aria-hidden="true" /></Link><Link className="doctor-card__booking" to={`/booking?doctor_id=${doctor.id}`}><CalendarDays aria-hidden="true" /> Đặt lịch</Link></div>
              </div>
            </article>
            ))}
          </div>
          <PaginationControls page={page} totalCount={totalCount} onPageChange={changePage} />
        </>
      ) : null}
    </div>
  );
}
