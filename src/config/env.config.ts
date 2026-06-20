function normalizeApiBaseUrl(value?: string) {
  const trimmed = String(value || "").trim();
  const fallback = "http://localhost:3000/api";

  return (trimmed || fallback).replace(/\/+$/, "");
}

export const envConfig = {
  apiBaseUrl: normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
};
