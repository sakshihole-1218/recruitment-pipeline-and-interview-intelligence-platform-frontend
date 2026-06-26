import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CreateOfferPayload,
  DeclineOfferPayload,
  DeleteOfferResponse,
  ListOffersParams,
  ListOffersResponse,
  OfferDetailResponse,
  OfferResponse,
  UpdateOfferPayload,
} from "@/features/offers/types/offer.types";

const BASE = "/offers";

export const offerService = {
  list: async (params: ListOffersParams): Promise<ListOffersResponse> => {
    const response = await apiClient.get<ListOffersResponse>(BASE, { params });
    return response.data;
  },

  getById: async (id: string): Promise<OfferDetailResponse> => {
    const response = await apiClient.get<OfferDetailResponse>(`${BASE}/${id}`);
    return response.data;
  },

  getByApplicationId: async (
    applicationId: string,
  ): Promise<OfferDetailResponse> => {
    const response = await apiClient.get<OfferDetailResponse>(
      `${BASE}/by-application/${applicationId}`,
    );
    return response.data;
  },

  create: async (
    payload: CreateOfferPayload,
  ): Promise<ApiSuccessResponse<OfferResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<OfferResponse>>(
      BASE,
      payload,
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: UpdateOfferPayload,
  ): Promise<ApiSuccessResponse<OfferResponse>> => {
    const response = await apiClient.patch<ApiSuccessResponse<OfferResponse>>(
      `${BASE}/${id}`,
      payload,
    );
    return response.data;
  },

  send: async (id: string): Promise<ApiSuccessResponse<OfferResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<OfferResponse>>(
      `${BASE}/${id}/send`,
    );
    return response.data;
  },

  accept: async (id: string): Promise<ApiSuccessResponse<OfferResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<OfferResponse>>(
      `${BASE}/${id}/accept`,
    );
    return response.data;
  },

  decline: async (
    id: string,
    payload: DeclineOfferPayload,
  ): Promise<ApiSuccessResponse<OfferResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<OfferResponse>>(
      `${BASE}/${id}/decline`,
      payload,
    );
    return response.data;
  },

  cancel: async (id: string): Promise<ApiSuccessResponse<OfferResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<OfferResponse>>(
      `${BASE}/${id}/cancel`,
    );
    return response.data;
  },

  expire: async (id: string): Promise<ApiSuccessResponse<OfferResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<OfferResponse>>(
      `${BASE}/${id}/expire`,
    );
    return response.data;
  },

  softDelete: async (
    id: string,
  ): Promise<ApiSuccessResponse<DeleteOfferResponse>> => {
    const response = await apiClient.delete<
      ApiSuccessResponse<DeleteOfferResponse>
    >(`${BASE}/${id}`);
    return response.data;
  },
};
