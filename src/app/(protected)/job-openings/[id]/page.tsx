"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  Edit as EditIcon,
  Publish as PublishIcon,
  Unpublished as UnpublishIcon,
  Lock as CloseIcon,
  LockOpen as OpenIcon,
  ToggleOff as DeactivateIcon,
  ToggleOn as ActivateIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { AppSnackbar } from "@/components/app-snackbar";
import { useSnackbar } from "@/hooks/use-snackbar";
import { useDepartment } from "@/features/departments/hooks/use-departments";
import { useUser } from "@/features/users/hooks/use-users";
import {
  useCloseJobOpening,
  useJobOpening,
  useOpenJobOpening,
  usePublishJobOpening,
  useUnpublishJobOpening,
  useUpdateJobOpening,
} from "@/features/job-openings/hooks/use-job-openings";
import { useJobOpeningsPermissions } from "@/features/job-openings/hooks/use-job-openings-permissions";
import { ConfirmDialog } from "@/features/job-openings/components/confirm-dialog";
import { JobOpeningDetailsView } from "@/features/job-openings/components/job-opening-details-view";

interface JobOpeningDetailPageProps {
  params: Promise<{ id: string }>;
}

type PendingAction =
  | "publish"
  | "unpublish"
  | "open"
  | "close"
  | "activate"
  | "deactivate";

export default function JobOpeningDetailPage({ params }: JobOpeningDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const { canEditJobOpening, canManageJobOpeningStatus } = useJobOpeningsPermissions();

  const { data, isLoading, isError, error } = useJobOpening(id);
  const opening = data?.data;

  const departmentQuery = useDepartment(opening?.department_id ?? "");
  const recruiterQuery = useUser(opening?.recruiter_user_id ?? "");
  const hiringManagerQuery = useUser(opening?.hiring_manager_user_id ?? "");

  const departmentName = departmentQuery.data?.data?.name;
  const recruiterName = recruiterQuery.data?.data
    ? `${recruiterQuery.data.data.first_name} ${recruiterQuery.data.data.last_name}`
    : undefined;
  const hiringManagerName = hiringManagerQuery.data?.data
    ? `${hiringManagerQuery.data.data.first_name} ${hiringManagerQuery.data.data.last_name}`
    : undefined;

  const publish = usePublishJobOpening(id);
  const unpublish = useUnpublishJobOpening(id);
  const open = useOpenJobOpening(id);
  const close = useCloseJobOpening(id);
  const update = useUpdateJobOpening(id);

  const [confirm, setConfirm] = useState<{ open: boolean; action: PendingAction | null }>(
    { open: false, action: null },
  );

  const isMutating =
    publish.isPending ||
    unpublish.isPending ||
    open.isPending ||
    close.isPending ||
    update.isPending;

  const confirmMeta = useMemo(() => {
    const title = opening?.title ?? "this job opening";

    switch (confirm.action) {
      case "publish":
        return {
          title: "Publish Job Opening",
          description: `Are you sure you want to publish ${title}?`,
          confirmLabel: "Publish",
          confirmColor: "success" as const,
        };
      case "unpublish":
        return {
          title: "Unpublish Job Opening",
          description: `Are you sure you want to unpublish ${title}?`,
          confirmLabel: "Unpublish",
          confirmColor: "warning" as const,
        };
      case "open":
        return {
          title: "Reopen Job Opening",
          description: `Are you sure you want to reopen ${title}?`,
          confirmLabel: "Reopen",
          confirmColor: "success" as const,
        };
      case "close":
        return {
          title: "Close Job Opening",
          description: `Are you sure you want to close ${title}?`,
          confirmLabel: "Close",
          confirmColor: "warning" as const,
        };
      case "activate":
        return {
          title: "Activate Job Opening",
          description: `Are you sure you want to activate ${title}?`,
          confirmLabel: "Activate",
          confirmColor: "success" as const,
        };
      case "deactivate":
        return {
          title: "Deactivate Job Opening",
          description: `Are you sure you want to deactivate ${title}?`,
          confirmLabel: "Deactivate",
          confirmColor: "error" as const,
        };
      default:
        return null;
    }
  }, [confirm.action, opening?.title]);

  const handleConfirm = async () => {
    if (!opening || !confirm.action) return;

    try {
      switch (confirm.action) {
        case "publish": {
          const res = await publish.mutateAsync();
          showSuccess(res.message || "Job opening published successfully");
          break;
        }
        case "unpublish": {
          const res = await unpublish.mutateAsync();
          showSuccess(res.message || "Job opening unpublished successfully");
          break;
        }
        case "open": {
          const res = await open.mutateAsync();
          showSuccess(res.message || "Job opening opened successfully");
          break;
        }
        case "close": {
          const res = await close.mutateAsync();
          showSuccess(res.message || "Job opening closed successfully");
          break;
        }
        case "activate": {
          const res = await update.mutateAsync({ is_active: true });
          showSuccess(res.message || "Job opening activated successfully");
          break;
        }
        case "deactivate": {
          const res = await update.mutateAsync({ is_active: false });
          showSuccess(res.message || "Job opening deactivated successfully");
          break;
        }
      }
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setConfirm({ open: false, action: null });
    }
  };

  if (isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load job opening
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getApiErrorMessage(error)}
        </Typography>
        <Button
          variant="outlined"
          sx={{ mt: 3 }}
          onClick={() => router.push(ROUTES.JOB_OPENINGS)}
        >
          Back to Job Openings
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.JOB_OPENINGS} underline="hover" color="inherit">
          Job Openings
        </Link>
        <Typography color="text.primary">
          {isLoading ? <Skeleton width={220} /> : opening?.title}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 3,
          gap: 2,
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Button
            variant="text"
            startIcon={<BackIcon />}
            onClick={() => router.push(ROUTES.JOB_OPENINGS)}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Job Opening Details
          </Typography>
        </Stack>

        {opening ? (
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1.25 }}>
            {canManageJobOpeningStatus ? (
              <>
                {!opening.published_at ? (
                  <Button
                    variant="outlined"
                    startIcon={<PublishIcon />}
                    onClick={() => setConfirm({ open: true, action: "publish" })}
                  >
                    Publish
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<UnpublishIcon />}
                    onClick={() => setConfirm({ open: true, action: "unpublish" })}
                  >
                    Unpublish
                  </Button>
                )}

                {opening.status === "CLOSED" ? (
                  <Button
                    variant="outlined"
                    startIcon={<OpenIcon />}
                    color="success"
                    onClick={() => setConfirm({ open: true, action: "open" })}
                  >
                    Reopen
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    color="warning"
                    onClick={() => setConfirm({ open: true, action: "close" })}
                  >
                    Close
                  </Button>
                )}

                {opening.is_active ? (
                  <Button
                    variant="outlined"
                    startIcon={<DeactivateIcon />}
                    color="error"
                    onClick={() => setConfirm({ open: true, action: "deactivate" })}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<ActivateIcon />}
                    color="success"
                    onClick={() => setConfirm({ open: true, action: "activate" })}
                  >
                    Activate
                  </Button>
                )}
              </>
            ) : null}

            {canEditJobOpening ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => router.push(`${ROUTES.JOB_OPENINGS}/${id}/edit`)}
                sx={{ fontWeight: 900 }}
              >
                Edit
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Stack>

      {opening ? (
        <JobOpeningDetailsView
          opening={opening}
          departmentName={departmentName}
          recruiterName={recruiterName}
          hiringManagerName={hiringManagerName}
        />
      ) : (
        <Box>
          <Skeleton height={56} />
          <Skeleton height={320} sx={{ mt: 2 }} />
        </Box>
      )}

      {confirmMeta ? (
        <ConfirmDialog
          open={confirm.open}
          title={confirmMeta.title}
          description={confirmMeta.description}
          confirmLabel={confirmMeta.confirmLabel}
          confirmColor={confirmMeta.confirmColor}
          loading={isMutating}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm({ open: false, action: null })}
        />
      ) : null}

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
