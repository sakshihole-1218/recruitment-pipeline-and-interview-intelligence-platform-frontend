"use client";

import { Chip } from "@mui/material";

import {
  INTERVIEW_ROUND_TYPE_LABELS,
  type InterviewRoundType,
} from "@/features/interview-rounds/types/interview-rounds.types";

const colorByType: Record<InterviewRoundType, "default" | "primary" | "secondary" | "success" | "warning" | "info"> = {
  SCREENING: "info",
  TECHNICAL: "primary",
  MANAGERIAL: "secondary",
  HR: "success",
  ASSIGNMENT: "warning",
  FINAL: "primary",
};

export function InterviewRoundTypeChip({ type }: { type: InterviewRoundType }) {
  return (
    <Chip
      size="small"
      variant="filled"
      color={colorByType[type]}
      label={INTERVIEW_ROUND_TYPE_LABELS[type] ?? type}
      sx={{ fontWeight: 900 }}
    />
  );
}
