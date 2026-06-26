"use client";

import { use } from "react";

import { OfferDetailPage } from "@/features/offers/pages/OfferDetailPage";

interface OfferDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default function OfferDetailRoute({ params }: OfferDetailRouteProps) {
  const { id } = use(params);
  return <OfferDetailPage id={id} />;
}
