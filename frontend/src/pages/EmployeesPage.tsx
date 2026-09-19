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
  activateEmployee,
  createEmployee,
  deactivateEmployee,
  listEmployees,
  type Employee,
  updateEmployee,
} from "../shared/api/employees";
import { ConfirmDialog } from "../shared/ui/ConfirmDialog";
import { IconActivate, IconButton, IconDeactivate, IconEdit } from "../shared/ui/IconButton";
import { Modal } from "../shared/ui/Modal";
import { PaginationControls } from "../shared/ui/PaginationControls";

const emptyForm = { username: "", last_name: "", first_name: "", password: "" };

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingStatusEmployee, setPendingStatusEmployee] = useState<Employee | null>(null);
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
      const result = await listEmployees({
        search,
        status: selectedStatus as "ALL" | "ACTIVE" | "INACTIVE",
        page: targetPage,
      });
      setEmployees(result.results);
      setTotalCount(result.count);
    }
    catch (err) { setError(err instanceof Error ? err.message : "Không tải được nhân viên."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function openCreate() { setEditingId(null); setForm(emptyForm); setFormError(""); setModalOpen(true); }
  function openEdit(employee: Employee) { setEditingId(employee.id); setForm({ username: employee.username, last_name: employee.last_name, first_name: employee.first_name, password: "" }); setFormError(""); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditingId(null); setForm(emptyForm); setFormError(""); }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editingId === null) {
        await createEmployee(form);
        toast.success("Đã tạo tài khoản nhân viên.");
      } else {
        const payload: { first_name: string; last_name: string; password?: string } = { first_name: form.first_name, last_name: form.last_name };
        if (form.password.trim()) payload.password = form.password;
        await updateEmployee(editingId, payload);
        toast.success("Đã cập nhật tài khoản nhân viên.");
      }
      closeModal();
       await load(query, status, page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không lưu được nhân viên.";
      setFormError(message);
      toast.error(message);
    } finally { setSaving(false); }
  }

  async function changeStatus(employee: Employee) {
    const action = employee.is_active ? "ngừng" : "kích hoạt lại";
    setStatusBusy(true);
    setError("");
    try {
      if (employee.is_active) await deactivateEmployee(employee.id);
      else await activateEmployee(employee.id);
      toast.success(`Đã ${action} tài khoản ${employee.username}.`);
      setPendingStatusEmployee(null);
       await load(query, status, page);
    } catch (err) {
      const message = err instanceof Error ? err.message : `Không thể ${action} tài khoản.`;
      setError(message);
      toast.error(message);
    } finally { setStatusBusy(false); }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__header"><div><p className="eyebrow">TÀI KHOẢN NỘI BỘ</p><h1>Nhân viên</h1><p>Tạo và quản lý tài khoản Employee được phép vận hành hệ thống.</p></div><Button type="button" className="admin-primary-button" onClick={openCreate}><span aria-hidden="true">＋</span> Thêm nhân viên</Button></header>
      <Card className="admin-table-card">
        <div className="admin-table-toolbar"><form className="admin-search" onSubmit={(event) => { event.preventDefault(); setPage(1); void load(query, status, 1); }}><span aria-hidden="true">⌕</span><Input aria-label="Tìm nhân viên" placeholder="Tìm theo họ tên hoặc username..." value={query} onChange={(event) => setQuery(event.target.value)} /></form><Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); void load(query, value, 1); }}><SelectTrigger aria-label="Lọc trạng thái nhân viên"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem><SelectItem value="ACTIVE">Đang hoạt động</SelectItem><SelectItem value="INACTIVE">Tạm ngừng</SelectItem></SelectContent></Select><span className="admin-result-count">{totalCount} tài khoản</span></div>
        {error ? <Alert variant="destructive" className="admin-alert"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {loading ? <div className="admin-empty">Đang tải danh sách...</div> : null}
        {!loading && employees.length === 0 ? <div className="admin-empty">Không có nhân viên phù hợp.</div> : null}
        {!loading && employees.length > 0 ? <div className="table-wrap"><Table className="data-table">
          <TableHeader><TableRow><TableHead>Nhân viên</TableHead><TableHead>Tên đăng nhập</TableHead><TableHead>Đăng nhập gần nhất</TableHead><TableHead>Trạng thái</TableHead><TableHead className="data-table__col--center">Thao tác</TableHead></TableRow></TableHeader>
          <TableBody>{employees.map((employee) => <TableRow key={employee.id}><TableCell><div className="table-category"><strong>{employee.full_name}</strong><small>Employee #{String(employee.id).padStart(3, "0")}</small></div></TableCell><TableCell><strong>{employee.username}</strong></TableCell><TableCell>{employee.last_login ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(employee.last_login)) : "Chưa đăng nhập"}</TableCell><TableCell><Badge variant="secondary" className={employee.is_active ? "status-chip status-chip--on" : "status-chip status-chip--off"}><i />{employee.is_active ? "Hoạt động" : "Tạm ngừng"}</Badge></TableCell><TableCell className="data-table__actions data-table__col--center"><IconButton label={`Sửa ${employee.username}`} onClick={() => openEdit(employee)}><IconEdit /></IconButton><IconButton label={employee.is_active ? `Ngừng ${employee.username}` : `Kích hoạt ${employee.username}`} tone={employee.is_active ? "danger" : "muted"} onClick={() => setPendingStatusEmployee(employee)}>{employee.is_active ? <IconDeactivate /> : <IconActivate />}</IconButton></TableCell></TableRow>)}</TableBody>
        </Table></div> : null}
        <PaginationControls page={page} totalCount={totalCount} onPageChange={(next) => { setPage(next); void load(query, status, next); }} />
      </Card>

      <Modal open={modalOpen} title={editingId === null ? "Thêm nhân viên" : "Cập nhật tài khoản"} description={editingId === null ? "Tạo tài khoản đăng nhập nội bộ cho Employee." : "Để trống mật khẩu nếu muốn giữ nguyên."} onClose={closeModal}>
        <form className="admin-form" onSubmit={onSubmit}>
          <div className="admin-field"><Label htmlFor="employee-username">Tên đăng nhập</Label><Input id="employee-username" required autoFocus={editingId === null} disabled={editingId !== null} value={form.username} onChange={(event) => setForm((value) => ({ ...value, username: event.target.value }))} /></div>
          <div className="admin-form__grid"><div className="admin-field"><Label htmlFor="employee-last-name">Họ</Label><Input id="employee-last-name" required autoFocus={editingId !== null} value={form.last_name} onChange={(event) => setForm((value) => ({ ...value, last_name: event.target.value }))} /></div><div className="admin-field"><Label htmlFor="employee-first-name">Tên</Label><Input id="employee-first-name" required value={form.first_name} onChange={(event) => setForm((value) => ({ ...value, first_name: event.target.value }))} /></div></div>
          <div className="admin-field"><Label htmlFor="employee-password">Mật khẩu</Label><Input id="employee-password" type="password" required={editingId === null} minLength={8} placeholder={editingId !== null ? "Để trống nếu giữ nguyên" : "Tối thiểu 8 ký tự"} value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} /></div>
          {formError ? <p className="form-error">{formError}</p> : null}<div className="admin-form__actions"><Button type="button" variant="outline" onClick={closeModal}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu tài khoản"}</Button></div>
        </form>
      </Modal>
      <ConfirmDialog open={pendingStatusEmployee !== null} title={pendingStatusEmployee?.is_active ? "Ngừng tài khoản nhân viên?" : "Kích hoạt lại tài khoản?"} description={pendingStatusEmployee ? `Xác nhận thay đổi trạng thái tài khoản ${pendingStatusEmployee.username}.` : ""} confirmLabel={pendingStatusEmployee?.is_active ? "Ngừng hoạt động" : "Kích hoạt"} destructive={Boolean(pendingStatusEmployee?.is_active)} busy={statusBusy} onClose={() => { if (!statusBusy) setPendingStatusEmployee(null); }} onConfirm={() => { if (pendingStatusEmployee) void changeStatus(pendingStatusEmployee); }} />
    </section>
  );
}
