"use client";

import { ROLES } from "@/constants/roles";
import { getUserRoles, hasAnyRole } from "@/utils/rbac";

export function useOffersPermissions() {
  const roles = getUserRoles();

  const canViewOffers =
    hasAnyRole(roles, [ROLES.ADMIN, ROLES.RECRUITER, ROLES.HIRING_MANAGER]);

  const canMutateOffers = hasAnyRole(roles, [ROLES.ADMIN, ROLES.RECRUITER]);

  return {
    canViewOffers,
    canCreateOffer: canMutateOffers,
    canEditOffer: canMutateOffers,
    canSendOffer: canMutateOffers,
    canAcceptOffer: canMutateOffers,
    canDeclineOffer: canMutateOffers,
    canCancelOffer: canMutateOffers,
    canExpireOffer: canMutateOffers,
  };
}
