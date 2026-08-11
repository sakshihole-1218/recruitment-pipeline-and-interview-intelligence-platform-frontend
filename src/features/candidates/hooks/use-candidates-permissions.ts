"use client";

import { ROLES } from "@/constants/roles";
import { getUserRoles, hasAnyRole } from "@/utils/rbac";

// Centralized RBAC for Candidates module
export function useCandidatesPermissions() {
  const roles = getUserRoles();

  // Backend controller allows ADMIN/RECRUITER/HIRING_MANAGER to list & view.
  const canViewCandidates =
    hasAnyRole(roles, [ROLES.ADMIN, ROLES.RECRUITER, ROLES.HIRING_MANAGER]);

  // Backend mutations are ADMIN/RECRUITER.
  const canMutateCandidates = hasAnyRole(roles, [ROLES.ADMIN, ROLES.RECRUITER]);

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
