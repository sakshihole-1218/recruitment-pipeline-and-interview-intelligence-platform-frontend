import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CursorPaginatedApiResponse,
  OffsetPaginatedApiResponse,
} from "@/types/pagination.types";
import type {
  AiInterviewQuestionResponse,
  AiInterviewSessionResponse,
  AiInterviewTranscriptEntryResponse,
} from "@/features/ai-interview/types/ai-interview.types";

export const AI_INTERVIEW_FEEDBACK_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;

export type AiInterviewFeedbackStatus =
  (typeof AI_INTERVIEW_FEEDBACK_STATUSES)[number];

export const AI_INTERVIEW_RECOMMENDATIONS = [
  "STRONGLY_REJECT",
  "REJECT",
  "HOLD",
  "SELECT",
  "STRONGLY_SELECT",
] as const;

export type AiInterviewRecommendation =
  (typeof AI_INTERVIEW_RECOMMENDATIONS)[number];

export const INTERVIEWER_REVIEW_STATUSES = ["DRAFT", "SUBMITTED"] as const;

export type InterviewerReviewStatus =
  (typeof INTERVIEWER_REVIEW_STATUSES)[number];

export const INTERVIEWER_RECOMMENDATIONS = AI_INTERVIEW_RECOMMENDATIONS;

export type InterviewerRecommendation = AiInterviewRecommendation;

export const FEEDBACK_SORT_FIELDS = [
  "created_at",
  "updated_at",
  "generated_at",
  "overall_score",
  "feedback_status",
  "recommendation",
] as const;

export type FeedbackSortBy = (typeof FEEDBACK_SORT_FIELDS)[number];

export interface FeedbackResponse {
  id: string;
  ai_interview_session_id: string;
  application_id: string;
  candidate_id: string;
  resume_analysis_id: string | null;
  technical_score: number | null;
  communication_score: number | null;
  problem_solving_score: number | null;
  experience_relevance_score: number | null;
  overall_score: number | null;
  strengths_summary: string | null;
  weaknesses_summary: string | null;
  detailed_feedback: string | null;
  technical_summary: string | null;
  communication_summary: string | null;
  problem_solving_summary: string | null;
  experience_relevance_summary: string | null;
  recommendation: AiInterviewRecommendation | null;
  feedback_status: AiInterviewFeedbackStatus;
  generated_at: string | null;
  failure_reason: string | null;
  evaluation_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  deleted_by_user_id: string | null;
}

export interface ListFeedbackParams {
  page?: number;
  limit?: number;
  cursor?: string;
  search?: string;
  ai_interview_session_id?: string;
  application_id?: string;
  candidate_id?: string;
  resume_analysis_id?: string;
  feedback_status?: AiInterviewFeedbackStatus;
  recommendation?: AiInterviewRecommendation;
  generated_from?: string;
  generated_to?: string;
  sort_by?: FeedbackSortBy;
  sort_order?: "asc" | "desc";
}

export interface InterviewerReviewResponse {
  id: string;
  ai_interview_session_id: string;
  ai_interview_feedback_id: string | null;
  application_id: string;
  candidate_id: string;
  reviewer_user_id: string;
  technical_score: number | null;
  communication_score: number | null;
  problem_solving_score: number | null;
  culture_fit_score: number | null;
  overall_score: number | null;
  strengths: string | null;
  concerns: string | null;
  detailed_review: string | null;
  interviewer_recommendation: InterviewerRecommendation | null;
  review_status: InterviewerReviewStatus;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  deleted_by_user_id: string | null;
}

export interface CreateInterviewerReviewPayload {
  ai_interview_session_id: string;
  ai_interview_feedback_id?: string;
  reviewer_user_id: string;
  technical_score?: number;
  communication_score?: number;
  problem_solving_score?: number;
  culture_fit_score?: number;
  strengths?: string;
  concerns?: string;
  detailed_review?: string;
  interviewer_recommendation?: InterviewerRecommendation;
  review_status?: InterviewerReviewStatus;
}

export interface UpdateInterviewerReviewPayload {
  technical_score?: number;
  communication_score?: number;
  problem_solving_score?: number;
  culture_fit_score?: number;
  strengths?: string;
  concerns?: string;
  detailed_review?: string;
  interviewer_recommendation?: InterviewerRecommendation;
  review_status?: InterviewerReviewStatus;
}

export interface SubmitInterviewerReviewPayload {
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  culture_fit_score: number;
  strengths?: string;
  concerns?: string;
  detailed_review: string;
  interviewer_recommendation: InterviewerRecommendation;
}

export interface ProctoringRiskSummary {
  ai_interview_session_id: string;
  total_events: number;
  low_count: number;
  medium_count: number;
  high_count: number;
  critical_count: number;
  risk_score: number;
  risk_level: string;
  summary: string;
}

export interface FeedbackEnrichedRow extends FeedbackResponse {
  candidate_name: string;
  candidate_email: string | null;
  job_title: string;
  session_code: string;
}

export interface FeedbackQuestionGroup {
  root: AiInterviewQuestionResponse;
  followUps: AiInterviewQuestionResponse[];
}

export interface FeedbackDetailBundle {
  session: AiInterviewSessionResponse | null;
  questions: AiInterviewQuestionResponse[];
  transcripts: AiInterviewTranscriptEntryResponse[];
  proctoringRiskSummary: ProctoringRiskSummary | null;
}

export const AI_INTERVIEW_FEEDBACK_STATUS_LABELS: Record<
  AiInterviewFeedbackStatus,
  string
> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export const RECOMMENDATION_LABELS: Record<AiInterviewRecommendation, string> = {
  STRONGLY_REJECT: "Strongly reject",
  REJECT: "Reject",
  HOLD: "Hold",
  SELECT: "Select",
  STRONGLY_SELECT: "Strongly select",
};

export const INTERVIEWER_REVIEW_STATUS_LABELS: Record<
  InterviewerReviewStatus,
  string
> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
};

export type ListFeedbackResponse =
  | OffsetPaginatedApiResponse<FeedbackResponse>
  | CursorPaginatedApiResponse<FeedbackResponse>;

export type FeedbackDetailResponse = ApiSuccessResponse<FeedbackResponse>;
export type InterviewerReviewsResponse =
  ApiSuccessResponse<InterviewerReviewResponse[]>;
export type InterviewerReviewDetailResponse =
  ApiSuccessResponse<InterviewerReviewResponse>;
export type ProctoringRiskSummaryResponse =
  ApiSuccessResponse<ProctoringRiskSummary>;
