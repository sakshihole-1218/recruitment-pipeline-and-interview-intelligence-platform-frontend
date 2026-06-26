"use client";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmColor = "primary",
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor?: "primary" | "error" | "success" | "info" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={confirmColor}
          startIcon={
            loading ? <CircularProgress size={16} color="inherit" /> : undefined
          }
          sx={{ fontWeight: 800 }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
