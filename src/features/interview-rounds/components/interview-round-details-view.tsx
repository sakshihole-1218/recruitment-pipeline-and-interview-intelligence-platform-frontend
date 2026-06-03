"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Divider,
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  NavigateNext as NavigateNextIcon,
  PlaylistAddCheck as RoundsIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useInterviewRoundsByJobOpening } from "@/features/interview-rounds/hooks/use-interview-rounds";
import { useInterviewRoundsPermissions } from "@/features/interview-rounds/hooks/use-interview-rounds-permissions";
import { InterviewRoundTypeChip } from "@/features/interview-rounds/components/interview-round-type-chip";

export function InterviewRoundDetailsView({ id }: { id: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const jobOpeningId = sp.get("job_opening_id") ?? "";

  const { canEditInterviewRound } = useInterviewRoundsPermissions();

  const roundsQuery = useInterviewRoundsByJobOpening({ job_opening_id: jobOpeningId });

  const round = useMemo(() => {
    const rounds = roundsQuery.data?.data ?? [];
    return rounds.find((r) => r.id === id) ?? null;
  }, [roundsQuery.data, id]);

  const errorMessage = roundsQuery.isError ? getApiErrorMessage(roundsQuery.error) : "";

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.INTERVIEW_ROUNDS} underline="hover" color="inherit">
          Interview Rounds
        </Link>
        <Typography color="text.primary">
          {roundsQuery.isLoading ? <Skeleton width={220} /> : round?.round_name ?? "Details"}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 3, gap: 2 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Button variant="text" startIcon={<BackIcon />} onClick={() => router.push(ROUTES.INTERVIEW_ROUNDS)} sx={{ mr: 1 }}>
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Interview Round Details
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {round ? <InterviewRoundTypeChip type={round.round_type} /> : null}
          <RoundsIcon color="primary" />
          {canEditInterviewRound && jobOpeningId ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => router.push(`${ROUTES.INTERVIEW_ROUNDS}/${id}/edit?job_opening_id=${jobOpeningId}`)}
              sx={{ borderRadius: 2, fontWeight: 900 }}
            >
              Edit
            </Button>
          ) : null}
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
              <Typography sx={{ fontWeight: 800 }}>Unable to load round</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Backend currently supports listing rounds by job opening only. Please navigate from the rounds list and ensure the URL contains `job_opening_id`.
              </Typography>
              <Button sx={{ mt: 2 }} variant="outlined" onClick={() => router.push(ROUTES.INTERVIEW_ROUNDS)}>
                Back to Rounds
              </Button>
            </Box>
          ) : roundsQuery.isLoading ? (
            <Typography>Loading...</Typography>
          ) : roundsQuery.isError ? (
            <Box sx={{ p: 3, border: "1px solid", borderColor: "error.light", borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 800 }} color="error">
                Failed to load rounds
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
              <Button sx={{ mt: 2 }} variant="outlined" onClick={() => router.push(ROUTES.INTERVIEW_ROUNDS)}>
                Back to Rounds
              </Button>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {round.round_name}
              </Typography>

              <Divider />

              <Stack spacing={1.25}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Sequence:</strong> {round.sequence_number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Mandatory:</strong> {round.is_mandatory ? "Yes" : "No"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Max score:</strong> {round.max_score ?? "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Description:</strong> {round.description ?? "—"}
                </Typography>
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
