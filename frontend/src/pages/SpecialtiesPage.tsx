import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  activateSpecialty,
  createSpecialty,
  deactivateSpecialty,
  listSpecialties,
  type Specialty,
  updateSpecialty,
} from "../shared/api/specialties";

import {
  IconActivate,
  IconButton,
  IconDeactivate,
  IconEdit,
} from "../shared/ui/IconButton";

import { Modal } from "../shared/ui/Modal";

const emptyForm = {
  name: "",
  description: "",
};

export function SpecialtiesPage() {
  const [specialties, setSpecialties] =
    useState<Specialty[]>([]);

  const [form, setForm] =
    useState(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [error, setError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  async function load() {
    setLoading(true);
    setError("");

    try {
      setSpecialties(
        await listSpecialties()
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không tải được danh sách chuyên khoa.",
      );
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

  function openEdit(
    specialty: Specialty,
  ) {
    setEditingId(specialty.id);

    setForm({
      name: specialty.name,
      description:
        specialty.description,
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

  async function onSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      if (editingId === null) {
        await createSpecialty(form);
      } else {
        await updateSpecialty(
          editingId,
          form,
        );
      }

      closeModal();

      await load();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Không lưu được chuyên khoa.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onDeactivate(
    id: number,
  ) {
    setError("");

    try {
      await deactivateSpecialty(id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không vô hiệu hóa được chuyên khoa.",
      );
    }
  }

  async function onActivate(
    id: number,
  ) {
    setError("");

    try {
      await activateSpecialty(id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không kích hoạt được chuyên khoa.",
      );
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <p className="eyebrow">
            CHUYÊN KHOA
          </p>

          <h1>
            Quản lý chuyên khoa
          </h1>

          <p>
            Admin có thể thêm, chỉnh sửa,
            ngừng hoặc kích hoạt lại
            chuyên khoa.
          </p>
        </div>

        <div className="admin-panel__actions">
          <span className="admin-panel__meta">
            {specialties.length} chuyên khoa
          </span>

          <button
            type="button"
            onClick={openCreate}
          >
            Thêm chuyên khoa
          </button>
        </div>
      </header>

      <div className="admin-list admin-list--full">
        {error ? (
          <p className="form-error">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="admin-empty">
            Đang tải danh sách...
          </p>
        ) : null}

        {!loading &&
        specialties.length === 0 ? (
          <p className="admin-empty">
            Chưa có chuyên khoa.
          </p>
        ) : null}

        {specialties.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Tên chuyên khoa
                  </th>

                  <th>
                    Mô tả
                  </th>

                  <th className="data-table__col--center">
                    Trạng thái
                  </th>

                  <th className="data-table__col--center">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {specialties.map(
                  (specialty) => (
                    <tr
                      key={
                        specialty.id
                      }
                    >
                      <td>
                        <strong>
                          {
                            specialty.name
                          }
                        </strong>
                      </td>

                      <td>
                        {specialty.description ||
                          "—"}
                      </td>

                      <td className="data-table__col--center">
                        <span
                          className={
                            specialty.is_active
                              ? "status-chip status-chip--on"
                              : "status-chip status-chip--off"
                          }
                        >
                          {specialty.is_active
                            ? "Hoạt động"
                            : "Ngừng"}
                        </span>
                      </td>

                      <td className="data-table__actions data-table__col--center">
                        <IconButton
                          label="Sửa"
                          onClick={() =>
                            openEdit(
                              specialty,
                            )
                          }
                        >
                          <IconEdit />
                        </IconButton>

                        {specialty.is_active ? (
                          <IconButton
                            label="Ngừng hoạt động"
                            tone="danger"
                            onClick={() =>
                              void onDeactivate(
                                specialty.id,
                              )
                            }
                          >
                            <IconDeactivate />
                          </IconButton>
                        ) : (
                          <IconButton
                            label="Kích hoạt lại"
                            tone="muted"
                            onClick={() =>
                              void onActivate(
                                specialty.id,
                              )
                            }
                          >
                            <IconActivate />
                          </IconButton>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <Modal
        open={modalOpen}
        title={
          editingId === null
            ? "Thêm chuyên khoa"
            : "Cập nhật chuyên khoa"
        }
        description={
          editingId === null
            ? "Nhập thông tin chuyên khoa mới."
            : "Chỉnh sửa thông tin chuyên khoa."
        }
        onClose={closeModal}
      >
        <form
          className="admin-form"
          onSubmit={onSubmit}
        >
          <label>
            Tên chuyên khoa

            <input
              required
              autoFocus
              maxLength={150}
              value={form.name}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    name:
                      event.target.value,
                  }),
                )
              }
            />
          </label>

          <label>
            Mô tả

            <textarea
              rows={5}
              value={
                form.description
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }),
                )
              }
            />
          </label>

          {formError ? (
            <p className="form-error">
              {formError}
            </p>
          ) : null}

          <div className="admin-form__actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Đang lưu..."
                : editingId === null
                  ? "Thêm mới"
                  : "Lưu thay đổi"}
            </button>

            <button
              type="button"
              className="button-secondary"
              onClick={closeModal}
            >
              Hủy
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}