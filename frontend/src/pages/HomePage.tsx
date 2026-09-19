import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  HeartPulse,
  MessageCircleMore,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import clinicExterior from "../assets/images/medicare-clinic-exterior.jpg";
import consultationImage from "../assets/images/medicare-consultation.jpg";
import examRoomImage from "../assets/images/medicare-exam-room.jpg";
import receptionImage from "../assets/images/medicare-reception.jpg";
import { listDoctors, type Doctor } from "../shared/api/doctors";
import { listPublicSpecialties, type Specialty } from "../shared/api/specialties";
import { getDoctorDisplayName } from "../shared/lib/doctorDisplayName";
import { getDoctorImage, handleDoctorImageError } from "../shared/lib/doctorImage";

type LoadState = "loading" | "success" | "error";

const quickActions = [
  { title: "Đặt lịch khám", description: "Chọn chuyên khoa, bác sĩ và buổi khám phù hợp.", to: "/booking", icon: CalendarDays },
  { title: "Tìm bác sĩ", description: "Xem đội ngũ và thông tin chuyên môn.", to: "/doctors", icon: Search },
];

const bookingSteps = [
  { title: "Chọn chuyên khoa", description: "Chọn chuyên khoa hoặc bác sĩ phù hợp.", icon: Stethoscope },
  { title: "Chọn lịch khám", description: "Chọn ngày cùng buổi sáng hoặc chiều.", icon: CalendarDays },
  { title: "Nhập thông tin", description: "Cung cấp liên hệ và lý do cần khám.", icon: ClipboardCheck },
  { title: "Nhận email xác nhận", description: "Kiểm tra thông tin lịch và hướng dẫn đến khám.", icon: UserRoundCheck },
];

const newsItems = [
  {
    category: "Hướng dẫn",
    title: "Hướng dẫn đặt lịch khám tại Medicare",
    summary: "Các bước chọn chuyên khoa, ngày và buổi khám để hoàn tất lịch hẹn trực tuyến nhanh chóng.",
    date: "15/09/2026",
    image: receptionImage,
    alt: "Khu vực tiếp nhận lịch khám tại Medicare",
  },
  {
    category: "Sức khỏe",
    title: "Vì sao nên khám sức khỏe định kỳ?",
    summary: "Khám định kỳ giúp bạn theo dõi những thay đổi của cơ thể và chủ động trao đổi với bác sĩ.",
    date: "10/09/2026",
    image: consultationImage,
    alt: "Bác sĩ tư vấn sức khỏe cho khách hàng",
  },
  {
    category: "Chuẩn bị đi khám",
    title: "Những điều cần chuẩn bị trước khi đến phòng khám",
    summary: "Ghi lại triệu chứng, thuốc đang sử dụng và đến sớm để quá trình tiếp nhận thuận tiện hơn.",
    date: "05/09/2026",
    image: examRoomImage,
    alt: "Không gian phòng khám được chuẩn bị sẵn sàng",
  },
];

export function HomePage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialtyState, setSpecialtyState] = useState<LoadState>("loading");
  const [doctorState, setDoctorState] = useState<LoadState>("loading");
  const [specialtyReload, setSpecialtyReload] = useState(0);
  const [doctorReload, setDoctorReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setSpecialtyState("loading");
    listPublicSpecialties({ pageSize: 6 }, controller.signal)
      .then((result) => {
        setSpecialties(result.results);
        setSpecialtyState("success");
      })
      .catch(() => {
        if (!controller.signal.aborted) setSpecialtyState("error");
      });
    return () => controller.abort();
  }, [specialtyReload]);

  useEffect(() => {
    const controller = new AbortController();
    setDoctorState("loading");
    listDoctors({ pageSize: 4 }, controller.signal)
      .then((result) => {
        setDoctors(result.results);
        setDoctorState("success");
      })
      .catch(() => {
        if (!controller.signal.aborted) setDoctorState("error");
      });
    return () => controller.abort();
  }, [doctorReload]);

  function openChatbot() {
    document.getElementById("chatbot-launcher")?.click();
  }

  return (
    <>
      <section className="customer-hero">
        <div className="customer-container customer-hero__grid">
          <div className="customer-hero__content">
            <span className="customer-kicker"><ShieldCheck aria-hidden="true" /> Đặt lịch không cần đăng nhập</span>
            <h1>Chăm sóc sức khỏe tận tâm, đặt lịch thật thuận tiện</h1>
            <p>Medicare kết nối bạn với đội ngũ bác sĩ theo chuyên khoa và hỗ trợ đặt lịch khám theo ngày, buổi sáng hoặc chiều.</p>
            <div className="customer-hero__actions">
              <Link className="customer-button" to="/booking">Đặt lịch khám <ArrowRight aria-hidden="true" /></Link>
              <Link className="customer-button customer-button--outline" to="/doctors">Tìm bác sĩ</Link>
            </div>
            <div className="customer-hero__meta" aria-label="Thông tin nhanh">
              <span><strong>10+</strong> bác sĩ và chuyên gia</span>
              <span><strong>8+</strong> chuyên khoa</span>
              <span><strong>24/7</strong> tiếp nhận đặt lịch online</span>
            </div>
          </div>
          <div className="customer-hero__visual">
            <img src={clinicExterior} alt="Mặt tiền Phòng khám Medicare hiện đại" />
            <div className="customer-hero__floating-card"><CalendarDays aria-hidden="true" /><div><strong>Đặt lịch nhanh</strong><span>Chỉ vài bước đơn giản</span></div></div>
          </div>
        </div>
      </section>

      <section className="customer-section customer-section--quick" aria-labelledby="quick-actions-title">
        <div className="customer-container">
          <h2 className="sr-only" id="quick-actions-title">Thao tác nhanh</h2>
          <div className="customer-quick-grid">
            {quickActions.map(({ title, description, to, icon: Icon }) => (
              <Link className="customer-quick-card" key={title} to={to}><span><Icon aria-hidden="true" /></span><div><strong>{title}</strong><small>{description}</small></div><ArrowRight aria-hidden="true" /></Link>
            ))}
            <button className="customer-quick-card" type="button" onClick={openChatbot}><span><MessageCircleMore aria-hidden="true" /></span><div><strong>Hỏi trợ lý Medicare</strong><small>Nhận hướng dẫn chung về quy trình khám.</small></div><ArrowRight aria-hidden="true" /></button>
          </div>
        </div>
      </section>

      <section className="customer-section" id="gioi-thieu">
        <div className="customer-container customer-about">
          <div className="customer-about__visual"><img src={receptionImage} alt="Sảnh tiếp nhận của Phòng khám Medicare" /><span>Không gian thân thiện và thuận tiện</span></div>
          <div className="customer-about__content">
            <p className="customer-eyebrow">VỀ MEDICARE</p>
            <h2>Phòng khám hiện đại, đồng hành cùng sức khỏe của bạn</h2>
            <p>Medicare là phòng khám đa khoa demo, được xây dựng để minh họa quy trình tìm bác sĩ, đặt lịch và nhận xác nhận qua email trên một nền tảng thống nhất. Chúng tôi hướng đến trải nghiệm rõ ràng, thân thiện và tôn trọng quyền riêng tư.</p>
            <Link className="customer-text-link" to="/doctors">Khám phá đội ngũ bác sĩ <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="customer-section customer-section--tinted" id="chuyen-khoa" aria-labelledby="specialties-title">
        <div className="customer-container">
          <div className="customer-section-heading"><div><p className="customer-eyebrow">CHUYÊN KHOA</p><h2 id="specialties-title">Chăm sóc phù hợp với từng nhu cầu</h2></div><p>Khám phá các chuyên khoa đang tiếp nhận lịch tại Medicare.</p></div>
          {specialtyState === "loading" ? <div className="customer-card-grid" aria-label="Đang tải chuyên khoa">{Array.from({ length: 6 }, (_, index) => <div className="customer-skeleton-card" key={index} />)}</div> : null}
          {specialtyState === "error" ? <div className="customer-inline-state" role="alert"><p>Chưa thể tải danh sách chuyên khoa.</p><button className="customer-button customer-button--outline" type="button" onClick={() => setSpecialtyReload((value) => value + 1)}>Thử lại</button></div> : null}
          {specialtyState === "success" && specialties.length === 0 ? <div className="customer-inline-state"><p>Chưa có chuyên khoa đang hoạt động.</p></div> : null}
          {specialtyState === "success" && specialties.length > 0 ? (
            <div className="customer-card-grid">
              {specialties.map((specialty) => <article className="customer-specialty-card" key={specialty.id}><span><HeartPulse aria-hidden="true" /></span><h3>{specialty.name}</h3><p>{specialty.description || "Tư vấn và thăm khám theo nhu cầu sức khỏe của bạn."}</p><Link className="customer-text-link" to={`/doctors?specialty_id=${specialty.id}`}>Xem bác sĩ <ArrowRight aria-hidden="true" /></Link></article>)}
            </div>
          ) : null}
        </div>
      </section>

      <section className="customer-section" aria-labelledby="featured-doctors-title">
        <div className="customer-container">
          <div className="customer-section-heading"><div><p className="customer-eyebrow">ĐỘI NGŨ CHUYÊN MÔN</p><h2 id="featured-doctors-title">Bác sĩ nổi bật</h2></div><Link className="customer-text-link" to="/doctors">Xem tất cả bác sĩ <ArrowRight aria-hidden="true" /></Link></div>
          {doctorState === "loading" ? <div className="customer-doctor-grid" aria-label="Đang tải bác sĩ">{Array.from({ length: 4 }, (_, index) => <div className="customer-skeleton-card customer-skeleton-card--doctor" key={index} />)}</div> : null}
          {doctorState === "error" ? <div className="customer-inline-state" role="alert"><p>Chưa thể tải đội ngũ bác sĩ.</p><button className="customer-button customer-button--outline" type="button" onClick={() => setDoctorReload((value) => value + 1)}>Thử lại</button></div> : null}
          {doctorState === "success" && doctors.length === 0 ? <div className="customer-inline-state"><p>Chưa có bác sĩ đang hoạt động.</p></div> : null}
          {doctorState === "success" && doctors.length > 0 ? (
            <div className="customer-doctor-grid">
              {doctors.map((doctor) => <article className="customer-featured-doctor" key={doctor.id}><img src={getDoctorImage(doctor.profile_image_url)} onError={handleDoctorImageError} alt={getDoctorDisplayName(doctor)} /><div><p>{doctor.specialty.name}</p><h3>{getDoctorDisplayName(doctor)}</h3><span>{doctor.position || "Bác sĩ chuyên khoa"}</span><small>{doctor.years_of_experience === null ? "Thông tin kinh nghiệm đang cập nhật" : `${doctor.years_of_experience} năm kinh nghiệm`}</small><div className="customer-featured-doctor__actions"><Link className="customer-text-link" to={`/doctors/${doctor.id}`}>Xem hồ sơ</Link><Link className="customer-button customer-button--compact" to={`/booking?doctor_id=${doctor.id}`}>Đặt lịch</Link></div></div></article>)}
            </div>
          ) : null}
        </div>
      </section>

      <section className="customer-section customer-section--tinted" id="co-so-vat-chat">
        <div className="customer-container">
          <div className="customer-section-heading"><div><p className="customer-eyebrow">KHÔNG GIAN KHÁM</p><h2>Chăm sóc trong môi trường tiện nghi</h2></div><p>Hình ảnh minh họa cho Phòng khám Medicare, được tạo riêng cho website demo.</p></div>
          <div className="customer-facility-grid"><figure className="customer-facility-card customer-facility-card--large"><img src={receptionImage} alt="Khu vực lễ tân và chờ khám" /><figcaption>Sảnh tiếp nhận</figcaption></figure><figure className="customer-facility-card"><img src={consultationImage} alt="Bác sĩ tư vấn cho khách hàng" /><figcaption>Tư vấn tận tâm</figcaption></figure><figure className="customer-facility-card"><img src={examRoomImage} alt="Phòng khám với thiết bị y tế cơ bản" /><figcaption>Phòng khám hiện đại</figcaption></figure></div>
        </div>
      </section>

      <section className="customer-section" aria-labelledby="booking-process-title">
        <div className="customer-container">
          <div className="customer-section-heading"><div><p className="customer-eyebrow">QUY TRÌNH ĐẶT LỊCH</p><h2 id="booking-process-title">Bốn bước đơn giản để chủ động lịch khám</h2></div><p>Lịch khám được chọn theo buổi sáng hoặc chiều, không phải một giờ cụ thể.</p></div>
          <ol className="customer-process-grid">{bookingSteps.map(({ title, description, icon: Icon }, index) => <li key={title}><span className="customer-process-grid__number">{index + 1}</span><Icon aria-hidden="true" /><h3>{title}</h3><p>{description}</p></li>)}</ol>
        </div>
      </section>

      <section className="customer-section customer-section--news" id="tin-tuc" aria-labelledby="news-title">
        <div className="customer-container">
          <div className="customer-section-heading"><div><p className="customer-eyebrow">GÓC SỨC KHỎE</p><h2 id="news-title">Thông tin tham khảo</h2></div><p>Nội dung ngắn giúp bạn chuẩn bị tốt hơn trước khi đến phòng khám.</p></div>
          <div className="customer-news-grid">{newsItems.map((item) => <article className="customer-news-card" key={item.title}><img src={item.image} alt={item.alt} /><div><span>{item.category}</span><h3>{item.title}</h3><p>{item.summary}</p><time dateTime={item.date.split("/").reverse().join("-")}>{item.date}</time></div></article>)}</div>
        </div>
      </section>

      <section className="customer-section customer-section--cta">
        <div className="customer-container customer-home-cta"><div><p className="customer-eyebrow">BẮT ĐẦU NGAY</p><h2>Chủ động đặt lịch, giảm thời gian chờ</h2><p>Chọn ngày và buổi khám phù hợp; bác sĩ là lựa chọn tùy ý.</p></div><div className="customer-home-cta__actions"><Link className="customer-button customer-button--light" to="/booking">Đặt lịch ngay <ArrowRight aria-hidden="true" /></Link><a href="tel:19006868">Hoặc gọi 1900 6868</a></div></div>
      </section>
    </>
  );
}
