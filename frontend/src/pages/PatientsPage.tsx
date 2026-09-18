import { FormEvent, useEffect, useState } from "react";

import {
  activatePatient,
  createPatient,
  deactivatePatient,
  listPatients,
  type Patient,
  updatePatient,
} from "../shared/api/patients";
import { splitFullName } from "../shared/lib/personName";
import {
  IconActivate,
  IconButton,
  IconDeactivate,
  IconEdit,
} from "../shared/ui/IconButton";
import { Modal } from "../shared/ui/Modal";

const emptyForm = {
  family_name: "",
  given_name: "",
  phone: "",
  email: "",
};

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load(search = query) {
    setLoading(true);
    setError("");
    try {
      setPatients(await listPatients(search));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được bệnh nhân.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(patient: Patient) {
    const parts = splitFullName(patient.full_name);
    setEditingId(patient.id);
    setForm({
      family_name: parts.family_name,
      given_name: parts.given_name,
      phone: patient.phone,
      email: patient.email,
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
        await createPatient(form);
      } else {
        await updatePatient(editingId, form);
      }
      closeModal();
      await load(query);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Không lưu được bệnh nhân.");
    } finally {
      setSaving(false);
    }
  }

  async function onDeactivate(id: number) {
    setError("");
    try {
      await deactivatePatient(id);
      await load(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không vô hiệu hóa được.");
    }
  }

  async function onActivate(id: number) {
    setError("");
    try {
      await activatePatient(id);
      await load(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không kích hoạt được.");
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <p className="eyebrow">BỆNH NHÂN</p>
          <h1>Quản lý bệnh nhân</h1>
          <p>
            Tìm theo tên hoặc số điện thoại. Danh sách gồm cả hồ sơ đang ngừng
            hoạt động.
          </p>
        </div>
        <div className="admin-panel__actions">
          <span className="admin-panel__meta">{patients.length} hồ sơ</span>
          <button type="button" onClick={openCreate}>
            Thêm bệnh nhân
          </button>
        </div>
      </header>

      <div className="admin-list admin-list--full">
        <form
          className="admin-toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            void load(query);
          }}
        >
          <input
            aria-label="Tìm bệnh nhân"
            placeholder="Tìm theo tên hoặc số điện thoại"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        {error ? <p className="form-error">{error}</p> : null}
        {loading ? <p className="admin-empty">Đang tải danh sách…</p> : null}
        {!loading && patients.length === 0 ? (
          <p className="admin-empty">Chưa có bệnh nhân phù hợp.</p>
        ) : null}

        {patients.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Điện thoại</th>
                  <th>Email</th>
                  <th className="data-table__col--center">Trạng thái</th>
                  <th className="data-table__col--center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <strong>{patient.full_name}</strong>
                    </td>
                    <td>{patient.phone}</td>
                    <td>{patient.email || "—"}</td>
                    <td className="data-table__col--center">
                      <span
                        className={
                          patient.is_active
                            ? "status-chip status-chip--on"
                            : "status-chip status-chip--off"
                        }
                      >
                        {patient.is_active ? "Hoạt động" : "Ngừng"}
                      </span>
                    </td>
                    <td className="data-table__actions data-table__col--center">
                      <IconButton label="Sửa" onClick={() => openEdit(patient)}>
                        <IconEdit />
                      </IconButton>
                      {patient.is_active ? (
                        <IconButton
                          label="Ngừng hoạt động"
                          tone="danger"
                          onClick={() => void onDeactivate(patient.id)}
                        >
                          <IconDeactivate />
                        </IconButton>
                      ) : (
                        <IconButton
                          label="Kích hoạt lại"
                          tone="muted"
                          onClick={() => void onActivate(patient.id)}
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
        title={editingId === null ? "Thêm bệnh nhân" : "Cập nhật hồ sơ"}
        description={
          editingId === null
            ? "Nhập họ, tên và thông tin bắt buộc để tạo hồ sơ mới."
            : "Chỉnh sửa rồi lưu; để trống email sẽ giữ giá trị cũ."
        }
        onClose={closeModal}
      >
        <form className="admin-form" onSubmit={onSubmit}>
          <div className="name-fields">
            <label>
              Họ
              <input
                required
                autoFocus
                value={form.family_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    family_name: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Tên
              <input
                required
                value={form.given_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    given_name: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <label>
            Số điện thoại
            <input
              required
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
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
