import api from "../utils/api";

export type LoginDTO = { email: string; password: string };

// 兼容后端返回 { token } 或 { accessToken }
export type AuthResp = {
  token?: string;
  accessToken?: string;
  user?: any;
};

const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || "stm_token";

function pickToken(d: AuthResp): string {
  const t = d.token ?? d.accessToken;
  if (!t) throw new Error("No token returned from server");
  return t;
}

export async function login(data: LoginDTO) {
  // baseURL = /api → 实际请求 /api/auth/login
  const res = await api.post<AuthResp>("/auth/login", data);
  const t = pickToken(res.data);
  localStorage.setItem(TOKEN_KEY, t);
  return res.data;
}

export async function register(data: LoginDTO) {
  const res = await api.post<AuthResp>("/auth/register", data);
  const t = pickToken(res.data);
  localStorage.setItem(TOKEN_KEY, t);
  return res.data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}
