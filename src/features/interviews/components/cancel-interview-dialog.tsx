"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import {
  cancelInterviewSchema,
  type CancelInterviewFormValues,
} from "@/features/interviews/schemas/interview-cancel.schema";

export interface CancelInterviewDialogProps {
  open: boolean;
  title?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: CancelInterviewFormValues) => void | Promise<void>;
}

export function CancelInterviewDialog({
  open,
  title = "Cancel Interview",
  isSubmitting,
  onClose,
  onSubmit,
}: CancelInterviewDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CancelInterviewFormValues>({
    resolver: zodResolver(cancelInterviewSchema) as unknown as Resolver<CancelInterviewFormValues>,
    defaultValues: { cancel_reason: "" },
    mode: "onTouched",
  });

  const handleClose = () => {
    reset({ cancel_reason: "" });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This will mark the interview as cancelled.
          </Typography>
          <TextField
            label="Cancellation reason"
            fullWidth
            multiline
            minRows={3}
            {...register("cancel_reason")}
            error={!!errors.cancel_reason}
            helperText={errors.cancel_reason?.message}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={!!isSubmitting}>
          Close
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit(onSubmit)}
          disabled={!!isSubmitting}
        >
          {isSubmitting ? "Cancelling..." : "Cancel interview"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
