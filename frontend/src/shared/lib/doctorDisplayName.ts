import type { Doctor } from "../api/doctors";

type DoctorName = Pick<Doctor, "credentials" | "full_name">;

export function getDoctorDisplayName(doctor: DoctorName): string {
  const name = doctor.full_name.trim();
  const credentials = doctor.credentials.trim();
  const normalizedName = name.toLocaleLowerCase("vi");
  const hasTitlePrefix = /^(?:bs\.?|bác sĩ|ts\.?\s*bs\.?|ths\.?\s*bs\.?)\s/.test(normalizedName);
  if (!credentials || hasTitlePrefix || normalizedName.startsWith(`${credentials.toLocaleLowerCase("vi")} `)) {
    return name;
  }
  return `${credentials} ${name}`;
}
