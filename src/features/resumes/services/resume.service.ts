import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type { CandidateDocumentResponse } from "@/features/candidates/types/candidates.types";
import type {
  CreateResumeAiAnalysisPayload,
  ListResumeAiAnalysesParams,
  ListResumeAiAnalysesResponse,
  RegenerateResumeAiAnalysisPayload,
  ResumeAiAnalysisResponse,
} from "@/features/resumes/types/resume.types";

const BASE = "/ai-insights/resume-analyses";

export const resumeService = {
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

  uploadResume: async (
    candidateId: string,
    file: File,
  ): Promise<ApiSuccessResponse<CandidateDocumentResponse>> => {
    const form = new FormData();
    form.append("document_type", "RESUME");
    form.append("is_latest", "true");
    form.append("file", file);

    const response = await apiClient.post<ApiSuccessResponse<CandidateDocumentResponse>>(
      `/candidates/${candidateId}/documents/upload`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return response.data;
  },
};
