"use client";

import { Chip } from "@mui/material";

import {
  OFFER_STATUS_LABELS,
  type OfferStatus,
} from "@/features/offers/types/offer.types";

export function OfferStatusChip({ status }: { status: OfferStatus }) {
  const color =
    status === "ACCEPTED"
      ? "success"
      : status === "DECLINED" || status === "CANCELLED"
        ? "error"
        : status === "EXPIRED"
          ? "warning"
          : status === "SENT"
            ? "info"
            : "default";

  return (
    <Chip
      label={OFFER_STATUS_LABELS[status]}
      color={color}
      variant={status === "DRAFT" ? "outlined" : "filled"}
      size="small"
      sx={{ fontWeight: 800 }}
    />
  );
}
