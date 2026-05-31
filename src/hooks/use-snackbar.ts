"use client";

import { useState, useCallback } from "react";

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSuccess = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: "success" });
  }, []);

  const showError = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: "error" });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return { snackbar, showSuccess, showError, closeSnackbar };
}
