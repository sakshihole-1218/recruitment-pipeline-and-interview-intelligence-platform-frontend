"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

import { getApiErrorMessage } from "@/utils/api-error-handler";

import {
  assignHiringManagerSchema,
  assignRecruiterSchema,
  completeScreeningSchema,
  holdApplicationSchema,
  moveStageSchema,
  rejectApplicationSchema,
  withdrawApplicationSchema,
  type AssignHiringManagerFormValues,
  type AssignRecruiterFormValues,
  type CompleteScreeningFormValues,
  type HoldApplicationFormValues,
  type MoveStageFormValues,
  type RejectApplicationFormValues,
  type WithdrawApplicationFormValues,
} from "@/features/applications/schemas/application.schema";
import {
  APPLICATION_CURRENT_STAGES,
  SCREENING_RESULTS,
  SCREENING_RESULT_LABELS,
  type ApplicationCurrentStage,
} from "@/features/applications/types/applications.types";
import {
  useBulkAssignHiringManager,
  useBulkAssignRecruiter,
  useBulkMoveApplicationStage,
  useCompleteApplicationScreening,
  useHoldApplication,
  useRejectApplication,
  useWithdrawApplication,
} from "@/features/applications/hooks/use-applications";
import { useUsers } from "@/features/users/hooks/use-users";
import { ROLES } from "@/constants/roles";

export type ApplicationActionMode =
  | "reject"
  | "hold"
  | "withdraw"
  | "completeScreening"
  | "assignRecruiter"
  | "assignHiringManager"
  | "moveStage";

export interface ApplicationActionDialogProps {
  open: boolean;
  mode: ApplicationActionMode;
  applicationId: string;
  applicationNumber?: string;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

function titleFor(mode: ApplicationActionMode) {
  switch (mode) {
    case "reject":
      return "Reject application";
    case "hold":
      return "Put application on hold";
    case "withdraw":
      return "Withdraw application";
    case "completeScreening":
      return "Complete screening";
    case "assignRecruiter":
      return "Assign recruiter";
    case "assignHiringManager":
      return "Assign hiring manager";
    case "moveStage":
      return "Move stage";
    default:
      return "Update application";
  }
}

function submitLabelFor(mode: ApplicationActionMode) {
  switch (mode) {
    case "reject":
      return "Reject";
    case "hold":
      return "Put on hold";
    case "withdraw":
      return "Withdraw";
    case "completeScreening":
      return "Complete";
    case "assignRecruiter":
      return "Assign";
    case "assignHiringManager":
      return "Assign";
    case "moveStage":
      return "Move";
    default:
      return "Save";
  }
}

function isDanger(mode: ApplicationActionMode) {
  return mode === "reject" || mode === "withdraw";
}

export function ApplicationActionDialog({
  open,
  mode,
  applicationId,
  applicationNumber,
  onClose,
  onSuccess,
  onError,
}: ApplicationActionDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleClose = () => {
    setSubmitError(null);
    onClose();
  };

  const rejectMutation = useRejectApplication(applicationId);
  const holdMutation = useHoldApplication(applicationId);
  const withdrawMutation = useWithdrawApplication(applicationId);
  const completeMutation = useCompleteApplicationScreening(applicationId);

  const bulkMoveMutation = useBulkMoveApplicationStage();
  const bulkAssignRecruiterMutation = useBulkAssignRecruiter();
  const bulkAssignHiringManagerMutation = useBulkAssignHiringManager();

  const recruitersQuery = useUsers({
    page: 1,
    limit: 100,
    is_active: true,
    role_code: ROLES.RECRUITER,
    sort_by: "first_name",
    sort_order: "ASC",
  });

  const hiringManagersQuery = useUsers({
    page: 1,
    limit: 100,
    is_active: true,
    role_code: ROLES.HIRING_MANAGER,
    sort_by: "first_name",
    sort_order: "ASC",
  });

  const recruiters = (recruitersQuery.data?.data ?? []) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;

  const hiringManagers = (hiringManagersQuery.data?.data ?? []) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;

  const isSubmitting =
    rejectMutation.isPending ||
    holdMutation.isPending ||
    withdrawMutation.isPending ||
    completeMutation.isPending ||
    bulkMoveMutation.isPending ||
    bulkAssignRecruiterMutation.isPending ||
    bulkAssignHiringManagerMutation.isPending;

  const closeBlocked = isSubmitting;

  const rejectForm = useForm<RejectApplicationFormValues>({
    resolver: zodResolver(rejectApplicationSchema) as unknown as Resolver<RejectApplicationFormValues>,
    defaultValues: { rejection_reason: "" },
    mode: "onTouched",
  });

  const holdForm = useForm<HoldApplicationFormValues>({
    resolver: zodResolver(holdApplicationSchema) as unknown as Resolver<HoldApplicationFormValues>,
    defaultValues: { change_reason: "" },
    mode: "onTouched",
  });

  const withdrawForm = useForm<WithdrawApplicationFormValues>({
    resolver: zodResolver(withdrawApplicationSchema) as unknown as Resolver<WithdrawApplicationFormValues>,
    defaultValues: { withdrawal_reason: "" },
    mode: "onTouched",
  });

  const completeForm = useForm<CompleteScreeningFormValues>({
    resolver: zodResolver(completeScreeningSchema) as unknown as Resolver<CompleteScreeningFormValues>,
    defaultValues: {
      screening_score: 0,
      fit_score: 0,
      screening_result: SCREENING_RESULTS[0],
      screening_remarks: "",
    },
    mode: "onTouched",
  });

  const assignRecruiterForm = useForm<AssignRecruiterFormValues>({
    resolver: zodResolver(assignRecruiterSchema) as unknown as Resolver<AssignRecruiterFormValues>,
    defaultValues: { recruiter_user_id: "" },
    mode: "onTouched",
  });

  const assignHiringManagerForm = useForm<AssignHiringManagerFormValues>({
    resolver: zodResolver(assignHiringManagerSchema) as unknown as Resolver<AssignHiringManagerFormValues>,
    defaultValues: { hiring_manager_user_id: "" },
    mode: "onTouched",
  });

  const moveStageForm = useForm<MoveStageFormValues>({
    resolver: zodResolver(moveStageSchema) as unknown as Resolver<MoveStageFormValues>,
    defaultValues: { target_stage: APPLICATION_CURRENT_STAGES[0], change_reason: "" },
    mode: "onTouched",
  });

  async function getValuesIfValid<T extends Record<string, unknown>>(
    form: UseFormReturn<T>,
  ): Promise<T | null> {
    const ok = await form.trigger();
    if (!ok) return null;
    return form.getValues();
  }

  async function submit() {
    setSubmitError(null);

    try {
      if (mode === "reject") {
        const values = await getValuesIfValid(rejectForm);
        if (!values) return;
        await rejectMutation.mutateAsync(values);
      }

      if (mode === "hold") {
        const values = await getValuesIfValid(holdForm);
        if (!values) return;
        await holdMutation.mutateAsync({
          change_reason: values.change_reason?.trim() ? values.change_reason.trim() : undefined,
        });
      }

      if (mode === "withdraw") {
        const values = await getValuesIfValid(withdrawForm);
        if (!values) return;
        await withdrawMutation.mutateAsync(values);
      }

      if (mode === "completeScreening") {
        const values = await getValuesIfValid(completeForm);
        if (!values) return;
        await completeMutation.mutateAsync({
          screening_score: values.screening_score,
          fit_score: values.fit_score,
          screening_result: values.screening_result,
          screening_remarks: values.screening_remarks?.trim()
            ? values.screening_remarks.trim()
            : undefined,
        });
      }

      if (mode === "assignRecruiter") {
        const values = await getValuesIfValid(assignRecruiterForm);
        if (!values) return;
        await bulkAssignRecruiterMutation.mutateAsync({
          application_ids: [applicationId],
          recruiter_user_id: values.recruiter_user_id,
        });
      }

      if (mode === "assignHiringManager") {
        const values = await getValuesIfValid(assignHiringManagerForm);
        if (!values) return;
        await bulkAssignHiringManagerMutation.mutateAsync({
          application_ids: [applicationId],
          hiring_manager_user_id: values.hiring_manager_user_id,
        });
      }

      if (mode === "moveStage") {
        const values = await getValuesIfValid(moveStageForm);
        if (!values) return;
        await bulkMoveMutation.mutateAsync({
          application_ids: [applicationId],
          target_stage: values.target_stage as ApplicationCurrentStage,
          change_reason: values.change_reason,
        });
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      const message = getApiErrorMessage(err);
      setSubmitError(message);
      onError?.(message);
    }
  }

  return (
    <Dialog open={open} onClose={closeBlocked ? undefined : handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>{titleFor(mode)}</DialogTitle>
      <DialogContent>
        {submitError ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            {submitError}
          </Alert>
        ) : null}

        {applicationNumber ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Application: <b>{applicationNumber}</b>
          </Typography>
        ) : null}

        <Divider sx={{ my: 2.5 }} />

        {mode === "reject" ? (
          <Stack spacing={2}>
            <TextField
              label="Rejection reason"
              multiline
              minRows={3}
              placeholder="e.g. Not a fit for current requirements"
              {...rejectForm.register("rejection_reason")}
              error={!!rejectForm.formState.errors.rejection_reason}
              helperText={rejectForm.formState.errors.rejection_reason?.message}
            />
          </Stack>
        ) : null}

        {mode === "hold" ? (
          <Stack spacing={2}>
            <TextField
              label="Reason (optional)"
              multiline
              minRows={3}
              placeholder="e.g. Waiting for headcount approval"
              {...holdForm.register("change_reason")}
              error={!!holdForm.formState.errors.change_reason}
              helperText={holdForm.formState.errors.change_reason?.message}
            />
          </Stack>
        ) : null}

        {mode === "withdraw" ? (
          <Stack spacing={2}>
            <TextField
              label="Withdrawal reason"
              multiline
              minRows={3}
              placeholder="e.g. Candidate accepted another offer"
              {...withdrawForm.register("withdrawal_reason")}
              error={!!withdrawForm.formState.errors.withdrawal_reason}
              helperText={withdrawForm.formState.errors.withdrawal_reason?.message}
            />
          </Stack>
        ) : null}

        {mode === "completeScreening" ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Screening score (0-100)"
                type="number"
                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
                {...completeForm.register("screening_score")}
                error={!!completeForm.formState.errors.screening_score}
                helperText={completeForm.formState.errors.screening_score?.message}
                fullWidth
              />
              <TextField
                label="Fit score (0-100)"
                type="number"
                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
                {...completeForm.register("fit_score")}
                error={!!completeForm.formState.errors.fit_score}
                helperText={completeForm.formState.errors.fit_score?.message}
                fullWidth
              />
            </Stack>

            <Controller
              name="screening_result"
              control={completeForm.control}
              render={({ field }) => (
                <TextField
                  select
                  label="Result"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={!!completeForm.formState.errors.screening_result}
                  helperText={completeForm.formState.errors.screening_result?.message}
                >
                  {SCREENING_RESULTS.map((r) => (
                    <MenuItem key={r} value={r}>
                      {SCREENING_RESULT_LABELS[r]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <TextField
              label="Remarks (optional)"
              multiline
              minRows={3}
              placeholder="e.g. Strong communication and problem-solving"
              {...completeForm.register("screening_remarks")}
              error={!!completeForm.formState.errors.screening_remarks}
              helperText={completeForm.formState.errors.screening_remarks?.message}
            />
          </Stack>
        ) : null}

        {mode === "assignRecruiter" ? (
          <Stack spacing={2}>
            <Controller
              name="recruiter_user_id"
              control={assignRecruiterForm.control}
              render={({ field }) => (
                <TextField
                  select
                  label="Recruiter"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={!!assignRecruiterForm.formState.errors.recruiter_user_id}
                  helperText={assignRecruiterForm.formState.errors.recruiter_user_id?.message}
                  disabled={recruitersQuery.isLoading || recruitersQuery.isError}
                >
                  {recruitersQuery.isLoading ? (
                    <MenuItem value="" disabled>
                      Loading recruiters...
                    </MenuItem>
                  ) : null}
                  {recruitersQuery.isError ? (
                    <MenuItem value="" disabled>
                      Unable to load recruiters
                    </MenuItem>
                  ) : null}
                  {recruiters.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} — {u.email}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
        ) : null}

        {mode === "assignHiringManager" ? (
          <Stack spacing={2}>
            <Controller
              name="hiring_manager_user_id"
              control={assignHiringManagerForm.control}
              render={({ field }) => (
                <TextField
                  select
                  label="Hiring manager"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={!!assignHiringManagerForm.formState.errors.hiring_manager_user_id}
                  helperText={
                    assignHiringManagerForm.formState.errors.hiring_manager_user_id?.message
                  }
                  disabled={hiringManagersQuery.isLoading || hiringManagersQuery.isError}
                >
                  {hiringManagersQuery.isLoading ? (
                    <MenuItem value="" disabled>
                      Loading hiring managers...
                    </MenuItem>
                  ) : null}
                  {hiringManagersQuery.isError ? (
                    <MenuItem value="" disabled>
                      Unable to load hiring managers
                    </MenuItem>
                  ) : null}
                  {hiringManagers.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} — {u.email}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
        ) : null}

        {mode === "moveStage" ? (
          <Stack spacing={2}>
            <Controller
              name="target_stage"
              control={moveStageForm.control}
              render={({ field }) => (
                <TextField
                  select
                  label="Target stage"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={!!moveStageForm.formState.errors.target_stage}
                  helperText={moveStageForm.formState.errors.target_stage?.message}
                >
                  {APPLICATION_CURRENT_STAGES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <TextField
              label="Change reason"
              multiline
              minRows={3}
              placeholder="e.g. Moving to interview after shortlist review"
              {...moveStageForm.register("change_reason")}
              error={!!moveStageForm.formState.errors.change_reason}
              helperText={moveStageForm.formState.errors.change_reason?.message}
            />
          </Stack>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={isDanger(mode) ? "error" : "primary"}
          onClick={() => void submit()}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Working..." : submitLabelFor(mode)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
