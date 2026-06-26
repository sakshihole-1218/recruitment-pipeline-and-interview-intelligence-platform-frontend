"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { offerService } from "@/features/offers/services/offer.service";
import type {
  CreateOfferPayload,
  DeclineOfferPayload,
  ListOffersParams,
  ListOffersResponse,
  UpdateOfferPayload,
} from "@/features/offers/types/offer.types";

export const OFFERS_QUERY_KEYS = {
  all: ["offers"] as const,
  list: (params: ListOffersParams) => ["offers", "list", params] as const,
  detail: (id: string) => ["offers", "detail", id] as const,
  byApplication: (applicationId: string) =>
    ["offers", "application", applicationId] as const,
};

export function useOffers(params: ListOffersParams) {
  return useQuery<ListOffersResponse>({
    queryKey: OFFERS_QUERY_KEYS.list(params),
    queryFn: () => offerService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useOffer(id: string) {
  return useQuery({
    queryKey: OFFERS_QUERY_KEYS.detail(id),
    queryFn: () => offerService.getById(id),
    enabled: !!id,
  });
}

export function useOfferByApplication(applicationId: string) {
  return useQuery({
    queryKey: OFFERS_QUERY_KEYS.byApplication(applicationId),
    queryFn: () => offerService.getByApplicationId(applicationId),
    enabled: !!applicationId,
    retry: false,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOfferPayload) => offerService.create(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: OFFERS_QUERY_KEYS.byApplication(response.data.application_id),
      });
    },
  });
}

export function useUpdateOffer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOfferPayload) => offerService.update(id, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({
        queryKey: OFFERS_QUERY_KEYS.byApplication(response.data.application_id),
      });
    },
  });
}

function useOfferStatusMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  getInvalidateKeys: (variables: TVariables) => readonly (readonly unknown[])[],
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (_response, variables) => {
      await queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEYS.all });

      for (const queryKey of getInvalidateKeys(variables)) {
        await queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}

export function useSendOffer(id: string) {
  return useOfferStatusMutation(
    () => offerService.send(id),
    () => [OFFERS_QUERY_KEYS.detail(id)],
  );
}

export function useAcceptOffer(id: string) {
  return useOfferStatusMutation(
    () => offerService.accept(id),
    () => [OFFERS_QUERY_KEYS.detail(id)],
  );
}

export function useDeclineOffer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeclineOfferPayload) => offerService.decline(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEYS.all });
      await queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEYS.detail(id) });
    },
  });
}

export function useCancelOffer(id: string) {
  return useOfferStatusMutation(
    () => offerService.cancel(id),
    () => [OFFERS_QUERY_KEYS.detail(id)],
  );
}

export function useExpireOffer(id: string) {
  return useOfferStatusMutation(
    () => offerService.expire(id),
    () => [OFFERS_QUERY_KEYS.detail(id)],
  );
}

export function useSendOfferAction() {
  return useOfferStatusMutation(
    (id: string) => offerService.send(id),
    (id) => [OFFERS_QUERY_KEYS.detail(id)],
  );
}

export function useAcceptOfferAction() {
  return useOfferStatusMutation(
    (id: string) => offerService.accept(id),
    (id) => [OFFERS_QUERY_KEYS.detail(id)],
  );
}

export function useDeclineOfferAction() {
  return useOfferStatusMutation(
    (args: { id: string; payload: DeclineOfferPayload }) =>
      offerService.decline(args.id, args.payload),
    (args) => [OFFERS_QUERY_KEYS.detail(args.id)],
  );
}

export function useCancelOfferAction() {
  return useOfferStatusMutation(
    (id: string) => offerService.cancel(id),
    (id) => [OFFERS_QUERY_KEYS.detail(id)],
  );
}

export function useExpireOfferAction() {
  return useOfferStatusMutation(
    (id: string) => offerService.expire(id),
    (id) => [OFFERS_QUERY_KEYS.detail(id)],
  );
}
