/** Ghép họ + tên theo thứ tự tiếng Việt. */
export function joinFullName(familyName: string, givenName: string): string {
  return `${familyName.trim()} ${givenName.trim()}`.trim();
}

/** Tách full_name thành họ (phần đầu) và tên (phần còn lại). */
export function splitFullName(fullName: string): {
  family_name: string;
  given_name: string;
} {
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return { family_name: "", given_name: "" };
  }
  const space = cleaned.indexOf(" ");
  if (space === -1) {
    return { family_name: cleaned, given_name: "" };
  }
  return {
    family_name: cleaned.slice(0, space),
    given_name: cleaned.slice(space + 1),
  };
}
