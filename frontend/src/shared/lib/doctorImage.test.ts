import { describe, expect, it } from "vitest";

import { getDoctorImage, handleDoctorImageError } from "./doctorImage";

describe("doctor image resolution", () => {
  it("keeps the absolute media URL returned by the backend", () => {
    const mediaUrl = "http://localhost:8000/media/doctors/2026/09/avatar.png";

    expect(getDoctorImage(mediaUrl)).toBe(mediaUrl);
  });

  it("uses the clinic placeholder when no image is available", () => {
    expect(getDoctorImage(null)).toBe(getDoctorImage(""));
    expect(getDoctorImage("  ")).toBe(getDoctorImage(""));
  });

  it("falls back to the clinic placeholder when an image cannot load", () => {
    const image = document.createElement("img");
    image.src = "http://localhost:8000/media/missing.png";

    handleDoctorImageError({ currentTarget: image } as never);

    expect(image.src).toBe(getDoctorImage(null));
    expect(image.onerror).toBeNull();
  });
});
