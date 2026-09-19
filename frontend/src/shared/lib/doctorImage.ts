import type { SyntheticEvent } from "react";

import clinicPlaceholder from "../../assets/images/clinic-placeholder.svg";

export function getDoctorImage(image?: string | null): string {
  return image?.trim() || clinicPlaceholder;
}

export function handleDoctorImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = clinicPlaceholder;
}
