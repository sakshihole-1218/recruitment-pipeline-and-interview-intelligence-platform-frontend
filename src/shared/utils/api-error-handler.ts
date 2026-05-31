import { AxiosError } from "axios";

interface ApiErrorDetails {
  code?: string;
  details?: unknown;
}

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: ApiErrorDetails;
  statusCode?: number;
}

export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ApiErrorResponse | undefined;

    if (!responseData) {
      return error.message || "Something went wrong";
    }

    const details = responseData.error?.details;
    if (Array.isArray(details) && details.length > 0) {
      return (details as string[]).join(". ");
    }

    return responseData.message || error.message || "Something went wrong";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
};