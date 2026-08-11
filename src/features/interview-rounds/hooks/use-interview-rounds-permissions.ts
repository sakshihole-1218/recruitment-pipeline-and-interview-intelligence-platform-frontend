"use client";

import { ROLES } from "@/constants/roles";
import { getUserRoles, hasAnyRole } from "@/utils/rbac";

export function useInterviewRoundsPermissions() {
  const roles = getUserRoles();

  // Backend guards allow ADMIN/RECRUITER/HIRING_MANAGER to access controller.
  const canViewInterviewRounds = hasAnyRole(roles, [
    ROLES.ADMIN,
    ROLES.RECRUITER,
    ROLES.HIRING_MANAGER,
  ]);

  // Mutations are ADMIN/RECRUITER.
  const canMutateInterviewRounds = hasAnyRole(roles, [
    ROLES.ADMIN,
    ROLES.RECRUITER,
  ]);

  return {
    canViewInterviewRounds,
    canCreateInterviewRound: canMutateInterviewRounds,
    canEditInterviewRound: canMutateInterviewRounds,
  };
}
