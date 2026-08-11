import { apiClient } from "@/lib/api-client";

import type {
  CandidateCreateTranscriptPayload,
  CandidateInterviewAccessResponse,
  CandidateInterviewCompleteResponse,
  CandidateInterviewInviteDetailResponse,
  CandidateInterviewInviteMutationResponse,
  CandidateInterviewQuestionResponse,
  CandidateInterviewQuestionsResponse,
  CandidateInterviewStartResponse,
  CandidateInterviewTranscriptResponse,
  CandidateInterviewTranscriptsResponse,
  CandidateTranscribePayload,
  CreateCandidateInterviewInvitePayload,
} from "@/features/candidate-interview/types/candidate-interview.types";

const INVITES_BASE = "/candidate-interview-invites";
const ACCESS_BASE = "/candidate-interview-access";

export const candidateInterviewService = {
  getInviteByInterview: async (
    interviewId: string,
  ): Promise<CandidateInterviewInviteDetailResponse> => {
    const response = await apiClient.get<CandidateInterviewInviteDetailResponse>(
      `${INVITES_BASE}/interview/${interviewId}`,
    );
    return response.data;
  },

  createInvite: async (
    payload: CreateCandidateInterviewInvitePayload,
  ): Promise<CandidateInterviewInviteMutationResponse> => {
    const response = await apiClient.post<CandidateInterviewInviteMutationResponse>(
      INVITES_BASE,
      payload,
    );
    return response.data;
  },

  regenerateInvite: async (
    inviteId: string,
  ): Promise<CandidateInterviewInviteMutationResponse> => {
    const response = await apiClient.post<CandidateInterviewInviteMutationResponse>(
      `${INVITES_BASE}/${inviteId}/regenerate`,
    );
    return response.data;
  },

  revokeInvite: async (
    inviteId: string,
  ): Promise<CandidateInterviewInviteMutationResponse> => {
    const response = await apiClient.patch<CandidateInterviewInviteMutationResponse>(
      `${INVITES_BASE}/${inviteId}/revoke`,
    );
    return response.data;
  },

  validateAccess: async (
    token: string,
  ): Promise<CandidateInterviewAccessResponse> => {
    const response = await apiClient.get<CandidateInterviewAccessResponse>(
      `${ACCESS_BASE}/${token}`,
    );
    return response.data;
  },

  startInterview: async (token: string): Promise<CandidateInterviewStartResponse> => {
    const response = await apiClient.post<CandidateInterviewStartResponse>(
      `${ACCESS_BASE}/${token}/start`,
    );
    return response.data;
  },

  completeInterview: async (
    token: string,
  ): Promise<CandidateInterviewCompleteResponse> => {
    const response = await apiClient.post<CandidateInterviewCompleteResponse>(
      `${ACCESS_BASE}/${token}/complete`,
    );
    return response.data;
  },

  getQuestions: async (
    token: string,
  ): Promise<CandidateInterviewQuestionsResponse> => {
    const response = await apiClient.get<CandidateInterviewQuestionsResponse>(
      `${ACCESS_BASE}/${token}/questions`,
    );
    return response.data;
  },

  generateFollowUp: async (
    token: string,
    questionId: string,
  ): Promise<CandidateInterviewQuestionResponse> => {
    const response = await apiClient.post<CandidateInterviewQuestionResponse>(
      `${ACCESS_BASE}/${token}/questions/${questionId}/follow-up`,
    );
    return response.data;
  },

  markQuestionAsked: async (
    token: string,
    questionId: string,
  ): Promise<CandidateInterviewQuestionResponse> => {
    const response = await apiClient.patch<CandidateInterviewQuestionResponse>(
      `${ACCESS_BASE}/${token}/questions/${questionId}/mark-asked`,
    );
    return response.data;
  },

  markQuestionAnswered: async (
    token: string,
    questionId: string,
  ): Promise<CandidateInterviewQuestionResponse> => {
    const response = await apiClient.patch<CandidateInterviewQuestionResponse>(
      `${ACCESS_BASE}/${token}/questions/${questionId}/mark-answered`,
    );
    return response.data;
  },

  getTranscripts: async (
    token: string,
  ): Promise<CandidateInterviewTranscriptsResponse> => {
    const response = await apiClient.get<CandidateInterviewTranscriptsResponse>(
      `${ACCESS_BASE}/${token}/transcripts`,
    );
    return response.data;
  },

  createTranscript: async (
    token: string,
    payload: CandidateCreateTranscriptPayload,
  ): Promise<CandidateInterviewTranscriptResponse> => {
    const response = await apiClient.post<CandidateInterviewTranscriptResponse>(
      `${ACCESS_BASE}/${token}/transcripts`,
      payload,
    );
    return response.data;
  },

  transcribeAnswer: async (
    token: string,
    payload: CandidateTranscribePayload,
  ): Promise<CandidateInterviewTranscriptResponse> => {
    const formData = new FormData();
    formData.append("ai_interview_question_id", payload.ai_interview_question_id);
    formData.append("audio", payload.audio, payload.file_name || "candidate-answer.webm");

    const response = await apiClient.post<CandidateInterviewTranscriptResponse>(
      `${ACCESS_BASE}/${token}/transcribe-answer`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },
};
