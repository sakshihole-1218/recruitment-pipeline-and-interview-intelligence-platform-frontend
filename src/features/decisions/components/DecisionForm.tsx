"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

import {
  decisionSchema,
  type DecisionSchemaValues,
} from "@/features/decisions/schemas/decision.schema";
import type { Resolver } from "react-hook-form";
import {
  DECISION_STATUS_LABELS,
  DECISION_STATUSES,
  type DecisionFormValues,
  type DecisionReadiness,
} from "@/features/decisions/types/decision.types";

export interface DecisionFormProps {
  title: string;
  subtitle?: string;
  applicationLabel?: string;
  defaultValues?: Partial<DecisionFormValues>;
  isSubmitting?: boolean;
  disableSubmit?: boolean;
  readiness?: DecisionReadiness | null;
  onCancel?: () => void;
  onSubmit: (
    values: DecisionFormValues,
    action: "save" | "save_continue",
  ) => void | Promise<void>;
}

export function DecisionForm({
  title,
  subtitle,
  applicationLabel,
  defaultValues,
  isSubmitting,
  disableSubmit,
  readiness,
  onCancel,
  onSubmit,
}: DecisionFormProps) {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<DecisionSchemaValues>({
    resolver: zodResolver(decisionSchema) as unknown as Resolver<DecisionSchemaValues>,
    defaultValues: {
      application_id: defaultValues?.application_id ?? "",
      decision_status: defaultValues?.decision_status ?? "SELECTED",
      decision_reason: defaultValues?.decision_reason ?? "",
      decision_notes: defaultValues?.decision_notes ?? "",
    },
    mode: "onTouched",
  });

  const handleAction =
    (action: "save" | "save_continue") =>
    handleSubmit(async (values) => {
      await onSubmit(
        {
          application_id: values.application_id,
          decision_status: values.decision_status,
          decision_reason: values.decision_reason,
          decision_notes: values.decision_notes,
        },
        action,
      );
    });

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={0.75}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
          {applicationLabel ? (
            <Typography variant="body2" color="text.secondary">
              Application: {applicationLabel}
            </Typography>
          ) : null}
        </Stack>

        <Divider sx={{ my: 3 }} />

        {readiness && readiness.missingItems.length > 0 ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
              Decision prerequisites are incomplete
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {readiness.missingItems.map((item) => (
                <li key={item}>
                  <Typography variant="body2">{item}</Typography>
                </li>
              ))}
            </Box>
          </Alert>
        ) : null}

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="decision_status"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Decision Status"
                  fullWidth
                  error={!!errors.decision_status}
                  helperText={errors.decision_status?.message}
                >
                  {DECISION_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {DECISION_STATUS_LABELS[status]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              {...register("decision_reason")}
              label="Decision Reason"
              fullWidth
              multiline
              minRows={4}
              error={!!errors.decision_reason}
              helperText={
                errors.decision_reason?.message ??
                "Required for rejected or hold decisions."
              }
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              {...register("decision_notes")}
              label="Decision Notes"
              fullWidth
              multiline
              minRows={5}
              error={!!errors.decision_notes}
              helperText={errors.decision_notes?.message ?? "Optional"}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ justifyContent: "flex-end" }}
            >
              {onCancel ? (
                <Button onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              ) : null}

              <Button
                variant="outlined"
                onClick={handleAction("save_continue")}
                disabled={disableSubmit || isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={18} /> : undefined}
                sx={{ fontWeight: 800 }}
              >
                Save & Continue
              </Button>

              <Button
                variant="contained"
                onClick={handleAction("save")}
                disabled={disableSubmit || isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={18} /> : undefined}
                sx={{ fontWeight: 800 }}
              >
                Save
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
