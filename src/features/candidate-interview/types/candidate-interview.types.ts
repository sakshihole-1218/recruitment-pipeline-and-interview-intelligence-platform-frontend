import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  AiInterviewQuestionResponse,
  AiInterviewQuestionDetailResponse,
  AiInterviewQuestionsBySessionResponse,
  AiInterviewSessionDetailResponse,
  AiInterviewSessionResponse,
  AiInterviewTranscriptDetailResponse,
  AiInterviewTranscriptEntryResponse,
  AiInterviewTranscriptsBySessionResponse,
  TranscribeAiInterviewAnswerPayload,
  CreateAiInterviewTranscriptPayload,
} from "@/features/ai-interview/types/ai-interview.types";

export const CANDIDATE_INTERVIEW_INVITE_STATUSES = [
  "ACTIVE",
  "USED",
  "EXPIRED",
  "REVOKED",
  "COMPLETED",
] as const;

export type CandidateInterviewInviteStatus =
  (typeof CANDIDATE_INTERVIEW_INVITE_STATUSES)[number];

export interface CandidateInterviewInviteResponse {
  id: string;
  interview_id: string;
  ai_interview_session_id: string;
  candidate_id: string;
  status: CandidateInterviewInviteStatus;
  valid_from: string | null;
  expires_at: string;
  first_accessed_at: string | null;
  last_accessed_at: string | null;
  completed_at: string | null;
  revoked_at: string | null;
  join_url?: string;
  raw_token?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateInterviewAccessInfo {
  invite_id: string;
  invite_status: CandidateInterviewInviteStatus;
  interview_id: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  estimated_duration_minutes: number;
  valid_from: string | null;
  expires_at: string;
  first_accessed_at: string | null;
  last_accessed_at: string | null;
  completed_at: string | null;
  candidate: { full_name: string };
  job_opening: { title: string; code: string };
  interview_round: { round_name: string };
  ai_interview_session: AiInterviewSessionResponse;
  instructions: string[];
}

export type CandidateInterviewAccessResponse =
  ApiSuccessResponse<CandidateInterviewAccessInfo>;
export type CandidateInterviewInviteDetailResponse =
  ApiSuccessResponse<CandidateInterviewInviteResponse | null>;
export type CandidateInterviewInviteMutationResponse =
  ApiSuccessResponse<CandidateInterviewInviteResponse>;

export type CandidateInterviewStartResponse = AiInterviewSessionDetailResponse;
export type CandidateInterviewCompleteResponse =
  ApiSuccessResponse<CandidateInterviewInviteResponse>;

export type CandidateInterviewQuestionsResponse =
  AiInterviewQuestionsBySessionResponse;
export type CandidateInterviewQuestionResponse =
  AiInterviewQuestionDetailResponse;
export type CandidateInterviewTranscriptsResponse =
  AiInterviewTranscriptsBySessionResponse;
export type CandidateInterviewTranscriptResponse =
  AiInterviewTranscriptDetailResponse;

export type CandidateCreateTranscriptPayload = Omit<
  CreateAiInterviewTranscriptPayload,
  "ai_interview_session_id"
>;
export type CandidateTranscribePayload = Omit<
  TranscribeAiInterviewAnswerPayload,
  "ai_interview_session_id"
>;

export interface CreateCandidateInterviewInvitePayload {
  interview_id: string;
}
