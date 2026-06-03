import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CursorPaginatedApiResponse,
  OffsetPaginatedApiResponse,
} from "@/types/pagination.types";

// ---------------------------------------------------------------------------
// Enums (must match backend)
// ---------------------------------------------------------------------------
export const INTERVIEW_MODES = ["VIRTUAL", "ONSITE", "TELEPHONIC"] as const;
export type InterviewMode = (typeof INTERVIEW_MODES)[number];

export const INTERVIEW_MODE_LABELS: Record<InterviewMode, string> = {
  VIRTUAL: "Virtual",
  ONSITE: "On-site",
  TELEPHONIC: "Telephonic",
};

export const INTERVIEW_STATUSES = [
  "SCHEDULED",
  "RESCHEDULED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  SCHEDULED: "Scheduled",
  RESCHEDULED: "Rescheduled",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "No show",
};

export const INTERVIEW_PANEL_ROLES = [
  "PRIMARY_INTERVIEWER",
  "PANELIST",
  "OBSERVER",
] as const;
export type InterviewPanelRole = (typeof INTERVIEW_PANEL_ROLES)[number];

export const INTERVIEW_PANEL_ROLE_LABELS: Record<InterviewPanelRole, string> = {
  PRIMARY_INTERVIEWER: "Primary interviewer",
  PANELIST: "Panelist",
  OBSERVER: "Observer",
};

export const INTERVIEW_SORT_FIELDS = [
  "created_at",
  "updated_at",
  "scheduled_start_at",
  "scheduled_end_at",
  "completed_at",
  "interview_status",
] as const;

export type InterviewsSortBy = (typeof INTERVIEW_SORT_FIELDS)[number];

// ---------------------------------------------------------------------------
// DTO-aligned Types
// ---------------------------------------------------------------------------
export interface InterviewPanelMemberResponse {
  id: string;
  interview_id: string;
  user_id: string;
  role_in_panel: InterviewPanelRole;
  created_at: string;
  updated_at: string;
}

export interface InterviewResponse {
  id: string;
  application_id: string;
  interview_round_id: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  interview_mode: InterviewMode;
  meeting_link: string | null;
  location_details: string | null;
  interview_status: InterviewStatus;
  scheduled_by_user_id: string;
  rescheduled_from_interview_id: string | null;
  reschedule_reason: string | null;
  cancel_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  panel_members?: InterviewPanelMemberResponse[];
}

export interface InterviewPanelMemberInput {
  user_id: string;
  role_in_panel: InterviewPanelRole;
}

export interface ScheduleInterviewPayload {
  application_id: string;
  interview_round_id: string;
  scheduled_start_at: string; // ISO8601
  scheduled_end_at: string; // ISO8601
  interview_mode: InterviewMode;
  meeting_link?: string;
  location_details?: string;
  members?: InterviewPanelMemberInput[];
}

export interface RescheduleInterviewPayload {
  scheduled_start_at: string; // ISO8601
  scheduled_end_at: string; // ISO8601
  reschedule_reason: string;
  meeting_link?: string;
  location_details?: string;
}

export interface CancelInterviewPayload {
  cancel_reason: string;
}

export interface ReplaceInterviewPanelMembersPayload {
  members: InterviewPanelMemberInput[];
}

export interface ListInterviewsParams {
  // Offset pagination
  page?: number;
  limit?: number;

  // Cursor pagination
  cursor?: string;

  // Filters
  application_id?: string;
  interview_round_id?: string;
  interview_status?: InterviewStatus;
  interview_mode?: InterviewMode;
  scheduled_from?: string;
  scheduled_to?: string;
  interviewer_user_id?: string;

  // Sorting
  sort_by?: InterviewsSortBy;
  sort_order?: "asc" | "desc";
}

export type ListInterviewsResponse =
  | OffsetPaginatedApiResponse<InterviewResponse>
  | CursorPaginatedApiResponse<InterviewResponse>;

export type InterviewDetailResponse = ApiSuccessResponse<InterviewResponse>;
