import { API_BASE_URL } from "./client";

export type UserRole = "ADMIN" | "EMPLOYEE";

export type AuthUser = {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active?: boolean;
};

export type TokenResponse = {
  access: string;
  refresh: string;
  user: AuthUser;
};

const ACCESS_KEY = "medibook_access_token";
const REFRESH_KEY = "medibook_refresh_token";
const USER_KEY = "medibook_auth_user";

export function getAccessToken(): string | null {
  return window.sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return window.sessionStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = window.sessionStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(payload: TokenResponse): void {
  window.sessionStorage.setItem(ACCESS_KEY, payload.access);
  window.sessionStorage.setItem(REFRESH_KEY, payload.refresh);
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

export function clearSession(): void {
  window.sessionStorage.removeItem(ACCESS_KEY);
  window.sessionStorage.removeItem(REFRESH_KEY);
  window.sessionStorage.removeItem(USER_KEY);
}

export async function login(
  username: string,
  password: string,
): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error("Đăng nhập thất bại. Kiểm tra tên đăng nhập và mật khẩu.");
  }
  const data = (await response.json()) as TokenResponse;
  saveSession(data);
  return data;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    return null;
  }
  const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) {
    clearSession();
    return null;
  }
  const data = (await response.json()) as { access: string };
  window.sessionStorage.setItem(ACCESS_KEY, data.access);
  return data.access;
}

export function logout(): void {
  clearSession();
}

export async function authFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (
    !headers.has("Content-Type") &&
    init.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  let access = getAccessToken();
  if (access) {
    headers.set("Authorization", `Bearer ${access}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (response.status !== 401) {
    return response;
  }

  access = await refreshAccessToken();
  if (!access) {
    return response;
  }

  headers.set("Authorization", `Bearer ${access}`);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await authFetch("/auth/me/");
  if (!response.ok) {
    throw new Error("Không lấy được thông tin người dùng.");
  }
  const user = (await response.json()) as AuthUser;
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}
