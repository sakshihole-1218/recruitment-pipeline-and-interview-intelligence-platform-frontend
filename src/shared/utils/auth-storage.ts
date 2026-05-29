import { STORAGE_KEYS } from "@/shared/constants/storage-keys";

export const authStorage = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),

  setAccessToken: (token: string) =>
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),

  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),

  setRefreshToken: (token: string) =>
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token),

  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
};