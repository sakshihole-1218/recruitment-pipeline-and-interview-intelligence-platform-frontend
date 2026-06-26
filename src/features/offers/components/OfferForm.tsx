"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import {
  offerSchema,
  type OfferSchemaValues,
} from "@/features/offers/schemas/offer.schema";
import type { OfferFormValues } from "@/features/offers/types/offer.types";

export interface OfferFormProps {
  title: string;
  subtitle?: string;
  applicationLabel?: string;
  defaultValues?: Partial<OfferFormValues>;
  isSubmitting?: boolean;
  disableSubmit?: boolean;
  readOnly?: boolean;
  prerequisiteWarning?: string | null;
  existingOfferWarning?: string | null;
  onCancel?: () => void;
  onSubmit: (
    values: OfferFormValues,
    action: "save_draft" | "send_offer",
  ) => void | Promise<void>;
}

export function OfferForm({
  title,
  subtitle,
  applicationLabel,
  defaultValues,
  isSubmitting,
  disableSubmit,
  readOnly,
  prerequisiteWarning,
  existingOfferWarning,
  onCancel,
  onSubmit,
}: OfferFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OfferSchemaValues>({
    resolver: zodResolver(offerSchema) as unknown as Resolver<OfferSchemaValues>,
    defaultValues: {
      application_id: defaultValues?.application_id ?? "",
      offered_role_title: defaultValues?.offered_role_title ?? "",
      offered_ctc: defaultValues?.offered_ctc ?? 0,
      currency_code: defaultValues?.currency_code ?? "INR",
      joining_bonus: defaultValues?.joining_bonus ?? null,
      probation_period_months: defaultValues?.probation_period_months ?? null,
      expected_joining_date: defaultValues?.expected_joining_date ?? "",
    },
    mode: "onTouched",
  });

  const handleAction =
    (action: "save_draft" | "send_offer") =>
    handleSubmit(async (values) => {
      await onSubmit(
        {
          application_id: values.application_id,
          offered_role_title: values.offered_role_title.trim(),
          offered_ctc: values.offered_ctc,
          currency_code: values.currency_code.trim().toUpperCase(),
          joining_bonus: values.joining_bonus ?? null,
          probation_period_months: values.probation_period_months ?? null,
          expected_joining_date: values.expected_joining_date,
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

        {prerequisiteWarning ? (
          <Alert severity="warning" sx={{ mb: 2.5 }}>
            {prerequisiteWarning}
          </Alert>
        ) : null}

        {existingOfferWarning ? (
          <Alert severity="info" sx={{ mb: 2.5 }}>
            {existingOfferWarning}
          </Alert>
        ) : null}

        {readOnly ? (
          <Alert severity="success" sx={{ mb: 2.5 }}>
            This offer is finalized and can no longer be edited.
          </Alert>
        ) : null}

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              {...register("offered_role_title")}
              label="Offered Role"
              fullWidth
              error={!!errors.offered_role_title}
              helperText={errors.offered_role_title?.message}
              disabled={readOnly}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Controller
              name="offered_ctc"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Offered CTC"
                  fullWidth
                  type="number"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value)}
                  error={!!errors.offered_ctc}
                  helperText={errors.offered_ctc?.message}
                  disabled={readOnly}
                  slotProps={{ htmlInput: { min: 0.01, step: "0.01" } }}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              {...register("currency_code")}
              label="Currency"
              fullWidth
              error={!!errors.currency_code}
              helperText={errors.currency_code?.message}
              disabled={readOnly}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="joining_bonus"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Joining Bonus"
                  fullWidth
                  type="number"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value)}
                  error={!!errors.joining_bonus}
                  helperText={errors.joining_bonus?.message ?? "Optional"}
                  disabled={readOnly}
                  slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="probation_period_months"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Probation Period"
                  fullWidth
                  type="number"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value)}
                  error={!!errors.probation_period_months}
                  helperText={errors.probation_period_months?.message ?? "Months"}
                  disabled={readOnly}
                  slotProps={{ htmlInput: { min: 0, max: 60, step: 1 } }}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              {...register("expected_joining_date")}
              label="Expected Joining Date"
              type="date"
              fullWidth
              error={!!errors.expected_joining_date}
              helperText={errors.expected_joining_date?.message}
              disabled={readOnly}
              slotProps={{ inputLabel: { shrink: true } }}
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

              {!readOnly ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleAction("save_draft")}
                    disabled={disableSubmit || isSubmitting}
                    startIcon={
                      isSubmitting ? <CircularProgress size={18} /> : undefined
                    }
                    sx={{ fontWeight: 800 }}
                  >
                    Save Draft
                  </Button>

                  <Button
                    variant="contained"
                    onClick={handleAction("send_offer")}
                    disabled={disableSubmit || isSubmitting}
                    startIcon={
                      isSubmitting ? <CircularProgress size={18} /> : undefined
                    }
                    sx={{ fontWeight: 800 }}
                  >
                    Send Offer
                  </Button>
                </>
              ) : null}
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
