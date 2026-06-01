"use client";

import { ROLES } from "@/constants/roles";
import { getUserRole } from "@/utils/rbac";

// Centralized RBAC for Job Openings module
export function useJobOpeningsPermissions() {
  const role = getUserRole();

  // Backend allows ADMIN/RECRUITER/HIRING_MANAGER to list/view job openings.
  const canViewJobOpenings =
    role === ROLES.ADMIN || role === ROLES.RECRUITER || role === ROLES.HIRING_MANAGER;

  // Backend mutations are ADMIN/RECRUITER.
  const canMutateJobOpenings = role === ROLES.ADMIN || role === ROLES.RECRUITER;

  return {
    canViewJobOpenings,
    canCreateJobOpening: canMutateJobOpenings,
    canEditJobOpening: canMutateJobOpenings,
    canManageJobOpeningStatus: canMutateJobOpenings,
    canDeleteJobOpening: canMutateJobOpenings,
  };
}
