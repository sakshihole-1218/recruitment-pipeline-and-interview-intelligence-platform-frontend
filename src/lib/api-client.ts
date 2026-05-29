import axios from "axios";

import { envConfig } from "@/config/env.config";
import { authStorage } from "@/shared/utils/auth-storage";
import { ROUTES } from "@/shared/constants/routes";

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
    if (error.response?.status === 401) {
      authStorage.clear();

      if (typeof window !== "undefined") {
        window.location.href = ROUTES.LOGIN;
      }
    }

    return Promise.reject(error);
  },
);