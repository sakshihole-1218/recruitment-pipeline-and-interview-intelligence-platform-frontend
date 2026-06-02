"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  candidatesService,
  type ListCandidatesResponse,
} from "@/features/candidates/services/candidates.service";
import type {
  CreateCandidatePayload,
  ListCandidatesParams,
  UpdateCandidatePayload,
  UploadCandidateDocumentPayload,
  UpsertCandidateSkillsPayload,
} from "@/features/candidates/types/candidates.types";

export const CANDIDATES_QUERY_KEYS = {
  all: ["candidates"] as const,
  list: (params: ListCandidatesParams) => ["candidates", "list", params] as const,
  detail: (id: string) => ["candidates", "detail", id] as const,
  skills: (id: string) => ["candidates", "skills", id] as const,
  documents: (id: string) => ["candidates", "documents", id] as const,
};

export function useCandidates(params: ListCandidatesParams) {
  return useQuery<ListCandidatesResponse>({
    queryKey: CANDIDATES_QUERY_KEYS.list(params),
    queryFn: () => candidatesService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: CANDIDATES_QUERY_KEYS.detail(id),
    queryFn: () => candidatesService.getById(id),
    enabled: !!id,
  });
}

export function useCandidateSkills(id: string) {
  return useQuery({
    queryKey: CANDIDATES_QUERY_KEYS.skills(id),
    queryFn: () => candidatesService.listSkills(id),
    enabled: !!id,
  });
}

export function useCandidateDocuments(id: string) {
  return useQuery({
    queryKey: CANDIDATES_QUERY_KEYS.documents(id),
    queryFn: () => candidatesService.listDocuments(id),
    enabled: !!id,
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCandidatePayload) => candidatesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CANDIDATES_QUERY_KEYS.all });
    },
  });
}

export function useUpdateCandidate(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCandidatePayload) => candidatesService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CANDIDATES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CANDIDATES_QUERY_KEYS.detail(id) });
    },
  });
}

export function useSoftDeleteCandidate(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => candidatesService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CANDIDATES_QUERY_KEYS.all });
    },
  });
}

export function useUpsertCandidateSkills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { candidateId: string; payload: UpsertCandidateSkillsPayload }) =>
      candidatesService.upsertSkills(args.candidateId, args.payload),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: CANDIDATES_QUERY_KEYS.skills(vars.candidateId) });
      queryClient.invalidateQueries({ queryKey: CANDIDATES_QUERY_KEYS.detail(vars.candidateId) });
      queryClient.invalidateQueries({ queryKey: CANDIDATES_QUERY_KEYS.all });
    },
  });
}

export function useUploadCandidateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { candidateId: string; payload: UploadCandidateDocumentPayload }) =>
      candidatesService.uploadDocument(args.candidateId, args.payload),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: CANDIDATES_QUERY_KEYS.documents(vars.candidateId) });
      queryClient.invalidateQueries({ queryKey: CANDIDATES_QUERY_KEYS.detail(vars.candidateId) });
    },
  });
}

export function useMarkLatestResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { candidateId: string; documentId: string }) =>
      candidatesService.markLatestResume(args.candidateId, args.documentId),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: CANDIDATES_QUERY_KEYS.documents(vars.candidateId) });
    },
  });
}
