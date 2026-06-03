"use client";

import { Chip } from "@mui/material";

import {
  INTERVIEW_STATUS_LABELS,
  type InterviewStatus,
} from "@/features/interviews/types/interviews.types";

const colorByStatus: Record<InterviewStatus, "default" | "info" | "warning" | "success" | "error"> = {
  SCHEDULED: "info",
  RESCHEDULED: "warning",
  CANCELLED: "error",
  COMPLETED: "success",
  NO_SHOW: "default",
};

export function InterviewStatusChip({ status }: { status: InterviewStatus }) {
  return (
    <Chip
      size="small"
      variant="filled"
      color={colorByStatus[status]}
      label={INTERVIEW_STATUS_LABELS[status] ?? status}
      sx={{ fontWeight: 800 }}
    />
  );
}
