"use client";

import { useMemo } from "react";
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
  EditOutlined as EditIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";

import {
  useApplication,
  useApplicationStageHistory,
} from "@/features/applications/hooks/use-applications";
import { useApplicationsPermissions } from "@/features/applications/hooks/use-applications-permissions";
import { ApplicationDetailsView } from "@/features/applications/components/application-details-view";

import { useCandidate } from "@/features/candidates/hooks/use-candidates";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import { useUser } from "@/features/users/hooks/use-users";

export function ApplicationDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { canManageApplicationStatus, canAssignOwners, canManageApplicationStage } = useApplicationsPermissions();
  const canEditApplication = canManageApplicationStatus || canAssignOwners || canManageApplicationStage;

  const id = params.id;

  const appQuery = useApplication(id);
  const historyQuery = useApplicationStageHistory(id);

  const application = appQuery.data?.data;

  const candidateQuery = useCandidate(application?.candidate_id ?? "");
  const jobOpeningQuery = useJobOpening(application?.job_opening_id ?? "");
  const recruiterQuery = useUser(application?.assigned_recruiter_user_id ?? "");
  const hiringManagerQuery = useUser(application?.assigned_hiring_manager_user_id ?? "");

  const stageHistory = historyQuery.data?.data ?? [];

  const isLoading = appQuery.isLoading;
  const isError = appQuery.isError;
  const errorMessage = isError ? getApiErrorMessage(appQuery.error) : "";

  const primaryTitle = useMemo(() => {
    if (application?.application_number) return application.application_number;
    return "Application";
  }, [application?.application_number]);

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
        <Typography color="text.primary">
          {isLoading ? <Skeleton width={220} /> : primaryTitle}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 3, gap: 2 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Button variant="text" startIcon={<BackIcon />} onClick={() => router.push(ROUTES.APPLICATIONS)} sx={{ mr: 1 }}>
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Application
          </Typography>
        </Stack>

        {application ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            {canEditApplication ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => router.push(`${ROUTES.APPLICATIONS}/${application.id}/edit`)}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Edit / Manage
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

    </Box>
  );
}
