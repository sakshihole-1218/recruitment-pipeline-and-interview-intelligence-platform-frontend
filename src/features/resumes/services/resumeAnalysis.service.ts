import { AxiosError } from "axios";

import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CreateResumeAiAnalysisPayload,
  ListResumeAiAnalysesParams,
  ListResumeAiAnalysesResponse,
  RegenerateResumeAiAnalysisPayload,
  ResumeAiAnalysisResponse,
} from "@/features/resumes/types/resumeAnalysis.types";

const BASE = "/ai-insights/resume-analyses";

export const resumeAnalysisService = {
  listAnalyses: async (
    params: ListResumeAiAnalysesParams,
  ): Promise<ListResumeAiAnalysesResponse> => {
    const response = await apiClient.get<ListResumeAiAnalysesResponse>(BASE, {
      params,
    });
    return response.data;
  },

  getAnalysisById: async (
    id: string,
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    const response = await apiClient.get<ApiSuccessResponse<ResumeAiAnalysisResponse>>(
      `${BASE}/${id}`,
    );
    return response.data;
  },

  getAnalysisByDocumentId: async (
    candidateDocumentId: string,
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    const response = await apiClient.get<ApiSuccessResponse<ResumeAiAnalysisResponse>>(
      `${BASE}/by-document/${candidateDocumentId}`,
    );
    return response.data;
  },

  getAnalysisByDocumentIdOrNull: async (
    candidateDocumentId: string,
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse> | null> => {
    try {
      return await resumeAnalysisService.getAnalysisByDocumentId(candidateDocumentId);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }

      throw error;
    }
  },

  getLatestAnalysisByCandidate: async (
    candidateId: string,
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    const response = await apiClient.get<ApiSuccessResponse<ResumeAiAnalysisResponse>>(
      `${BASE}/candidate/${candidateId}/latest`,
    );
    return response.data;
  },

  createAnalysis: async (
    payload: CreateResumeAiAnalysisPayload,
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<ResumeAiAnalysisResponse>>(
      BASE,
      payload,
    );
    return response.data;
  },

  startAnalysis: async (
    id: string,
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<ResumeAiAnalysisResponse>>(
      `${BASE}/${id}/start`,
    );
    return response.data;
  },

  createAndStartAnalysis: async (
    payload: CreateResumeAiAnalysisPayload,
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    const created = await resumeAnalysisService.createAnalysis(payload);

    try {
      return await resumeAnalysisService.startAnalysis(created.data.id);
    } catch {
      return created;
    }
  },

  reanalyzeById: async (
    id: string,
    payload: RegenerateResumeAiAnalysisPayload = {},
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<ResumeAiAnalysisResponse>>(
      `${BASE}/${id}/regenerate`,
      payload,
    );
    return response.data;
  },

  regenerateByDocumentId: async (
    candidateDocumentId: string,
    payload: RegenerateResumeAiAnalysisPayload = {},
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<ResumeAiAnalysisResponse>>(
      `${BASE}/by-document/${candidateDocumentId}/regenerate`,
      payload,
    );
    return response.data;
  },
};
