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
import { Textarea } from "@/components/ui/textarea";
import {
  activateSpecialty,
  createSpecialty,
  deactivateSpecialty,
  listAdminSpecialties,
  type Specialty,
  updateSpecialty,
} from "../shared/api/specialties";
import { IconActivate, IconButton, IconDeactivate, IconEdit } from "../shared/ui/IconButton";
import { ConfirmDialog } from "../shared/ui/ConfirmDialog";
import { Modal } from "../shared/ui/Modal";
import { PaginationControls } from "../shared/ui/PaginationControls";

const emptyForm = { name: "", description: "" };

export function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingStatusSpecialty, setPendingStatusSpecialty] = useState<Specialty | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load(search = query, selectedStatus = status, targetPage = page) {
    setLoading(true);
    setError("");
    try {
      const result = await listAdminSpecialties({
        search,
        status: selectedStatus as "ALL" | "ACTIVE" | "INACTIVE",
        page: targetPage,
      });
      setSpecialties(result.results);
      setTotalCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách chuyên khoa.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item: Specialty) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
    });
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
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };
      if (editingId === null) {
        await createSpecialty(payload);
        toast.success("Đã thêm chuyên khoa mới.");
      } else {
        await updateSpecialty(editingId, payload);
        toast.success("Đã cập nhật chuyên khoa.");
      }
      closeModal();
      await load(query, status, page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không lưu được chuyên khoa.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item: Specialty) {
    const action = item.is_active ? "ngừng" : "kích hoạt lại";
    setError("");
    setStatusBusy(true);
    try {
      if (item.is_active) await deactivateSpecialty(item.id);
      else await activateSpecialty(item.id);
      toast.success(`Đã ${action} chuyên khoa ${item.name}.`);
      setPendingStatusSpecialty(null);
      await load(query, status, page);
    } catch (err) {
      const message = err instanceof Error ? err.message : `Không thể ${action} chuyên khoa.`;
      setError(message);
      toast.error(message);
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <p className="eyebrow">DANH MỤC KHÁM</p>
          <h1>Chuyên khoa</h1>
          <p>Quản lý danh mục và mô tả chuyên môn của từng chuyên khoa.</p>
        </div>
        <Button type="button" className="admin-primary-button" onClick={openCreate}>
          <span aria-hidden="true">＋</span> Thêm chuyên khoa
        </Button>
      </header>

      <Card className="admin-table-card">
        <div className="admin-table-toolbar">
          <form className="admin-search" onSubmit={(event) => { event.preventDefault(); setPage(1); void load(query, status, 1); }}>
            <span aria-hidden="true">⌕</span>
            <Input aria-label="Tìm chuyên khoa" placeholder="Tìm theo tên hoặc mô tả..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </form>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); void load(query, value, 1); }}>
            <SelectTrigger aria-label="Lọc trạng thái chuyên khoa"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem><SelectItem value="ACTIVE">Đang hoạt động</SelectItem><SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem></SelectContent>
          </Select>
          <span className="admin-result-count">{totalCount} kết quả</span>
        </div>

        {error ? <Alert variant="destructive" className="admin-alert"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {loading ? <div className="admin-empty">Đang tải danh sách...</div> : null}
        {!loading && specialties.length === 0 ? <div className="admin-empty">Không có chuyên khoa phù hợp.</div> : null}

        {!loading && specialties.length > 0 ? (
          <div className="table-wrap">
            <Table className="data-table">
              <TableHeader><TableRow><TableHead>Chuyên khoa</TableHead><TableHead>Mô tả</TableHead><TableHead>Trạng thái</TableHead><TableHead className="data-table__col--center">Thao tác</TableHead></TableRow></TableHeader>
              <TableBody>
                {specialties.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><div className="table-category"><strong>{item.name}</strong><small>#{String(item.id).padStart(3, "0")}</small></div></TableCell>
                    <TableCell className="data-table__description">{item.description || "Chưa có mô tả"}</TableCell>
                    <TableCell><Badge variant="secondary" className={item.is_active ? "status-chip status-chip--on" : "status-chip status-chip--off"}><i />{item.is_active ? "Hoạt động" : "Tạm ngừng"}</Badge></TableCell>
                    <TableCell className="data-table__actions data-table__col--center">
                      <IconButton label={`Sửa ${item.name}`} onClick={() => openEdit(item)}><IconEdit /></IconButton>
                      <IconButton label={item.is_active ? `Ngừng ${item.name}` : `Kích hoạt ${item.name}`} tone={item.is_active ? "danger" : "muted"} onClick={() => setPendingStatusSpecialty(item)}>
                        {item.is_active ? <IconDeactivate /> : <IconActivate />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
        <PaginationControls page={page} totalCount={totalCount} onPageChange={(next) => { setPage(next); void load(query, status, next); }} />
      </Card>

      <Modal open={modalOpen} title={editingId === null ? "Thêm chuyên khoa" : "Cập nhật chuyên khoa"} description="Thông tin này được sử dụng ở cả trang quản trị và trang công khai." onClose={closeModal}>
        <form className="admin-form" onSubmit={onSubmit}>
          <div className="admin-field"><Label htmlFor="specialty-name">Tên chuyên khoa</Label><Input id="specialty-name" required autoFocus maxLength={150} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></div>
          <div className="admin-field"><Label htmlFor="specialty-description">Mô tả</Label><Textarea id="specialty-description" rows={5} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></div>
          {formError ? <p className="form-error">{formError}</p> : null}
          <div className="admin-form__actions"><Button type="button" variant="outline" onClick={closeModal}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu chuyên khoa"}</Button></div>
        </form>
      </Modal>
      <ConfirmDialog
        open={pendingStatusSpecialty !== null}
        title={pendingStatusSpecialty?.is_active ? "Ngừng hoạt động chuyên khoa?" : "Kích hoạt lại chuyên khoa?"}
        description={pendingStatusSpecialty ? `${pendingStatusSpecialty.name} sẽ ${pendingStatusSpecialty.is_active ? "không còn hiển thị trên trang công khai" : "được hiển thị lại trên trang công khai"}.` : ""}
        confirmLabel={pendingStatusSpecialty?.is_active ? "Ngừng hoạt động" : "Kích hoạt"}
        destructive={Boolean(pendingStatusSpecialty?.is_active)}
        busy={statusBusy}
        onClose={() => { if (!statusBusy) setPendingStatusSpecialty(null); }}
        onConfirm={() => { if (pendingStatusSpecialty) void changeStatus(pendingStatusSpecialty); }}
      />
    </section>
  );
}
