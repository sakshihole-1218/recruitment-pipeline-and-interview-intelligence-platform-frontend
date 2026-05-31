import axios from "axios";

import { envConfig } from "@/config/env.config";
import { authStorage } from "@/utils/auth-storage";
import { ROUTES } from "@/constants/routes";

export const apiClient = axios.create({
  baseURL: envConfig.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const hasToken = !!authStorage.getAccessToken();
    const isOnLoginPage =
      typeof window !== "undefined" &&
      window.location.pathname === ROUTES.LOGIN;

    // Only force-redirect when an authenticated session expires AND we are not
    // already on the login page. This prevents a stale token from causing a
    // page reload while the user is actively trying to sign in.
    if (status === 401 && hasToken && !isOnLoginPage) {
      authStorage.clear();
      window.location.href = ROUTES.LOGIN;
    }

    return Promise.reject(error);
  },
);