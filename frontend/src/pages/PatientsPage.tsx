import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  activatePatient,
  createPatient,
  deactivatePatient,
  listPatients,
  type Patient,
  updatePatient,
} from "../shared/api/patients";
import { splitFullName } from "../shared/lib/personName";
import { ConfirmDialog } from "../shared/ui/ConfirmDialog";
import { IconActivate, IconButton, IconDeactivate, IconEdit } from "../shared/ui/IconButton";
import { Modal } from "../shared/ui/Modal";
import { PaginationControls } from "../shared/ui/PaginationControls";

const emptyForm = { family_name: "", given_name: "", phone: "", email: "" };

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingStatusPatient, setPendingStatusPatient] = useState<Patient | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  async function load(search = query, selectedStatus = status, targetPage = page) {
    setLoading(true);
    setError("");
    try {
      const result = await listPatients({
        search,
        status: selectedStatus as "ALL" | "ACTIVE" | "INACTIVE",
        page: targetPage,
      });
      setPatients(result.results);
      setTotalCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được bệnh nhân.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load("", "ALL", 1); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(patient: Patient) {
    const parts = splitFullName(patient.full_name);
    setEditingId(patient.id);
    setForm({ family_name: parts.family_name, given_name: parts.given_name, phone: patient.phone, email: patient.email });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editingId === null) {
        await createPatient(form);
        toast.success("Đã thêm hồ sơ bệnh nhân.");
      } else {
        await updatePatient(editingId, form);
        toast.success("Đã cập nhật hồ sơ bệnh nhân.");
      }
      closeModal();
      await load(query, status, page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không lưu được bệnh nhân.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(patient: Patient) {
    const action = patient.is_active ? "ngừng" : "kích hoạt lại";
    setStatusBusy(true);
    setError("");
    try {
      if (patient.is_active) await deactivatePatient(patient.id);
      else await activatePatient(patient.id);
      toast.success(`Đã ${action} hồ sơ ${patient.full_name}.`);
      setPendingStatusPatient(null);
      await load(query, status, page);
    } catch (err) {
      const message = err instanceof Error ? err.message : `Không thể ${action} hồ sơ.`;
      setError(message);
      toast.error(message);
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div><p className="eyebrow">HỒ SƠ KHÁM</p><h1>Bệnh nhân</h1><p>Tìm kiếm, cập nhật thông tin liên hệ và quản lý trạng thái hồ sơ bệnh nhân.</p></div>
        <Button type="button" className="admin-primary-button" onClick={openCreate}><span aria-hidden="true">＋</span> Thêm bệnh nhân</Button>
      </header>

      <Card className="admin-table-card">
        <div className="admin-table-toolbar">
          <form className="admin-search" onSubmit={(event) => { event.preventDefault(); setPage(1); void load(query, status, 1); }}><span aria-hidden="true">⌕</span><Input aria-label="Tìm bệnh nhân" placeholder="Tìm theo tên hoặc số điện thoại..." value={query} onChange={(event) => setQuery(event.target.value)} /></form>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); void load(query, value, 1); }}><SelectTrigger aria-label="Lọc trạng thái bệnh nhân"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem><SelectItem value="ACTIVE">Đang hoạt động</SelectItem><SelectItem value="INACTIVE">Tạm ngừng</SelectItem></SelectContent></Select>
          <span className="admin-result-count">{totalCount} hồ sơ</span>
        </div>
        {error ? <Alert variant="destructive" className="admin-alert"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {loading ? <div className="admin-empty">Đang tải danh sách...</div> : null}
        {!loading && patients.length === 0 ? <div className="admin-empty">Không có bệnh nhân phù hợp.</div> : null}
        {!loading && patients.length > 0 ? <div className="table-wrap"><Table className="data-table">
          <TableHeader><TableRow><TableHead>Họ tên bệnh nhân</TableHead><TableHead>Số điện thoại</TableHead><TableHead>Email</TableHead><TableHead>Ngày tạo</TableHead><TableHead>Trạng thái</TableHead><TableHead className="data-table__col--center">Thao tác</TableHead></TableRow></TableHeader>
          <TableBody>{patients.map((patient) => <TableRow key={patient.id}>
            <TableCell><div className="table-category"><strong>{patient.full_name}</strong><small>#{String(patient.id).padStart(4, "0")}</small></div></TableCell>
            <TableCell>{patient.phone}</TableCell><TableCell>{patient.email || "—"}</TableCell>
            <TableCell>{new Intl.DateTimeFormat("vi-VN").format(new Date(patient.created_at))}</TableCell>
            <TableCell><Badge variant="secondary" className={patient.is_active ? "status-chip status-chip--on" : "status-chip status-chip--off"}><i />{patient.is_active ? "Hoạt động" : "Tạm ngừng"}</Badge></TableCell>
            <TableCell className="data-table__actions data-table__col--center"><IconButton label={`Sửa ${patient.full_name}`} onClick={() => openEdit(patient)}><IconEdit /></IconButton><IconButton label={patient.is_active ? `Ngừng ${patient.full_name}` : `Kích hoạt ${patient.full_name}`} tone={patient.is_active ? "danger" : "muted"} onClick={() => setPendingStatusPatient(patient)}>{patient.is_active ? <IconDeactivate /> : <IconActivate />}</IconButton></TableCell>
          </TableRow>)}</TableBody>
        </Table></div> : null}
        <PaginationControls page={page} totalCount={totalCount} onPageChange={(next) => { setPage(next); void load(query, status, next); }} />
      </Card>

      <Modal open={modalOpen} title={editingId === null ? "Thêm bệnh nhân" : "Cập nhật hồ sơ"} description="Họ, tên và số điện thoại là thông tin bắt buộc." onClose={closeModal}>
        <form className="admin-form" onSubmit={onSubmit}>
          <div className="admin-form__grid"><div className="admin-field"><Label htmlFor="patient-family-name">Họ</Label><Input id="patient-family-name" required autoFocus value={form.family_name} onChange={(event) => setForm((value) => ({ ...value, family_name: event.target.value }))} /></div><div className="admin-field"><Label htmlFor="patient-given-name">Tên</Label><Input id="patient-given-name" required value={form.given_name} onChange={(event) => setForm((value) => ({ ...value, given_name: event.target.value }))} /></div></div>
          <div className="admin-field"><Label htmlFor="patient-phone">Số điện thoại</Label><Input id="patient-phone" required value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} /></div>
          <div className="admin-field"><Label htmlFor="patient-email">Email</Label><Input id="patient-email" type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} /></div>
          {formError ? <p className="form-error">{formError}</p> : null}
          <div className="admin-form__actions"><Button type="button" variant="outline" onClick={closeModal}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu hồ sơ"}</Button></div>
        </form>
      </Modal>

      <ConfirmDialog open={pendingStatusPatient !== null} title={pendingStatusPatient?.is_active ? "Ngừng hồ sơ bệnh nhân?" : "Kích hoạt lại hồ sơ?"} description={pendingStatusPatient ? `Xác nhận thay đổi trạng thái hồ sơ của ${pendingStatusPatient.full_name}.` : ""} confirmLabel={pendingStatusPatient?.is_active ? "Ngừng hoạt động" : "Kích hoạt"} destructive={Boolean(pendingStatusPatient?.is_active)} busy={statusBusy} onClose={() => { if (!statusBusy) setPendingStatusPatient(null); }} onConfirm={() => { if (pendingStatusPatient) void changeStatus(pendingStatusPatient); }} />
    </section>
  );
}
