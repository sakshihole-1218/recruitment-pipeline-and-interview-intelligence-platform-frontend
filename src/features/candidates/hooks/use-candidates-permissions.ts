"use client";

import { ROLES } from "@/constants/roles";
import { getUserRole } from "@/utils/rbac";

// Centralized RBAC for Candidates module
export function useCandidatesPermissions() {
  const role = getUserRole();

  // Backend controller allows ADMIN/RECRUITER/HIRING_MANAGER to list & view.
  const canViewCandidates =
    role === ROLES.ADMIN || role === ROLES.RECRUITER || role === ROLES.HIRING_MANAGER;

  // Backend mutations are ADMIN/RECRUITER.
  const canMutateCandidates = role === ROLES.ADMIN || role === ROLES.RECRUITER;

  return {
    canViewCandidates,
    canCreateCandidate: canMutateCandidates,
    canEditCandidate: canMutateCandidates,
    canToggleCandidateStatus: canMutateCandidates,
    canUploadCandidateDocuments: canMutateCandidates,
    canManageCandidateSkills: canMutateCandidates,
    canDeleteCandidate: canMutateCandidates,
  };
}
