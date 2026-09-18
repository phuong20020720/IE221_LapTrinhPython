import { FormEvent, useEffect, useState } from "react";

import {
  activateEmployee,
  createEmployee,
  deactivateEmployee,
  listEmployees,
  type Employee,
  updateEmployee,
} from "../shared/api/employees";
import {
  IconActivate,
  IconButton,
  IconDeactivate,
  IconEdit,
} from "../shared/ui/IconButton";
import { Modal } from "../shared/ui/Modal";

const emptyForm = {
  username: "",
  last_name: "",
  first_name: "",
  password: "",
};

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setEmployees(await listEmployees());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được Employee.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditingId(employee.id);
    setForm({
      username: employee.username,
      last_name: employee.last_name,
      first_name: employee.first_name,
      password: "",
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
      if (editingId === null) {
        await createEmployee(form);
      } else {
        const payload: {
          first_name: string;
          last_name: string;
          password?: string;
        } = {
          first_name: form.first_name,
          last_name: form.last_name,
        };
        if (form.password.trim()) {
          payload.password = form.password;
        }
        await updateEmployee(editingId, payload);
      }
      closeModal();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Không lưu được Employee.");
    } finally {
      setSaving(false);
    }
  }

  async function onDeactivate(id: number) {
    setError("");
    try {
      await deactivateEmployee(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không vô hiệu hóa được.");
    }
  }

  async function onActivate(id: number) {
    setError("");
    try {
      await activateEmployee(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không kích hoạt được.");
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <p className="eyebrow">NHÂN VIÊN</p>
          <h1>Quản lý tài khoản</h1>
          <p>
            Chỉ Admin được tạo, sửa, ngừng hoặc kích hoạt lại tài khoản
            Employee.
          </p>
        </div>
        <div className="admin-panel__actions">
          <span className="admin-panel__meta">{employees.length} tài khoản</span>
          <button type="button" onClick={openCreate}>
            Thêm nhân viên
          </button>
        </div>
      </header>

      <div className="admin-list admin-list--full">
        {error ? <p className="form-error">{error}</p> : null}
        {loading ? <p className="admin-empty">Đang tải danh sách…</p> : null}
        {!loading && employees.length === 0 ? (
          <p className="admin-empty">Chưa có tài khoản Employee.</p>
        ) : null}

        {employees.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Họ tên</th>
                  <th className="data-table__col--center">Trạng thái</th>
                  <th className="data-table__col--center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <strong>{employee.username}</strong>
                    </td>
                    <td>{employee.full_name}</td>
                    <td className="data-table__col--center">
                      <span
                        className={
                          employee.is_active
                            ? "status-chip status-chip--on"
                            : "status-chip status-chip--off"
                        }
                      >
                        {employee.is_active ? "Hoạt động" : "Ngừng"}
                      </span>
                    </td>
                    <td className="data-table__actions data-table__col--center">
                      <IconButton
                        label="Sửa"
                        onClick={() => openEdit(employee)}
                      >
                        <IconEdit />
                      </IconButton>
                      {employee.is_active ? (
                        <IconButton
                          label="Ngừng hoạt động"
                          tone="danger"
                          onClick={() => void onDeactivate(employee.id)}
                        >
                          <IconDeactivate />
                        </IconButton>
                      ) : (
                        <IconButton
                          label="Kích hoạt lại"
                          tone="muted"
                          onClick={() => void onActivate(employee.id)}
                        >
                          <IconActivate />
                        </IconButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <Modal
        open={modalOpen}
        title={editingId === null ? "Thêm nhân viên" : "Cập nhật tài khoản"}
        description={
          editingId === null
            ? "Tạo tài khoản đăng nhập nội bộ cho Employee."
            : "Đổi họ, tên hoặc mật khẩu. Để trống mật khẩu nếu giữ nguyên."
        }
        onClose={closeModal}
      >
        <form className="admin-form" onSubmit={onSubmit}>
          <label>
            Tên đăng nhập
            <input
              required
              autoFocus={editingId === null}
              disabled={editingId !== null}
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  username: event.target.value,
                }))
              }
            />
          </label>
          <div className="name-fields">
            <label>
              Họ
              <input
                required
                autoFocus={editingId !== null}
                value={form.last_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    last_name: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Tên
              <input
                required
                value={form.first_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    first_name: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <label>
            Mật khẩu
            <input
              type="password"
              required={editingId === null}
              minLength={8}
              placeholder={editingId !== null ? "Để trống nếu giữ nguyên" : undefined}
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </label>

          {formError ? <p className="form-error">{formError}</p> : null}

          <div className="admin-form__actions">
            <button type="submit" disabled={saving}>
              {saving ? "Đang lưu…" : editingId === null ? "Thêm mới" : "Lưu thay đổi"}
            </button>
            <button type="button" className="button-secondary" onClick={closeModal}>
              Hủy
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
