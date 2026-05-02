import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const apiClient = axios.create({
  // Use relative path for proxying through Next.js
  baseURL: typeof window !== "undefined" ? "/api/backend/api" : (process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000") + "/api",
  headers: {},
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

// ── Token-refresh state ──────────────────────────────────────────────────────
// We use a flag + queue to prevent multiple concurrent refresh attempts.
// Classic "refresh token with request queue" pattern.
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshSuccess(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers = [];
}

// Response interceptor: on 401, refresh token or logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const detail = error.response?.data?.detail;

    if (error.response?.status === 401) {
      // ── Kicked-out detection ───────────────────────────────────────────
      if (detail === "Session expired or kicked out") {
        const isBrowser = typeof window !== "undefined";
        if (isBrowser) {
          useAuthStore.getState().clearAuth();
          const validLocales = ["tr-TR", "en-US"];
          const segment = window.location.pathname.split("/")[1];
          const locale = validLocales.includes(segment) ? segment : "tr-TR";
          // Only show alert if not already on login page
          if (!window.location.pathname.includes("/auth/login")) {
            alert("Hesabınıza başka bir cihazdan giriş yapıldı. Güvenliğiniz için bu oturum sonlandırıldı.");
            window.location.href = `/${locale}/auth/login`;
          }
          return Promise.reject(error);
        }
      }

      // ── Token refresh with request queue ─────────────────────────────
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        // Record the token in use at the time this 401 was received.
        // If a fresh login happens before the refresh resolves, the store
        // will have a DIFFERENT refresh_token → we must NOT clear auth.
        const refreshTokenAtStart = useAuthStore.getState().refresh_token;

        if (!refreshTokenAtStart) {
          // No stored token at all → go to login
          _redirectToLogin();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          // Another refresh is already in-flight — queue this request.
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(apiClient(originalRequest));
            });
          });
        }

        isRefreshing = true;

        try {
          const isBrowser = typeof window !== "undefined";
          const res = await axios.post(
            isBrowser
              ? "/api/backend/api/auth/refresh"
              : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/api/auth/refresh`,
            { refresh_token: refreshTokenAtStart }
          );

          const { access_token } = res.data;

          // Update store with new access token (keep same refresh_token + user)
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            access_token,
            refreshTokenAtStart
          );

          isRefreshing = false;
          onRefreshSuccess(access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch {
          isRefreshing = false;
          onRefreshFailed();

          // ── Critical guard: only clear auth if the user did NOT already
          // complete a fresh login while the refresh request was in-flight.
          // A fresh login changes the refresh_token stored in zustand.
          const currentRefreshToken = useAuthStore.getState().refresh_token;
          if (currentRefreshToken === refreshTokenAtStart) {
            useAuthStore.getState().clearAuth();
            _redirectToLogin();
          }
          // Otherwise a new login happened → leave the fresh auth intact.
        }
      }
    }
    return Promise.reject(error);
  }
);

function _redirectToLogin() {
  if (typeof window === "undefined") return;
  const validLocales = ["tr-TR", "en-US"];
  const segment = window.location.pathname.split("/")[1];
  const locale = validLocales.includes(segment) ? segment : "tr-TR";
  if (!window.location.pathname.includes("/auth/login")) {
    window.location.href = `/${locale}/auth/login`;
  }
}

export default apiClient;
