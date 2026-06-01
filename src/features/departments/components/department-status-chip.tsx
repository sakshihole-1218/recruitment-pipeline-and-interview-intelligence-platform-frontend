"use client";

import { Chip } from "@mui/material";

export function DepartmentStatusChip({ isActive }: { isActive: boolean }) {
  return (
    <Chip
      label={isActive ? "Active" : "Inactive"}
      size="small"
      color={isActive ? "success" : "default"}
      variant={isActive ? "filled" : "outlined"}
      sx={{ fontWeight: 700 }}
    />
  );
}
