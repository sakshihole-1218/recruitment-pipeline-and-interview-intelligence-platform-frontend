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
import {
  NavigateNext as NavigateNextIcon,
  PlaylistAddCheck as RoundsIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";
import { useCreateInterviewRound } from "@/features/interview-rounds/hooks/use-interview-rounds";
import { InterviewRoundForm } from "@/features/interview-rounds/components/interview-round-form";
import type { InterviewRoundFormValues } from "@/features/interview-rounds/schemas/interview-round.schema";

export function InterviewRoundCreateView() {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const createMutation = useCreateInterviewRound();

  const onSubmit = async (values: InterviewRoundFormValues) => {
    try {
      const payload = {
        job_opening_id: values.job_opening_id,
        round_name: values.round_name.trim(),
        round_type: values.round_type,
        sequence_number: values.sequence_number,
        is_mandatory: values.is_mandatory ?? true,
        max_score: values.max_score === null ? undefined : values.max_score ?? undefined,
        description: values.description && values.description.trim() !== "" ? values.description.trim() : undefined,
      };

      const res = await createMutation.mutateAsync(payload);
      showSuccess(res.message || "Interview round created successfully");
      router.push(ROUTES.INTERVIEW_ROUNDS);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          component={NextLink}
          href={ROUTES.INTERVIEW_ROUNDS}
          underline="hover"
          color="text.secondary"
          sx={{ fontWeight: 500, fontSize: "0.875rem" }}
        >
          Interview Rounds
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 900, fontSize: "0.875rem" }}>
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
              <RoundsIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                Create Interview Round
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Define name, type, sequence and scoring settings.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <InterviewRoundForm
            title="Round Information"
            subtitle="Define name, type, sequence and scoring settings."
            submitLabel="Create"
            isSubmitting={createMutation.isPending}
            onCancel={() => router.push(ROUTES.INTERVIEW_ROUNDS)}
            onSubmit={onSubmit}
          />
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
