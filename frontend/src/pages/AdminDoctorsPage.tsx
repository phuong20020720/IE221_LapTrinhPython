import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  activateDoctor,
  createDoctor,
  deactivateDoctor,
  listAdminDoctors,
  removeDoctorImage,
  type Doctor,
  type DoctorExpertiseInput,
  updateDoctor,
} from "../shared/api/doctors";
import { listAdminSpecialties, type Specialty } from "../shared/api/specialties";
import { ConfirmDialog } from "../shared/ui/ConfirmDialog";
import { IconActivate, IconButton, IconDeactivate, IconEdit, IconView } from "../shared/ui/IconButton";
import { Modal } from "../shared/ui/Modal";
import { PaginationControls } from "../shared/ui/PaginationControls";

type DoctorForm = {
  full_name: string;
  specialty_id: string;
  credentials: string;
  position: string;
  years_of_experience: string;
  phone: string;
  email: string;
  professional_description: string;
  expertises: DoctorExpertiseInput[];
  profile_image: File | null;
};

const emptyForm: DoctorForm = {
  full_name: "",
  specialty_id: "",
  credentials: "",
  position: "",
  years_of_experience: "",
  phone: "",
  email: "",
  professional_description: "",
  expertises: [],
  profile_image: null,
};

export function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [query, setQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [status, setStatus] = useState("ALL");
  const [form, setForm] = useState<DoctorForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailDoctor, setDetailDoctor] = useState<Doctor | null>(null);
  const [pendingStatusDoctor, setPendingStatusDoctor] = useState<Doctor | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load(
    search = query,
    selectedSpecialty = specialtyFilter,
    selectedStatus = status,
    targetPage = page,
  ) {
    setLoading(true);
    setError("");
    try {
      const [doctorData, specialtyData] = await Promise.all([
        listAdminDoctors({
          search,
          specialtyId: selectedSpecialty ? Number(selectedSpecialty) : undefined,
          includeInactive: true,
          status: selectedStatus as "ALL" | "ACTIVE" | "INACTIVE",
          page: targetPage,
        }),
        listAdminSpecialties({ pageSize: 100 }),
      ]);
      setDoctors(doctorData.results);
      setTotalCount(doctorData.count);
      setSpecialties(specialtyData.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu bác sĩ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load("", "", "ALL", 1); }, []);

  const previewImage = useMemo(
    () => form.profile_image ? URL.createObjectURL(form.profile_image) : currentImage,
    [form.profile_image, currentImage],
  );

  useEffect(() => () => {
    if (previewImage?.startsWith("blob:")) URL.revokeObjectURL(previewImage);
  }, [previewImage]);

  function openCreate() {
    setEditingId(null);
    setCurrentImage(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(doctor: Doctor) {
    setEditingId(doctor.id);
    setCurrentImage(doctor.profile_image_url);
    setForm({
      full_name: doctor.full_name,
      specialty_id: String(doctor.specialty.id),
      credentials: doctor.credentials,
      position: doctor.position,
      years_of_experience: doctor.years_of_experience === null ? "" : String(doctor.years_of_experience),
      phone: doctor.phone ?? "",
      email: doctor.email ?? "",
      professional_description: doctor.professional_description,
      expertises: doctor.expertises.map((item) => ({
        expertise_name: item.expertise_name,
        description: item.description,
        display_order: item.display_order,
      })),
      profile_image: null,
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setCurrentImage(null);
    setForm(emptyForm);
    setFormError("");
  }

  function addExpertise() {
    setForm((value) => ({
      ...value,
      expertises: [...value.expertises, { expertise_name: "", description: "", display_order: value.expertises.length }],
    }));
  }

  function updateExpertise(index: number, field: "expertise_name" | "description", value: string) {
    setForm((current) => ({
      ...current,
      expertises: current.expertises.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }

  function removeExpertise(index: number) {
    setForm((value) => ({ ...value, expertises: value.expertises.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function selectImage(file: File | null) {
    setFormError("");
    if (!file) {
      setForm((value) => ({ ...value, profile_image: null }));
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Ảnh đại diện không được vượt quá 5 MB.");
      return;
    }
    setForm((value) => ({ ...value, profile_image: file }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const years = form.years_of_experience === "" ? null : Number(form.years_of_experience);
    if (years !== null && (!Number.isInteger(years) || years < 0)) {
      setFormError("Số năm kinh nghiệm phải là số nguyên từ 0 trở lên.");
      return;
    }
    if (form.expertises.some((item) => !item.expertise_name.trim())) {
      setFormError("Tên lĩnh vực chuyên sâu không được để trống.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        specialty_id: Number(form.specialty_id),
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        credentials: form.credentials.trim(),
        position: form.position.trim(),
        years_of_experience: years,
        professional_description: form.professional_description.trim(),
        expertises: form.expertises.map((item, index) => ({
          expertise_name: item.expertise_name.trim(),
          description: item.description?.trim() ?? "",
          display_order: index,
        })),
        profile_image: form.profile_image,
      };
      if (editingId === null) {
        await createDoctor(payload);
        toast.success("Đã thêm bác sĩ mới.");
      } else {
        await updateDoctor(editingId, payload);
        toast.success("Đã cập nhật thông tin bác sĩ.");
      }
      closeModal();
      await load(query, specialtyFilter, status, page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không lưu được bác sĩ.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(doctor: Doctor) {
    const action = doctor.is_active ? "ngừng" : "kích hoạt lại";
    setError("");
    setStatusBusy(true);
    try {
      if (doctor.is_active) await deactivateDoctor(doctor.id);
      else await activateDoctor(doctor.id);
      toast.success(`Đã ${action} bác sĩ ${doctor.full_name}.`);
      setPendingStatusDoctor(null);
      await load(query, specialtyFilter, status, page);
    } catch (err) {
      const message = err instanceof Error ? err.message : `Không thể ${action} bác sĩ.`;
      setError(message);
      toast.error(message);
    } finally {
      setStatusBusy(false);
    }
  }

  async function onRemoveImage() {
    if (editingId === null || !currentImage) return;
    try {
      await removeDoctorImage(editingId);
      setCurrentImage(null);
      setForm((value) => ({ ...value, profile_image: null }));
      toast.success("Đã gỡ ảnh đại diện của bác sĩ.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không gỡ được ảnh bác sĩ.";
      setFormError(message);
      toast.error(message);
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div><p className="eyebrow">ĐỘI NGŨ CHUYÊN MÔN</p><h1>Bác sĩ</h1><p>Quản lý hồ sơ nghề nghiệp, chuyên khoa, lĩnh vực chuyên sâu và ảnh đại diện.</p></div>
        <Button type="button" className="admin-primary-button" onClick={openCreate}><span aria-hidden="true">＋</span> Thêm bác sĩ</Button>
      </header>

      <Card className="admin-table-card">
        <div className="admin-table-toolbar admin-table-toolbar--doctors">
          <form className="admin-search" onSubmit={(event) => { event.preventDefault(); setPage(1); void load(query, specialtyFilter, status, 1); }}><span aria-hidden="true">⌕</span><Input aria-label="Tìm bác sĩ" placeholder="Tên, SĐT hoặc email..." value={query} onChange={(event) => setQuery(event.target.value)} /></form>
          <Select value={specialtyFilter || "ALL"} onValueChange={(value) => { const next = value === "ALL" ? "" : value; setSpecialtyFilter(next); setPage(1); void load(query, next, status, 1); }}><SelectTrigger aria-label="Lọc bác sĩ theo chuyên khoa"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả chuyên khoa</SelectItem>{specialties.map((item) => <SelectItem value={String(item.id)} key={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); void load(query, specialtyFilter, value, 1); }}><SelectTrigger aria-label="Lọc trạng thái bác sĩ"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem><SelectItem value="ACTIVE">Đang hoạt động</SelectItem><SelectItem value="INACTIVE">Tạm ngừng</SelectItem></SelectContent></Select>
          <span className="admin-result-count">{totalCount} kết quả</span>
        </div>

        {error ? <Alert variant="destructive" className="admin-alert"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {loading ? <div className="admin-empty">Đang tải danh sách...</div> : null}
        {!loading && doctors.length === 0 ? <div className="admin-empty">Không có bác sĩ phù hợp.</div> : null}
        {!loading && doctors.length > 0 ? (
          <div className="table-wrap"><Table className="data-table">
            <TableHeader><TableRow><TableHead>Họ tên bác sĩ</TableHead><TableHead>Chuyên khoa</TableHead><TableHead>Liên hệ</TableHead><TableHead>Kinh nghiệm</TableHead><TableHead>Trạng thái</TableHead><TableHead className="data-table__col--center">Thao tác</TableHead></TableRow></TableHeader>
            <TableBody>{doctors.map((doctor) => <TableRow key={doctor.id}>
              <TableCell><div className="table-primary"><Avatar className="table-avatar"><AvatarImage src={doctor.profile_image_url ?? undefined} /><AvatarFallback>{doctor.full_name[0]}</AvatarFallback></Avatar><div><strong>{doctor.full_name}</strong><small>{[doctor.credentials, doctor.position].filter(Boolean).join(" · ") || `Mã #${doctor.id}`}</small></div></div></TableCell>
              <TableCell><strong className="table-specialty">{doctor.specialty.name}</strong><small className="table-secondary">{doctor.expertises.length} lĩnh vực chuyên sâu</small></TableCell>
              <TableCell><div className="table-stack"><span>{doctor.phone}</span><small>{doctor.email || "Chưa có email"}</small></div></TableCell>
              <TableCell>{doctor.years_of_experience === null ? "—" : `${doctor.years_of_experience} năm`}</TableCell>
              <TableCell><Badge variant="secondary" className={doctor.is_active ? "status-chip status-chip--on" : "status-chip status-chip--off"}><i />{doctor.is_active ? "Hoạt động" : "Tạm ngừng"}</Badge></TableCell>
              <TableCell className="data-table__actions data-table__col--center"><IconButton label={`Xem chi tiết ${doctor.full_name}`} tone="muted" onClick={() => setDetailDoctor(doctor)}><IconView /></IconButton><IconButton label={`Sửa ${doctor.full_name}`} onClick={() => openEdit(doctor)}><IconEdit /></IconButton><IconButton label={doctor.is_active ? `Ngừng ${doctor.full_name}` : `Kích hoạt ${doctor.full_name}`} tone={doctor.is_active ? "danger" : "muted"} onClick={() => setPendingStatusDoctor(doctor)}>{doctor.is_active ? <IconDeactivate /> : <IconActivate />}</IconButton></TableCell>
            </TableRow>)}</TableBody>
          </Table></div>
        ) : null}
        <PaginationControls page={page} totalCount={totalCount} onPageChange={(next) => { setPage(next); void load(query, specialtyFilter, status, next); }} />
      </Card>

      <Modal open={modalOpen} title={editingId === null ? "Thêm bác sĩ" : "Cập nhật bác sĩ"} description="Các trường họ tên, chuyên khoa và số điện thoại là bắt buộc." onClose={closeModal}>
        <form className="admin-form admin-form--doctor" onSubmit={onSubmit}>
          <div className="doctor-image-upload">
            <div className="doctor-image-upload__preview">{previewImage ? <img src={previewImage} alt="Xem trước ảnh bác sĩ" /> : <span>{form.full_name[0]?.toUpperCase() || "BS"}</span>}</div>
            <div><Label className="admin-file-button">Chọn ảnh<Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectImage(event.target.files?.[0] ?? null)} /></Label><p>JPG, PNG hoặc WEBP · tối đa 5 MB</p>{editingId !== null && currentImage ? <Button type="button" variant="destructive" size="sm" onClick={() => void onRemoveImage()}>Gỡ ảnh hiện tại</Button> : null}</div>
          </div>
          <div className="admin-form__grid">
            <div className="admin-field"><Label htmlFor="doctor-name">Họ tên</Label><Input id="doctor-name" required autoFocus maxLength={150} value={form.full_name} onChange={(event) => setForm((value) => ({ ...value, full_name: event.target.value }))} /></div>
            <div className="admin-field"><Label>Chuyên khoa</Label><Select required value={form.specialty_id} onValueChange={(value) => setForm((current) => ({ ...current, specialty_id: value }))}><SelectTrigger aria-label="Chuyên khoa"><SelectValue placeholder="Chọn chuyên khoa" /></SelectTrigger><SelectContent>{specialties.filter((item) => item.is_active || String(item.id) === form.specialty_id).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="admin-form__grid">
            <div className="admin-field"><Label htmlFor="doctor-credentials">Học hàm / học vị</Label><Input id="doctor-credentials" maxLength={100} placeholder="VD: BS.CKII" value={form.credentials} onChange={(event) => setForm((value) => ({ ...value, credentials: event.target.value }))} /></div>
            <div className="admin-field"><Label htmlFor="doctor-position">Chức vụ</Label><Input id="doctor-position" maxLength={150} placeholder="VD: Trưởng khoa" value={form.position} onChange={(event) => setForm((value) => ({ ...value, position: event.target.value }))} /></div>
          </div>
          <div className="admin-form__grid">
            <div className="admin-field"><Label htmlFor="doctor-phone">Số điện thoại</Label><Input id="doctor-phone" required maxLength={20} value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} /></div>
            <div className="admin-field"><Label htmlFor="doctor-email">Email</Label><Input id="doctor-email" type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} /></div>
          </div>
          <div className="admin-field"><Label htmlFor="doctor-years">Số năm kinh nghiệm</Label><Input id="doctor-years" type="number" min="0" step="1" value={form.years_of_experience} onChange={(event) => setForm((value) => ({ ...value, years_of_experience: event.target.value }))} /></div>
          <div className="admin-field"><Label htmlFor="doctor-description">Mô tả chuyên môn</Label><Textarea id="doctor-description" rows={4} value={form.professional_description} onChange={(event) => setForm((value) => ({ ...value, professional_description: event.target.value }))} /></div>
          <fieldset className="doctor-expertise-editor"><div className="doctor-expertise-editor__heading"><div><strong>Lĩnh vực chuyên sâu</strong><small>Có thể thêm nhiều lĩnh vực cho một bác sĩ.</small></div><Button type="button" variant="outline" size="sm" onClick={addExpertise}>＋ Thêm lĩnh vực</Button></div>{form.expertises.length === 0 ? <p className="doctor-expertise-editor__empty">Chưa có lĩnh vực chuyên sâu.</p> : form.expertises.map((item, index) => <div className="doctor-expertise-editor__row" key={index}><div className="admin-field"><Label htmlFor={`expertise-${index}`}>Tên lĩnh vực</Label><Input id={`expertise-${index}`} required value={item.expertise_name} onChange={(event) => updateExpertise(index, "expertise_name", event.target.value)} /></div><div className="admin-field"><Label htmlFor={`expertise-description-${index}`}>Mô tả</Label><Input id={`expertise-description-${index}`} value={item.description ?? ""} onChange={(event) => updateExpertise(index, "description", event.target.value)} /></div><Button type="button" variant="ghost" size="icon" aria-label={`Xóa lĩnh vực ${index + 1}`} onClick={() => removeExpertise(index)}>×</Button></div>)}</fieldset>
          {formError ? <p className="form-error">{formError}</p> : null}
          <div className="admin-form__actions"><Button type="button" variant="outline" onClick={closeModal}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu bác sĩ"}</Button></div>
        </form>
      </Modal>

      <Modal open={detailDoctor !== null} title="Chi tiết bác sĩ" description="Thông tin hồ sơ đang được lưu trong hệ thống." onClose={() => setDetailDoctor(null)}>
        {detailDoctor ? (
          <div className="doctor-detail-admin">
            <div className="doctor-detail-admin__identity">
              <Avatar className="doctor-detail-admin__avatar"><AvatarImage src={detailDoctor.profile_image_url ?? undefined} /><AvatarFallback>{detailDoctor.full_name[0]}</AvatarFallback></Avatar>
              <div><p>{detailDoctor.credentials || "Bác sĩ"}</p><h3>{detailDoctor.full_name}</h3><span>{detailDoctor.position || "Chưa cập nhật chức vụ"}</span></div>
              <Badge variant="secondary" className={detailDoctor.is_active ? "status-chip status-chip--on" : "status-chip status-chip--off"}><i />{detailDoctor.is_active ? "Hoạt động" : "Tạm ngừng"}</Badge>
            </div>
            <dl className="doctor-detail-admin__grid">
              <div><dt>Chuyên khoa</dt><dd>{detailDoctor.specialty.name}</dd></div>
              <div><dt>Kinh nghiệm</dt><dd>{detailDoctor.years_of_experience === null ? "Chưa cập nhật" : `${detailDoctor.years_of_experience} năm`}</dd></div>
              <div><dt>Số điện thoại</dt><dd>{detailDoctor.phone || "—"}</dd></div>
              <div><dt>Email</dt><dd>{detailDoctor.email || "—"}</dd></div>
            </dl>
            <div className="doctor-detail-admin__section"><h4>Mô tả chuyên môn</h4><p>{detailDoctor.professional_description || "Chưa có mô tả."}</p></div>
            <div className="doctor-detail-admin__section"><h4>Lĩnh vực chuyên sâu</h4>{detailDoctor.expertises.length ? <ul>{detailDoctor.expertises.map((item) => <li key={item.id}><strong>{item.expertise_name}</strong>{item.description ? <span>{item.description}</span> : null}</li>)}</ul> : <p>Chưa có lĩnh vực chuyên sâu.</p>}</div>
            <div className="admin-form__actions"><Button type="button" variant="outline" onClick={() => setDetailDoctor(null)}>Đóng</Button><Button type="button" onClick={() => { const selected = detailDoctor; setDetailDoctor(null); openEdit(selected); }}>Chỉnh sửa</Button></div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={pendingStatusDoctor !== null}
        title={pendingStatusDoctor?.is_active ? "Ngừng hoạt động bác sĩ?" : "Kích hoạt lại bác sĩ?"}
        description={pendingStatusDoctor ? `${pendingStatusDoctor.full_name} sẽ ${pendingStatusDoctor.is_active ? "không còn xuất hiện trong danh sách đặt lịch công khai" : "xuất hiện lại trong danh sách đặt lịch công khai"}.` : ""}
        confirmLabel={pendingStatusDoctor?.is_active ? "Ngừng hoạt động" : "Kích hoạt"}
        destructive={Boolean(pendingStatusDoctor?.is_active)}
        busy={statusBusy}
        onClose={() => { if (!statusBusy) setPendingStatusDoctor(null); }}
        onConfirm={() => { if (pendingStatusDoctor) void changeStatus(pendingStatusDoctor); }}
      />
    </section>
  );
}
