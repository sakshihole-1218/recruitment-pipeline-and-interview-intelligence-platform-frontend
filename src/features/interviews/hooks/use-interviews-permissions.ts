"use client";

import { ROLES } from "@/constants/roles";
import { getUserRole } from "@/utils/rbac";

export function useInterviewsPermissions() {
  const role = getUserRole();

  // Backend list/detail are accessible to ADMIN/RECRUITER/HIRING_MANAGER/INTERVIEWER
  const canViewInterviews =
    role === ROLES.ADMIN ||
    role === ROLES.RECRUITER ||
    role === ROLES.HIRING_MANAGER ||
    role === ROLES.INTERVIEWER;

  // Schedule / cancel / reschedule are ADMIN/RECRUITER.
  const canMutateInterviews = role === ROLES.ADMIN || role === ROLES.RECRUITER;

  return {
    canViewInterviews,
    canScheduleInterview: canMutateInterviews,
    canRescheduleInterview: canMutateInterviews,
    canCancelInterview: canMutateInterviews,
  };
}
