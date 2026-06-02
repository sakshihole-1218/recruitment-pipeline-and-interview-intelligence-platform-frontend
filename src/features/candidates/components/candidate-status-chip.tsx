"use client";

import { Chip } from "@mui/material";

export function CandidateStatusChip({ isActive }: { isActive: boolean }) {
  return (
    <Chip
      size="small"
      label={isActive ? "Active" : "Inactive"}
      color={isActive ? "success" : "default"}
      variant={isActive ? "filled" : "outlined"}
      sx={{ fontWeight: 800 }}
    />
  );
}
