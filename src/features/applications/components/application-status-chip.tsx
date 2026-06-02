"use client";

import { Chip } from "@mui/material";

import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from "@/features/applications/types/applications.types";

function getStatusColor(status: ApplicationStatus):
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error" {
  switch (status) {
    case "ACTIVE":
      return "primary";
    case "HIRED":
      return "success";
    case "ON_HOLD":
      return "warning";
    case "REJECTED":
    case "WITHDRAWN":
      return "error";
    case "CLOSED":
    default:
      return "default";
  }
}

export function ApplicationStatusChip({
  status,
  size = "small",
}: {
  status: ApplicationStatus;
  size?: "small" | "medium";
}) {
  return (
    <Chip
      size={size}
      label={APPLICATION_STATUS_LABELS[status]}
      color={getStatusColor(status)}
      variant={status === "CLOSED" ? "outlined" : "filled"}
      sx={{ fontWeight: 900 }}
    />
  );
}
