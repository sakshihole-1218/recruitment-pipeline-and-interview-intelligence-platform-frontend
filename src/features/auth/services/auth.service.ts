import { apiClient } from "@/lib/api-client";
import { ApiSuccessResponse } from "@/types/api.types";
import {
  LoginRequest,
  LoginResponseData,
} from "@/features/auth/types/auth.types";

export const authService = {
  login: async (
    payload: LoginRequest,
  ): Promise<ApiSuccessResponse<LoginResponseData>> => {
    const response = await apiClient.post<ApiSuccessResponse<LoginResponseData>>(
      "/auth/login",
      payload,
    );

    return response.data;
  },

  logout: async (): Promise<ApiSuccessResponse<null>> => {
    const response =
      await apiClient.post<ApiSuccessResponse<null>>("/auth/logout");

    return response.data;
  },

  refreshToken: async (
    refreshToken: string,
  ): Promise<ApiSuccessResponse<LoginResponseData>> => {
    const response = await apiClient.post<ApiSuccessResponse<LoginResponseData>>(
      "/auth/refresh",
      {
        refresh_token: refreshToken,
      },
    );

    return response.data;
  },
};