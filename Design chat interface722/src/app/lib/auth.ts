const KEYS = {
  token: "fm_token",
  userId: "fm_user_id",
  username: "fm_username",
};

export function saveAuth(token: string, userId: string, username: string) {
  localStorage.setItem(KEYS.token, token);
  localStorage.setItem(KEYS.userId, userId);
  localStorage.setItem(KEYS.username, username);
}

export function clearAuth() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export function getToken(): string | null {
  return localStorage.getItem(KEYS.token);
}

export function getUsername(): string | null {
  return localStorage.getItem(KEYS.username);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

/* ─── Mock API ─── */

export async function mockLogin(
  username: string,
  password: string
): Promise<{ token: string; userId: string }> {
  await delay(1100);
  if (username === "teststudent" && password === "123456") {
    return { token: "mock-token-abc123", userId: "user-001" };
  }
  throw { status: 401 };
}

export async function mockRegister(
  username: string
): Promise<{ userId: string }> {
  await delay(1100);
  if (username.toLowerCase() === "teststudent") {
    throw { status: 400 };
  }
  return { userId: `user-${Date.now()}` };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
