import { AxiosError } from "axios";

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: unknown;
  statusCode?: number;
}

export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ApiErrorResponse | undefined;

    return responseData?.message || error.message || "Something went wrong";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
};