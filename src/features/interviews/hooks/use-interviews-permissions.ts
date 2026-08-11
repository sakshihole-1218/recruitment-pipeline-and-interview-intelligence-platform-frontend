"use client";

import { ROLES } from "@/constants/roles";
import { getUserRoles, hasAnyRole } from "@/utils/rbac";

export function useInterviewsPermissions() {
  const roles = getUserRoles();

  // Backend list/detail are accessible to ADMIN/RECRUITER/HIRING_MANAGER/INTERVIEWER
  const canViewInterviews =
    hasAnyRole(roles, [ROLES.ADMIN, ROLES.RECRUITER, ROLES.HIRING_MANAGER, ROLES.INTERVIEWER]);

  // Schedule / cancel / reschedule are ADMIN/RECRUITER.
  const canMutateInterviews = hasAnyRole(roles, [ROLES.ADMIN, ROLES.RECRUITER]);

  return {
    canViewInterviews,
    canScheduleInterview: canMutateInterviews,
    canRescheduleInterview: canMutateInterviews,
    canCancelInterview: canMutateInterviews,
  };
}
