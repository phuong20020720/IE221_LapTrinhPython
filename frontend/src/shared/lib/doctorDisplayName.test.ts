import { describe, expect, it } from "vitest";

import { getDoctorDisplayName } from "./doctorDisplayName";

describe("getDoctorDisplayName", () => {
  it("joins credentials and name", () => {
    expect(getDoctorDisplayName({ credentials: "BS.CKII", full_name: "Nguyễn Minh An" }))
      .toBe("BS.CKII Nguyễn Minh An");
  });

  it("does not duplicate credentials already stored in the name", () => {
    expect(getDoctorDisplayName({ credentials: "BS", full_name: "BS Nguyễn Minh An" }))
      .toBe("BS Nguyễn Minh An");
  });

  it("keeps an existing doctor title instead of adding another credential", () => {
    expect(getDoctorDisplayName({ credentials: "Bác sĩ chuyên khoa I", full_name: "Bác sĩ Demo" }))
      .toBe("Bác sĩ Demo");
  });
});
