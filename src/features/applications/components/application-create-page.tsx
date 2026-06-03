"use client";

import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  alpha,
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { NavigateNext as NavigateNextIcon, WorkOutlined as ApplicationsIcon } from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

import { ApplicationForm } from "@/features/applications/components/application-form";
import { useCreateApplication } from "@/features/applications/hooks/use-applications";
import type { CreateApplicationFormValues } from "@/features/applications/schemas/application.schema";

export function ApplicationCreatePage() {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const createMutation = useCreateApplication();

  async function onSubmit(values: CreateApplicationFormValues) {
    try {
      const res = await createMutation.mutateAsync({
        candidate_id: values.candidate_id,
        job_opening_id: values.job_opening_id,
        assigned_recruiter_user_id: values.assigned_recruiter_user_id,
        assigned_hiring_manager_user_id: values.assigned_hiring_manager_user_id,
        is_priority: values.is_priority,
      });

      showSuccess("Application created");
      router.replace(`${ROUTES.APPLICATIONS}/${res.data.id}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  }

  return (
    <Box sx={{ maxWidth: 980, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          component={NextLink}
          href={ROUTES.APPLICATIONS}
          underline="hover"
          color="text.secondary"
          sx={{ fontWeight: 500, fontSize: "0.875rem" }}
        >
          Applications
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
          New
        </Typography>
      </Breadcrumbs>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 4,
            py: 3,
            background: (t) =>
              `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.08)} 0%, ${alpha(t.palette.primary.main, 0.03)} 100%)`,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ApplicationsIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                Create Application
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Connect a candidate to an opening and assign owners.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <ApplicationForm
            title="Application Information"
            subtitle="Candidate → Job opening → optional ownership"
            submitLabel="Create"
            isSubmitting={createMutation.isPending}
            onCancel={() => router.push(ROUTES.APPLICATIONS)}
            onSubmit={onSubmit}
          />
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
