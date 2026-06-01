"use client";

import { Chip } from "@mui/material";

import {
  JOB_OPENING_STATUS_LABELS,
  type JobOpeningStatus,
} from "@/features/job-openings/types/job-openings.types";

function getStatusColor(status: JobOpeningStatus):
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "error" {
  switch (status) {
    case "OPEN":
      return "success";
    case "DRAFT":
      return "default";
    case "ON_HOLD":
      return "warning";
    case "CLOSED":
      return "default";
    case "CANCELLED":
      return "error";
    default:
      return "default";
  }
}

export function JobOpeningStatusChip({ status }: { status: JobOpeningStatus }) {
  const color = getStatusColor(status);

  return (
    <Chip
      label={JOB_OPENING_STATUS_LABELS[status] ?? status}
      size="small"
      color={color}
      variant={status === "DRAFT" || status === "CLOSED" ? "outlined" : "filled"}
      sx={{ fontWeight: 800 }}
    />
  );
}
