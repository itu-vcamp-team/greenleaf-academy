import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const apiClient = axios.create({
  // Use relative path for proxying through Next.js
  baseURL: typeof window !== "undefined" ? "/api/backend/api" : (process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000") + "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor: Authorization header only.
// Note: FastAPI is configured with redirect_slashes=False, so no need for trailing slash logic.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().access_token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor: on 401, refresh token or logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh_token = useAuthStore.getState().refresh_token;
      if (refresh_token) {
        try {
          const isBrowser = typeof window !== "undefined";
          const res = await axios.post(
            isBrowser
              ? "/api/backend/api/auth/refresh"
              : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/api/auth/refresh`,
            { refresh_token }
          );
          const { access_token } = res.data;
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            access_token,
            refresh_token
          );
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch {
          useAuthStore.getState().clearAuth();
          const validLocales = ["tr-TR", "en-US"];
          const segment = window.location.pathname.split("/")[1];
          const locale = validLocales.includes(segment) ? segment : "tr-TR";
          window.location.href = `/${locale}/auth/login`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
