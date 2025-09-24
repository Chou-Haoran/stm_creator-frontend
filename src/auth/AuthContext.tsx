import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as svcLogin, register as svcRegister, logout as svcLogout } from "../services/auth";

export type User = { email: string; name?: string };

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loginAsGuest: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  loginAsGuest: async () => {},
});

const SESSION_KEY = "demo_session"; // 仅保存 user 信息（token 已由 services/auth 写入 localStorage）
const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || "stm_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  // 登录：调用后端 /auth/login，services 会把 token 写入 localStorage
  const login = async (email: string, password: string) => {
    const data = await svcLogin({ email, password });
    const u: User = data.user ?? { email };
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  };

  // 注册：调用后端 /auth/register，services 会把 token 写入 localStorage
  const signup = async (name: string, email: string, password: string) => {
    const data = await svcRegister({ name, email, password } as any);
    const u: User = data.user ?? { email, name };
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  };

  // 访客登录（本地会话，不请求后端）
  const loginAsGuest = async () => {
    const u: User = { email: "guest@local", name: "Guest" };
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    // 不写 token；若需要可在后端支持匿名 token 再扩展
  };

  // 登出：清 token + 清会话
  const logout = () => {
    try {
      svcLogout(); // 会清理 TOKEN_KEY
    } finally {
      setUser(null);
      localStorage.removeItem(SESSION_KEY);
    }
  };

  // 启动时：如果之前有会话就用；如果只有 token 没有会话，可以在这里尝试 /auth/me 获取用户
  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    } else {
      // 可选：若存在 token 但没有会话，尝试向后端获取当前用户信息
      // if (localStorage.getItem(TOKEN_KEY)) {
      //   api.get('/auth/me').then(res => {
      //     const u: User = res.data;
      //     setUser(u);
      //     localStorage.setItem(SESSION_KEY, JSON.stringify(u));
      //   }).catch(() => {
      //     // token 失效
      //     localStorage.removeItem(TOKEN_KEY);
      //   });
      // }
    }
  }, []);

  const value = useMemo(() => ({ user, login, signup, logout, loginAsGuest }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
