"use client";

import { use } from "react";

import { OfferFormPage } from "@/features/offers/pages/OfferFormPage";

interface EditOfferRouteProps {
  params: Promise<{ id: string }>;
}

export default function EditOfferRoute({ params }: EditOfferRouteProps) {
  const { id } = use(params);
  return <OfferFormPage mode="edit" id={id} />;
}
