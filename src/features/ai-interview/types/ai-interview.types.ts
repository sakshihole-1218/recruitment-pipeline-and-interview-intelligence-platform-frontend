import type { ApiSuccessResponse } from "@/types/api.types";

export const AI_INTERVIEW_SESSION_STATUSES = [
  "PENDING",
  "READY",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export type AiInterviewSessionStatus =
  (typeof AI_INTERVIEW_SESSION_STATUSES)[number];

export const LIVEKIT_ROOM_STATUSES = [
  "CREATED",
  "ACTIVE",
  "ENDED",
  "FAILED",
] as const;

export type LivekitRoomStatus = (typeof LIVEKIT_ROOM_STATUSES)[number];

export const LIVEKIT_PARTICIPANT_TYPES = [
  "CANDIDATE",
  "AI_AGENT",
  "REVIEWER",
  "ADMIN",
] as const;

export type LivekitParticipantType =
  (typeof LIVEKIT_PARTICIPANT_TYPES)[number];

export interface AiInterviewSessionResponse {
  id: string;
  interview_id: string;
  application_id: string;
  candidate_id: string;
  resume_analysis_id: string | null;
  session_code: string;
  session_status: AiInterviewSessionStatus;
  livekit_room_name: string | null;
  question_generation_status: string;
  feedback_generation_status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  deleted_by_user_id: string | null;
}

export interface CreateAiInterviewSessionPayload {
  interview_id: string;
  resume_analysis_id?: string;
}

export interface LivekitRoomSessionResponse {
  id: string;
  ai_interview_session_id: string;
  interview_id: string;
  application_id: string;
  candidate_id: string;
  room_name: string;
  room_status: LivekitRoomStatus;
  candidate_identity: string | null;
  ai_agent_identity: string | null;
  room_started_at: string | null;
  room_ended_at: string | null;
  last_webhook_event_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  deleted_by_user_id: string | null;
}

export interface CreateLivekitRoomPayload {
  ai_interview_session_id: string;
}

export interface LivekitAccessTokenResponse {
  token: string;
  room_name: string;
  identity: string;
  display_name: string;
  participant_type: LivekitParticipantType;
  livekit_url: string;
}

export interface GenerateLivekitTokenPayload {
  ai_interview_session_id: string;
  participant_type: LivekitParticipantType;
  identity?: string;
  display_name?: string;
}

export interface AiInterviewRoomLaunchContext {
  interviewId: string;
  sessionId: string;
  roomName: string;
  token: string;
  livekitUrl: string;
  participantIdentity: string;
  participantDisplayName: string;
}

export interface AiInterviewRoomConnection {
  session: AiInterviewSessionResponse;
  room: LivekitRoomSessionResponse;
  token: LivekitAccessTokenResponse;
}

export const AI_INTERVIEW_QUESTION_TYPES = [
  "RESUME",
  "SKILL",
  "EXPERIENCE",
  "PROJECT",
  "BEHAVIORAL",
  "TECHNICAL",
  "FOLLOW_UP",
] as const;

export type AiInterviewQuestionType =
  (typeof AI_INTERVIEW_QUESTION_TYPES)[number];

export const AI_INTERVIEW_DIFFICULTY_LEVELS = [
  "EASY",
  "MEDIUM",
  "HARD",
] as const;

export type AiInterviewDifficultyLevel =
  (typeof AI_INTERVIEW_DIFFICULTY_LEVELS)[number];

export interface AiInterviewQuestionResponse {
  id: string;
  ai_interview_session_id: string;
  parent_question_id: string | null;
  question_text: string;
  question_type: AiInterviewQuestionType;
  topic: string;
  difficulty_level: AiInterviewDifficultyLevel;
  sequence_number: number;
  is_follow_up: boolean;
  generated_from: string;
  expected_answer_keywords: string[] | null;
  asked_at: string | null;
  answered_at: string | null;
  is_answered: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  deleted_by_user_id: string | null;
}

export interface GenerateFollowUpQuestionPayload {
  ai_interview_session_id: string;
  ai_interview_question_id: string;
  candidate_answer: string;
}

export interface GenerateFollowUpQuestionResponse {
  should_generate_follow_up: boolean;
  follow_up_question?: AiInterviewQuestionResponse | null;
}

export const TRANSCRIPT_SPEAKER_TYPES = [
  "AI_INTERVIEWER",
  "CANDIDATE",
  "SYSTEM",
] as const;

export type TranscriptSpeakerType = (typeof TRANSCRIPT_SPEAKER_TYPES)[number];

export interface AiInterviewTranscriptEntryResponse {
  id: string;
  ai_interview_session_id: string;
  ai_interview_question_id: string | null;
  speaker_type: TranscriptSpeakerType;
  message_text: string;
  sequence_number: number;
  spoken_at: string | null;
  speech_to_text_confidence: number | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  deleted_by_user_id: string | null;
}

export interface CreateAiInterviewTranscriptPayload {
  ai_interview_session_id: string;
  ai_interview_question_id?: string;
  speaker_type: TranscriptSpeakerType;
  message_text: string;
  sequence_number?: number;
}

export interface TranscribeAiInterviewAnswerPayload {
  ai_interview_session_id: string;
  ai_interview_question_id: string;
  audio: Blob;
  file_name?: string;
}

export type AiInterviewSessionDetailResponse =
  ApiSuccessResponse<AiInterviewSessionResponse>;
export type AiInterviewSessionsByInterviewResponse =
  ApiSuccessResponse<AiInterviewSessionResponse[]>;
export type LivekitRoomSessionDetailResponse =
  ApiSuccessResponse<LivekitRoomSessionResponse>;
export type LivekitAccessTokenDetailResponse =
  ApiSuccessResponse<LivekitAccessTokenResponse>;
export type AiInterviewQuestionsBySessionResponse =
  ApiSuccessResponse<AiInterviewQuestionResponse[]>;
export type AiInterviewQuestionDetailResponse =
  ApiSuccessResponse<AiInterviewQuestionResponse>;
export type AiInterviewTranscriptsBySessionResponse =
  ApiSuccessResponse<AiInterviewTranscriptEntryResponse[]>;
export type AiInterviewTranscriptDetailResponse =
  ApiSuccessResponse<AiInterviewTranscriptEntryResponse>;
export type GenerateFollowUpQuestionDetailResponse =
  ApiSuccessResponse<GenerateFollowUpQuestionResponse>;
