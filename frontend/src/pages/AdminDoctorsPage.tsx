import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  activateDoctor,
  createDoctor,
  deactivateDoctor,
  listAdminDoctors,
  type Doctor,
  type DoctorExpertiseInput,
  updateDoctor,
} from "../shared/api/doctors";

import {
  listSpecialties,
  type Specialty,
} from "../shared/api/specialties";

import {
  IconActivate,
  IconButton,
  IconDeactivate,
  IconEdit,
} from "../shared/ui/IconButton";

import { Modal } from "../shared/ui/Modal";

type DoctorForm = {
  full_name: string;
  phone: string;
  email: string;
  qualification: string;
  experience_years: string;
  bio: string;
  image: string;
  specialty_ids: number[];
  primary_specialty_id: number | null;
};

const emptyForm: DoctorForm = {
  full_name: "",
  phone: "",
  email: "",
  qualification: "",
  experience_years: "0",
  bio: "",
  image: "",
  specialty_ids: [],
  primary_specialty_id: null,
};

export function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] =
    useState<Specialty[]>([]);

  const [form, setForm] =
    useState<DoctorForm>(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [doctorData, specialtyData] =
        await Promise.all([
          listAdminDoctors(),
          listSpecialties(),
        ]);

      setDoctors(doctorData);
      setSpecialties(specialtyData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không tải được dữ liệu bác sĩ.",
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

  function openEdit(doctor: Doctor) {
    const selectedIds =
      doctor.expertises.map(
        (expertise) => expertise.specialty.id,
      );

    const primary =
      doctor.expertises.find(
        (expertise) => expertise.is_primary,
      );

    setEditingId(doctor.id);

    setForm({
      full_name: doctor.full_name,
      phone: doctor.phone,
      email: doctor.email,
      qualification: doctor.qualification,
      experience_years:
        String(doctor.experience_years),
      bio: doctor.bio,
      image: doctor.image,
      specialty_ids: selectedIds,
      primary_specialty_id:
        primary?.specialty.id ?? null,
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

  function toggleSpecialty(
    specialtyId: number,
  ) {
    setForm((current) => {
      const selected =
        current.specialty_ids.includes(
          specialtyId,
        );

      if (selected) {
        const specialtyIds =
          current.specialty_ids.filter(
            (id) => id !== specialtyId,
          );

        return {
          ...current,
          specialty_ids: specialtyIds,
          primary_specialty_id:
            current.primary_specialty_id ===
            specialtyId
              ? null
              : current.primary_specialty_id,
        };
      }

      return {
        ...current,
        specialty_ids: [
          ...current.specialty_ids,
          specialtyId,
        ],
      };
    });
  }

  function selectPrimary(
    specialtyId: number,
  ) {
    setForm((current) => ({
      ...current,

      specialty_ids:
        current.specialty_ids.includes(
          specialtyId,
        )
          ? current.specialty_ids
          : [
              ...current.specialty_ids,
              specialtyId,
            ],

      primary_specialty_id:
        specialtyId,
    }));
  }

  function buildExpertises():
    DoctorExpertiseInput[] {
    return form.specialty_ids.map(
      (specialtyId) => ({
        specialty_id: specialtyId,

        is_primary:
          form.primary_specialty_id ===
          specialtyId,
      }),
    );
  }

  async function onSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setFormError("");

    const years =
      Number(form.experience_years);

    if (
      !Number.isInteger(years) ||
      years < 0
    ) {
      setFormError(
        "Số năm kinh nghiệm phải là số nguyên từ 0 trở lên.",
      );

      return;
    }

    if (
      form.specialty_ids.length > 0 &&
      form.primary_specialty_id === null
    ) {
      setFormError(
        "Hãy chọn một chuyên khoa chính.",
      );

      return;
    }

    setSaving(true);

    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        qualification:
          form.qualification.trim(),
        experience_years: years,
        bio: form.bio.trim(),
        image: form.image.trim(),
        expertises: buildExpertises(),
      };

      if (editingId === null) {
        await createDoctor(payload);
      } else {
        await updateDoctor(
          editingId,
          payload,
        );
      }

      closeModal();
      await load();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Không lưu được bác sĩ.",
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
      await deactivateDoctor(id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không vô hiệu hóa được bác sĩ.",
      );
    }
  }

  async function onActivate(
    id: number,
  ) {
    setError("");

    try {
      await activateDoctor(id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không kích hoạt được bác sĩ.",
      );
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <p className="eyebrow">
            BÁC SĨ
          </p>

          <h1>
            Quản lý bác sĩ
          </h1>

          <p>
            Quản lý thông tin bác sĩ,
            chuyên khoa và chuyên khoa chính.
          </p>
        </div>

        <div className="admin-panel__actions">
          <span className="admin-panel__meta">
            {doctors.length} bác sĩ
          </span>

          <button
            type="button"
            onClick={openCreate}
          >
            Thêm bác sĩ
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
        doctors.length === 0 ? (
          <p className="admin-empty">
            Chưa có bác sĩ.
          </p>
        ) : null}

        {doctors.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bác sĩ</th>

                  <th>Chuyên khoa</th>

                  <th>
                    Kinh nghiệm
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
                {doctors.map(
                  (doctor) => {
                    const primary =
                      doctor.expertises.find(
                        (expertise) =>
                          expertise.is_primary,
                      );

                    return (
                      <tr key={doctor.id}>
                        <td>
                          <strong>
                            {doctor.full_name}
                          </strong>

                          {doctor.qualification ? (
                            <div>
                              {
                                doctor.qualification
                              }
                            </div>
                          ) : null}
                        </td>

                        <td>
                          {primary
                            ?.specialty.name ??
                            doctor.expertises[0]
                              ?.specialty.name ??
                            "—"}

                          {doctor.expertises
                            .length > 1 ? (
                            <small>
                              {" "}
                              +{" "}
                              {doctor.expertises
                                .length - 1}{" "}
                              chuyên khoa
                            </small>
                          ) : null}
                        </td>

                        <td>
                          {
                            doctor.experience_years
                          }{" "}
                          năm
                        </td>

                        <td className="data-table__col--center">
                          <span
                            className={
                              doctor.is_active
                                ? "status-chip status-chip--on"
                                : "status-chip status-chip--off"
                            }
                          >
                            {doctor.is_active
                              ? "Hoạt động"
                              : "Ngừng"}
                          </span>
                        </td>

                        <td className="data-table__actions data-table__col--center">
                          <IconButton
                            label="Sửa"
                            onClick={() =>
                              openEdit(
                                doctor,
                              )
                            }
                          >
                            <IconEdit />
                          </IconButton>

                          {doctor.is_active ? (
                            <IconButton
                              label="Ngừng hoạt động"
                              tone="danger"
                              onClick={() =>
                                void onDeactivate(
                                  doctor.id,
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
                                  doctor.id,
                                )
                              }
                            >
                              <IconActivate />
                            </IconButton>
                          )}
                        </td>
                      </tr>
                    );
                  },
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
            ? "Thêm bác sĩ"
            : "Cập nhật bác sĩ"
        }
        description="Nhập thông tin bác sĩ và lựa chọn chuyên khoa."
        onClose={closeModal}
      >
        <form
          className="admin-form"
          onSubmit={onSubmit}
        >
          <label>
            Họ tên bác sĩ

            <input
              required
              autoFocus
              maxLength={150}
              value={form.full_name}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    full_name:
                      event.target.value,
                  }),
                )
              }
            />
          </label>

          <div className="name-fields">
            <label>
              Số điện thoại

              <input
                maxLength={20}
                value={form.phone}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      phone:
                        event.target.value,
                    }),
                  )
                }
              />
            </label>

            <label>
              Email

              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      email:
                        event.target.value,
                    }),
                  )
                }
              />
            </label>
          </div>

          <label>
            Học vị / bằng cấp

            <input
              maxLength={255}
              placeholder="Ví dụ: Bác sĩ Chuyên khoa I"
              value={
                form.qualification
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    qualification:
                      event.target.value,
                  }),
                )
              }
            />
          </label>

          <label>
            Số năm kinh nghiệm

            <input
              type="number"
              min="0"
              step="1"
              value={
                form.experience_years
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    experience_years:
                      event.target.value,
                  }),
                )
              }
            />
          </label>

          <label>
            Giới thiệu

            <textarea
              rows={5}
              value={form.bio}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    bio:
                      event.target.value,
                  }),
                )
              }
            />
          </label>

          <label>
            Tên file ảnh demo

            <input
              maxLength={255}
              placeholder="doctor-nguyen-van-an.webp"
              value={form.image}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    image:
                      event.target.value,
                  }),
                )
              }
            />
          </label>

          <fieldset className="doctor-expertise-fieldset">
            <legend>
              Chuyên khoa
            </legend>

            {specialties
              .filter(
                (specialty) =>
                  specialty.is_active ||
                  form.specialty_ids.includes(
                    specialty.id,
                  ),
              )
              .map((specialty) => {
                const selected =
                  form.specialty_ids.includes(
                    specialty.id,
                  );

                return (
                  <div
                    className="doctor-expertise-row"
                    key={specialty.id}
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleSpecialty(
                            specialty.id,
                          )
                        }
                      />

                      {specialty.name}
                    </label>

                    <label>
                      <input
                        type="radio"
                        name="primary-specialty"
                        disabled={!selected}
                        checked={
                          form.primary_specialty_id ===
                          specialty.id
                        }
                        onChange={() =>
                          selectPrimary(
                            specialty.id,
                          )
                        }
                      />

                      Chính
                    </label>
                  </div>
                );
              })}
          </fieldset>

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