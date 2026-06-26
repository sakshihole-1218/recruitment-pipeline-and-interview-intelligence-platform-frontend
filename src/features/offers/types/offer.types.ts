import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CursorPaginatedApiResponse,
  OffsetPaginatedApiResponse,
} from "@/types/pagination.types";

export const OFFER_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "DECLINED",
  "EXPIRED",
  "CANCELLED",
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const OFFER_SORT_FIELDS = [
  "created_at",
  "updated_at",
  "offered_at",
  "expected_joining_date",
  "offer_status",
] as const;

export type OfferSortBy = (typeof OFFER_SORT_FIELDS)[number];

export interface OfferResponse {
  id: string;
  application_id: string;
  offered_role_title: string;
  offered_ctc: string;
  joining_bonus: string | null;
  currency_code: string | null;
  probation_period_months: number | null;
  expected_joining_date: string;
  offer_status: OfferStatus;
  offered_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOfferPayload {
  application_id: string;
  offered_role_title: string;
  offered_ctc: number;
  joining_bonus?: number;
  currency_code?: string;
  probation_period_months?: number;
  expected_joining_date: string;
}

export interface UpdateOfferPayload {
  offered_role_title?: string;
  offered_ctc?: number;
  joining_bonus?: number;
  currency_code?: string;
  probation_period_months?: number;
  expected_joining_date?: string;
}

export interface DeclineOfferPayload {
  decline_reason: string;
}

export interface ListOffersParams {
  page?: number;
  limit?: number;
  cursor?: string;
  application_id?: string;
  offer_status?: OfferStatus;
  expected_joining_from?: string;
  expected_joining_to?: string;
  offered_from?: string;
  offered_to?: string;
  sort_by?: OfferSortBy;
  sort_order?: "asc" | "desc";
}

export type ListOffersResponse =
  | OffsetPaginatedApiResponse<OfferResponse>
  | CursorPaginatedApiResponse<OfferResponse>;

export type OfferDetailResponse = ApiSuccessResponse<OfferResponse>;

export interface DeleteOfferResponse {
  id: string;
}

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

export interface OfferFormValues {
  application_id: string;
  offered_role_title: string;
  offered_ctc: number;
  currency_code: string;
  joining_bonus: number | null;
  probation_period_months: number | null;
  expected_joining_date: string;
}

export interface OfferSummaryMetric {
  label: string;
  value: number;
  tone: "default" | "info" | "success" | "warning" | "error";
}
