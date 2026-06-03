"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Link,
  Skeleton,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  NavigateNext as NavigateNextIcon,
  PlaylistAddCheck as RoundsIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";
import { useInterviewRoundsByJobOpening, useUpdateInterviewRound } from "@/features/interview-rounds/hooks/use-interview-rounds";
import { InterviewRoundForm } from "@/features/interview-rounds/components/interview-round-form";
import type { InterviewRoundFormValues } from "@/features/interview-rounds/schemas/interview-round.schema";

export function InterviewRoundEditView({ id }: { id: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const jobOpeningId = sp.get("job_opening_id") ?? "";

  const roundsQuery = useInterviewRoundsByJobOpening({ job_opening_id: jobOpeningId });

  const round = useMemo(() => {
    const rounds = roundsQuery.data?.data ?? [];
    return rounds.find((r) => r.id === id) ?? null;
  }, [roundsQuery.data, id]);

  const updateMutation = useUpdateInterviewRound(id, jobOpeningId);

  const onSubmit = async (values: InterviewRoundFormValues) => {
    try {
      const payload = {
        round_name: values.round_name.trim(),
        round_type: values.round_type,
        sequence_number: values.sequence_number,
        is_mandatory: values.is_mandatory ?? true,
        max_score: values.max_score === null ? undefined : values.max_score ?? undefined,
        description: values.description && values.description.trim() !== "" ? values.description.trim() : undefined,
      };

      const res = await updateMutation.mutateAsync(payload);
      showSuccess(res.message || "Interview round updated successfully");
      router.push(`${ROUTES.INTERVIEW_ROUNDS}/${id}?job_opening_id=${jobOpeningId}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  const errorMessage = roundsQuery.isError ? getApiErrorMessage(roundsQuery.error) : "";

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.INTERVIEW_ROUNDS} underline="hover" color="inherit">
          Interview Rounds
        </Link>
        <Typography color="text.primary">
          {roundsQuery.isLoading ? <Skeleton width={220} /> : round?.round_name ?? "Edit"}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 3, gap: 2 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Button
            variant="text"
            startIcon={<BackIcon />}
            onClick={() => router.push(`${ROUTES.INTERVIEW_ROUNDS}/${id}?job_opening_id=${jobOpeningId}`)}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Edit Interview Round
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <RoundsIcon color="primary" />
        </Stack>
      </Stack>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {!jobOpeningId ? (
            <Box sx={{ p: 3, border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 800 }}>Unable to edit round</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Backend currently supports listing rounds by job opening only. Navigate from the rounds list and ensure the URL contains `job_opening_id`.
              </Typography>
            </Box>
          ) : roundsQuery.isLoading ? (
            <Typography>Loading...</Typography>
          ) : roundsQuery.isError ? (
            <Box sx={{ p: 3, border: "1px solid", borderColor: "error.light", borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 800 }} color="error">
                Failed to load round
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {errorMessage}
              </Typography>
            </Box>
          ) : !round ? (
            <Box sx={{ p: 3, border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 800 }}>Round not found</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                This round might have been deleted or belongs to a different job opening.
              </Typography>
            </Box>
          ) : (
            <InterviewRoundForm
              title="Round Information"
              subtitle="Edit name, order, type and scoring settings."
              defaultValues={{
                job_opening_id: round.job_opening_id,
                round_name: round.round_name,
                round_type: round.round_type,
                sequence_number: round.sequence_number,
                is_mandatory: round.is_mandatory,
                max_score: round.max_score,
                description: round.description,
              }}
              disableJobOpeningSelect
              submitLabel="Update"
              isSubmitting={updateMutation.isPending}
              onCancel={() => router.push(`${ROUTES.INTERVIEW_ROUNDS}/${id}?job_opening_id=${jobOpeningId}`)}
              onSubmit={onSubmit}
            />
          )}
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
