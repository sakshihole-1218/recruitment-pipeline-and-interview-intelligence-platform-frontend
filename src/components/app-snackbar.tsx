"use client";

import { Alert, Snackbar } from "@mui/material";
import type { SnackbarState } from "@/hooks/use-snackbar";

interface AppSnackbarProps {
  snackbar: SnackbarState;
  onClose: () => void;
}

export function AppSnackbar({ snackbar, onClose }: AppSnackbarProps) {
  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}
