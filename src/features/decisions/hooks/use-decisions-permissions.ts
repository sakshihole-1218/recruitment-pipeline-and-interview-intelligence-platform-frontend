"use client";

import { ROLES } from "@/constants/roles";
import { getUserRoles, hasAnyRole } from "@/utils/rbac";

export function useDecisionsPermissions() {
  const roles = getUserRoles();

  const canViewDecisions =
    hasAnyRole(roles, [ROLES.ADMIN, ROLES.RECRUITER, ROLES.HIRING_MANAGER]);

  const canMutateDecisions = hasAnyRole(roles, [ROLES.ADMIN, ROLES.HIRING_MANAGER]);

  return {
    canViewDecisions,
    canCreateDecision: canMutateDecisions,
    canEditDecision: canMutateDecisions,
    canDeleteDecision: canMutateDecisions,
  };
}
