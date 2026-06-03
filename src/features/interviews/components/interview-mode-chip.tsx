"use client";

import { Chip } from "@mui/material";

import {
  INTERVIEW_MODE_LABELS,
  type InterviewMode,
} from "@/features/interviews/types/interviews.types";

const colorByMode: Record<InterviewMode, "default" | "primary" | "secondary" | "info"> = {
  VIRTUAL: "info",
  ONSITE: "primary",
  TELEPHONIC: "secondary",
};

export function InterviewModeChip({ mode }: { mode: InterviewMode }) {
  return (
    <Chip
      size="small"
      variant="filled"
      color={colorByMode[mode]}
      label={INTERVIEW_MODE_LABELS[mode] ?? mode}
      sx={{ fontWeight: 900 }}
    />
  );
}
