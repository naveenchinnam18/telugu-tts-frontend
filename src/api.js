export const API = import.meta.env.VITE_API_URL || "http://localhost:1818/api";
const KEY = "tts_token";

export const getToken = () => sessionStorage.getItem(KEY);
export const setToken = (t) => sessionStorage.setItem(KEY, t);
export const clearToken = () => sessionStorage.removeItem(KEY);

export const audioUrl = (id) =>
  `${API}/clips/${id}/audio?t=${encodeURIComponent(getToken() || "")}`;

export async function api(path, options = {}) {
  const headers = { "X-Auth-Token": getToken() || "", ...(options.headers || {}) };
  if (options.body) headers["Content-Type"] = "application/json";
  const res = await fetch(API + path, { ...options, headers });
  if (res.status === 401 && path !== "/auth") {
    clearToken();
    window.dispatchEvent(new Event("tts-logout"));
  }
  return res;
}
