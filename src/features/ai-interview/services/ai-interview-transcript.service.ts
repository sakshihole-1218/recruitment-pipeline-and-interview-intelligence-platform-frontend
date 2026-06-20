import { apiClient } from "@/lib/api-client";

import type {
  AiInterviewTranscriptDetailResponse,
  AiInterviewTranscriptsBySessionResponse,
  CreateAiInterviewTranscriptPayload,
  TranscribeAiInterviewAnswerPayload,
} from "@/features/ai-interview/types/ai-interview.types";

const BASE = "/ai-interview-transcripts";
const AI_INTERVIEW_REQUEST_TIMEOUT_MS = 15000;

export const aiInterviewTranscriptService = {
  listBySession: async (
    sessionId: string,
  ): Promise<AiInterviewTranscriptsBySessionResponse> => {
    const response = await apiClient.get<AiInterviewTranscriptsBySessionResponse>(
      `${BASE}/session/${sessionId}`,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },

  create: async (
    payload: CreateAiInterviewTranscriptPayload,
  ): Promise<AiInterviewTranscriptDetailResponse> => {
    const response = await apiClient.post<AiInterviewTranscriptDetailResponse>(
      BASE,
      payload,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },

  transcribeAnswer: async (
    payload: TranscribeAiInterviewAnswerPayload,
  ): Promise<AiInterviewTranscriptDetailResponse> => {
    const formData = new FormData();
    formData.append("ai_interview_session_id", payload.ai_interview_session_id);
    formData.append("ai_interview_question_id", payload.ai_interview_question_id);
    formData.append(
      "audio",
      payload.audio,
      payload.file_name || "candidate-answer.webm",
    );

    const response = await apiClient.post<AiInterviewTranscriptDetailResponse>(
      `${BASE}/transcribe-answer`,
      formData,
      {
        timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};
