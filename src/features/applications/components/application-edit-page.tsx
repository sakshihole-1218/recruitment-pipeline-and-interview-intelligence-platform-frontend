"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  Breadcrumbs,
  Button,
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  PauseCircleOutlined as HoldIcon,
  Block as RejectIcon,
  Logout as WithdrawIcon,
  PlaylistAddCheck as ScreeningIcon,
  MoveUp as MoveStageIcon,
  Person as AssignIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

import {
  useApplication,
  useApplicationStageHistory,
  useStartApplicationScreening,
} from "@/features/applications/hooks/use-applications";
import { useApplicationsPermissions } from "@/features/applications/hooks/use-applications-permissions";
import { ConfirmDialog } from "@/features/applications/components/confirm-dialog";
import { ApplicationActionDialog, type ApplicationActionMode } from "@/features/applications/components/application-action-dialog";
import { ApplicationDetailsView } from "@/features/applications/components/application-details-view";

import { useCandidate } from "@/features/candidates/hooks/use-candidates";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import { useUser } from "@/features/users/hooks/use-users";

export function ApplicationEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const { canManageApplicationStatus, canAssignOwners, canManageApplicationStage } = useApplicationsPermissions();

  const id = params.id;

  const appQuery = useApplication(id);
  const historyQuery = useApplicationStageHistory(id);

  const application = appQuery.data?.data;

  const candidateQuery = useCandidate(application?.candidate_id ?? "");
  const jobOpeningQuery = useJobOpening(application?.job_opening_id ?? "");
  const recruiterQuery = useUser(application?.assigned_recruiter_user_id ?? "");
  const hiringManagerQuery = useUser(application?.assigned_hiring_manager_user_id ?? "");

  const stageHistory = historyQuery.data?.data ?? [];

  const [confirmStartScreening, setConfirmStartScreening] = useState(false);
  const startMutation = useStartApplicationScreening(id);

  const [actionDialog, setActionDialog] = useState<{ open: boolean; mode: ApplicationActionMode } | null>(null);

  const isLoading = appQuery.isLoading;
  const isError = appQuery.isError;
  const errorMessage = isError ? getApiErrorMessage(appQuery.error) : "";

  const primaryTitle = useMemo(() => {
    if (application?.application_number) return application.application_number;
    return "Application";
  }, [application?.application_number]);

  const canEditApplication = canManageApplicationStatus || canAssignOwners || canManageApplicationStage;

  async function onStartScreening() {
    try {
      await startMutation.mutateAsync();
      showSuccess("Screening started");
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setConfirmStartScreening(false);
    }
  }

  if (appQuery.isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load application
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {errorMessage}
        </Typography>
        <Button variant="outlined" sx={{ mt: 3 }} onClick={() => router.push(ROUTES.APPLICATIONS)}>
          Back to Applications
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.APPLICATIONS} underline="hover" color="inherit">
          Applications
        </Link>
        <Link component={NextLink} href={`${ROUTES.APPLICATIONS}/${id}`} underline="hover" color="inherit">
          {isLoading ? <Skeleton width={220} /> : primaryTitle}
        </Link>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 3, gap: 2 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Button
            variant="text"
            startIcon={<BackIcon />}
            onClick={() => router.push(`${ROUTES.APPLICATIONS}/${id}`)}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Edit Application
          </Typography>
        </Stack>

        {application ? (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: { sm: "flex-end" } }}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<ViewIcon />}
              onClick={() => router.push(`${ROUTES.APPLICATIONS}/${application.id}`)}
              sx={{ borderRadius: 2, fontWeight: 900 }}
            >
              View
            </Button>

            {canEditApplication && canManageApplicationStatus && application.current_stage === "APPLIED" ? (
              <Button
                size="small"
                variant="contained"
                startIcon={<ScreeningIcon />}
                onClick={() => setConfirmStartScreening(true)}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Start screening
              </Button>
            ) : null}

            {canEditApplication && canManageApplicationStatus ? (
              <Button
                size="small"
                variant="outlined"
                startIcon={<ScreeningIcon />}
                onClick={() => setActionDialog({ open: true, mode: "completeScreening" })}
                disabled={application.current_stage !== "SCREENING"}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Complete screening
              </Button>
            ) : null}

            {canEditApplication && canManageApplicationStatus ? (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<HoldIcon />}
                onClick={() => setActionDialog({ open: true, mode: "hold" })}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Hold
              </Button>
            ) : null}

            {canEditApplication && canManageApplicationStatus ? (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => setActionDialog({ open: true, mode: "reject" })}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Reject
              </Button>
            ) : null}

            {canEditApplication && canManageApplicationStatus ? (
              <Button
                size="small"
                variant="outlined"
                startIcon={<WithdrawIcon />}
                onClick={() => setActionDialog({ open: true, mode: "withdraw" })}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Withdraw
              </Button>
            ) : null}

            {canEditApplication && canAssignOwners ? (
              <Button
                size="small"
                variant="outlined"
                startIcon={<AssignIcon />}
                onClick={() => setActionDialog({ open: true, mode: "assignRecruiter" })}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Assign recruiter
              </Button>
            ) : null}

            {canEditApplication && canAssignOwners ? (
              <Button
                size="small"
                variant="outlined"
                startIcon={<AssignIcon />}
                onClick={() => setActionDialog({ open: true, mode: "assignHiringManager" })}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Assign hiring manager
              </Button>
            ) : null}

            {canEditApplication && canManageApplicationStage ? (
              <Button
                size="small"
                variant="outlined"
                startIcon={<MoveStageIcon />}
                onClick={() => setActionDialog({ open: true, mode: "moveStage" })}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Move stage
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Stack>

      {isLoading ? (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={180} />
          <Skeleton variant="rounded" height={220} />
        </Stack>
      ) : null}

      {application ? (
        <ApplicationDetailsView
          application={application}
          candidate={candidateQuery.data?.data ?? null}
          jobOpening={jobOpeningQuery.data?.data ?? null}
          recruiter={recruiterQuery.data?.data ?? null}
          hiringManager={hiringManagerQuery.data?.data ?? null}
          stageHistory={stageHistory}
        />
      ) : null}

      <ConfirmDialog
        open={confirmStartScreening}
        title="Start screening"
        description={
          application
            ? `Start screening for ${application.application_number}? This moves the stage from APPLIED → SCREENING.`
            : ""
        }
        confirmLabel="Start"
        isConfirmLoading={startMutation.isPending}
        onCancel={() => setConfirmStartScreening(false)}
        onConfirm={onStartScreening}
      />

      {application && actionDialog?.open ? (
        <ApplicationActionDialog
          open={actionDialog.open}
          mode={actionDialog.mode}
          applicationId={application.id}
          applicationNumber={application.application_number}
          onClose={() => setActionDialog(null)}
          onSuccess={() => showSuccess("Application updated")}
          onError={(message) => showError(message)}
        />
      ) : null}

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
