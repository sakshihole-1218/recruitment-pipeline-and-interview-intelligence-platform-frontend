import { apiClient } from "@/lib/api-client";

import type {
  CreateLivekitRoomPayload,
  GenerateLivekitTokenPayload,
  LivekitAccessTokenDetailResponse,
  LivekitRoomSessionDetailResponse,
} from "@/features/ai-interview/types/ai-interview.types";

const BASE = "/livekit";
const AI_INTERVIEW_REQUEST_TIMEOUT_MS = 15000;

export const livekitService = {
  createRoom: async (
    payload: CreateLivekitRoomPayload,
  ): Promise<LivekitRoomSessionDetailResponse> => {
    const response = await apiClient.post<LivekitRoomSessionDetailResponse>(
      `${BASE}/rooms`,
      payload,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },

  generateToken: async (
    payload: GenerateLivekitTokenPayload,
  ): Promise<LivekitAccessTokenDetailResponse> => {
    const response = await apiClient.post<LivekitAccessTokenDetailResponse>(
      `${BASE}/token`,
      payload,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },
};
