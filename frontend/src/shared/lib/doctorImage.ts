import clinicPlaceholder from "../../assets/images/clinic-placeholder.svg";
// import doctorNguyenVanAn from "../../assets/images/doctor-nguyen-van-an.webp";

const doctorImages: Record<string, string> = {
//   "doctor-nguyen-van-an.webp": doctorNguyenVanAn,
};

export function getDoctorImage(image: string): string {
  return doctorImages[image] ?? clinicPlaceholder;
}