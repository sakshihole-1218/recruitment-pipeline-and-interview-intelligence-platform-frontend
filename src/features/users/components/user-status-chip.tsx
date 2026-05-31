"use client";

import { alpha, Box, Typography } from "@mui/material";

interface UserStatusChipProps {
  isActive: boolean;
}

export function UserStatusChip({ isActive }: UserStatusChipProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        px: 1.25,
        py: 0.4,
        borderRadius: 10,
        bgcolor: (t) =>
          isActive
            ? alpha(t.palette.success.main, 0.1)
            : alpha(t.palette.action.disabled, 0.12),
        border: "1px solid",
        borderColor: (t) =>
          isActive
            ? alpha(t.palette.success.main, 0.3)
            : alpha(t.palette.text.disabled, 0.2),
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: isActive ? "success.main" : "text.disabled",
          flexShrink: 0,
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          fontSize: "0.72rem",
          color: isActive ? "success.dark" : "text.secondary",
          lineHeight: 1,
        }}
      >
        {isActive ? "Active" : "Inactive"}
      </Typography>
    </Box>
  );
}
