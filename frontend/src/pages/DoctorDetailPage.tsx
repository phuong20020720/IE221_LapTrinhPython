import { ArrowLeft, CalendarDays, CheckCircle2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getDoctor, type Doctor } from "../shared/api/doctors";
import { getDoctorDisplayName } from "../shared/lib/doctorDisplayName";
import { getDoctorImage, handleDoctorImageError } from "../shared/lib/doctorImage";

type LoadState = "loading" | "success" | "error" | "invalid";

export function DoctorDetailPage() {
  const { doctorId } = useParams();
  const id = Number(doctorId);
  const validId = Number.isInteger(id) && id > 0;
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [state, setState] = useState<LoadState>(validId ? "loading" : "invalid");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!validId) {
      setState("invalid");
      return;
    }
    const controller = new AbortController();
    setState("loading");
    setError("");
    getDoctor(id, controller.signal)
      .then((data) => {
        setDoctor(data);
        setState("success");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Không tải được thông tin bác sĩ.");
        setState("error");
      });
    return () => controller.abort();
  }, [id, reload, validId]);

  if (state === "loading") {
    return <div className="customer-container customer-page"><div className="doctor-detail-skeleton" aria-label="Đang tải thông tin bác sĩ"><span /><div /></div></div>;
  }

  if (state === "invalid" || state === "error" || !doctor) {
    return (
      <div className="customer-container customer-page">
        <div className="doctor-empty" role={state === "error" ? "alert" : undefined}>
          <h1>{state === "invalid" ? "Mã bác sĩ không hợp lệ" : "Chưa thể tải hồ sơ bác sĩ"}</h1>
          {state === "error" ? <p>{error}</p> : null}
          <div className="doctor-empty__actions">{state === "error" ? <button className="customer-button customer-button--outline" type="button" onClick={() => setReload((value) => value + 1)}><RotateCcw aria-hidden="true" /> Thử lại</button> : null}<Link className="customer-text-link" to="/doctors"><ArrowLeft aria-hidden="true" /> Quay lại danh sách bác sĩ</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-container customer-page doctor-detail">
      <nav className="customer-breadcrumb" aria-label="Đường dẫn trang"><Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><Link to="/doctors">Bác sĩ</Link><span aria-hidden="true">/</span><span>{getDoctorDisplayName(doctor)}</span></nav>
      <Link className="doctor-detail__back" to="/doctors"><ArrowLeft aria-hidden="true" /> Danh sách bác sĩ</Link>

      <section className="doctor-detail__card" aria-labelledby="doctor-name">
        <img className="doctor-detail__image" src={getDoctorImage(doctor.profile_image_url)} onError={handleDoctorImageError} alt={getDoctorDisplayName(doctor)} />
        <div className="doctor-detail__content">
          <p className="customer-eyebrow">{doctor.specialty.name}</p>
          <h1 id="doctor-name">{getDoctorDisplayName(doctor)}</h1>
          {doctor.position ? <p className="doctor-detail__position">{doctor.position}</p> : null}
          <dl className="doctor-detail__facts"><div><dt>Chuyên khoa</dt><dd>{doctor.specialty.name}</dd></div>{doctor.years_of_experience !== null ? <div><dt>Kinh nghiệm</dt><dd>{doctor.years_of_experience} năm</dd></div> : null}</dl>
          <Link className="doctor-book-button" to={`/booking?doctor_id=${doctor.id}`}><CalendarDays aria-hidden="true" /> Đặt lịch với bác sĩ</Link>
        </div>
      </section>

      {(doctor.professional_description || doctor.expertises.length > 0) ? (
        <div className="doctor-detail__sections">
          {doctor.professional_description ? <section><p className="customer-eyebrow">GIỚI THIỆU</p><h2>Kinh nghiệm chuyên môn</h2><p>{doctor.professional_description}</p></section> : null}
          {doctor.expertises.length > 0 ? <section><p className="customer-eyebrow">LĨNH VỰC CHUYÊN SÂU</p><h2>Thế mạnh chuyên môn</h2><ul>{doctor.expertises.map((expertise) => <li key={expertise.id}><CheckCircle2 aria-hidden="true" /><div><strong>{expertise.expertise_name}</strong>{expertise.description ? <p>{expertise.description}</p> : null}</div></li>)}</ul></section> : null}
        </div>
      ) : null}
    </div>
  );
}
