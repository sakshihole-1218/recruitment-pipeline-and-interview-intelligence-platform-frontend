"use client";

import { ROLES } from "@/constants/roles";
import { getUserRole } from "@/utils/rbac";

export function useInterviewRoundsPermissions() {
  const role = getUserRole();

  // Backend guards allow ADMIN/RECRUITER/HIRING_MANAGER to access controller.
  const canViewInterviewRounds =
    role === ROLES.ADMIN || role === ROLES.RECRUITER || role === ROLES.HIRING_MANAGER;

  // Mutations are ADMIN/RECRUITER.
  const canMutateInterviewRounds = role === ROLES.ADMIN || role === ROLES.RECRUITER;

  return {
    canViewInterviewRounds,
    canCreateInterviewRound: canMutateInterviewRounds,
    canEditInterviewRound: canMutateInterviewRounds,
  };
}
