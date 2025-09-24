import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,  // use JWT NOT Cookie
});


api.interceptors.request.use((cfg) => {
  const key = import.meta.env.VITE_TOKEN_STORAGE_KEY || "stm_token";
  const t = localStorage.getItem(key);
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default api;
