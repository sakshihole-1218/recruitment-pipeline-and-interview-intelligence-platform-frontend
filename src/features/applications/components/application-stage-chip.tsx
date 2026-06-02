"use client";

import { Chip } from "@mui/material";

import {
  APPLICATION_STAGE_LABELS,
  type ApplicationCurrentStage,
} from "@/features/applications/types/applications.types";

function getStageColor(stage: ApplicationCurrentStage):
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error" {
  switch (stage) {
    case "APPLIED":
      return "default";
    case "SCREENING":
      return "secondary";
    case "SHORTLISTED":
      return "primary";
    case "INTERVIEW":
      return "primary";
    case "DECISION":
      return "warning";
    case "OFFER":
      return "warning";
    case "HIRED":
      return "success";
    case "REJECTED":
    case "WITHDRAWN":
      return "error";
    case "ON_HOLD":
      return "warning";
    default:
      return "default";
  }
}

export function ApplicationStageChip({
  stage,
  size = "small",
}: {
  stage: ApplicationCurrentStage;
  size?: "small" | "medium";
}) {
  return (
    <Chip
      size={size}
      label={APPLICATION_STAGE_LABELS[stage]}
      color={getStageColor(stage)}
      variant={stage === "APPLIED" ? "outlined" : "filled"}
      sx={{ fontWeight: 900 }}
    />
  );
}
