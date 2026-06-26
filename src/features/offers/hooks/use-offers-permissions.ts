"use client";

import { ROLES } from "@/constants/roles";
import { getUserRole } from "@/utils/rbac";

export function useOffersPermissions() {
  const role = getUserRole();

  const canViewOffers =
    role === ROLES.ADMIN ||
    role === ROLES.RECRUITER ||
    role === ROLES.HIRING_MANAGER;

  const canMutateOffers = role === ROLES.ADMIN || role === ROLES.RECRUITER;

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
