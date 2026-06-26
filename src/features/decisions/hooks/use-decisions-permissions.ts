"use client";

import { ROLES } from "@/constants/roles";
import { getUserRole } from "@/utils/rbac";

export function useDecisionsPermissions() {
  const role = getUserRole();

  const canViewDecisions =
    role === ROLES.ADMIN ||
    role === ROLES.RECRUITER ||
    role === ROLES.HIRING_MANAGER;

  const canMutateDecisions =
    role === ROLES.ADMIN || role === ROLES.HIRING_MANAGER;

  return {
    canViewDecisions,
    canCreateDecision: canMutateDecisions,
    canEditDecision: canMutateDecisions,
    canDeleteDecision: canMutateDecisions,
  };
}
