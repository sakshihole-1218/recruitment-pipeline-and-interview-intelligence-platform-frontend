import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import { AuthUser } from "@/features/auth/types/auth.types";

export const authStorage = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),

  setAccessToken: (token: string) =>
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),

  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),

  setRefreshToken: (token: string) =>
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token),

  getUser: (): AuthUser | null => {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  setUser: (user: AuthUser) =>
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),

  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
};