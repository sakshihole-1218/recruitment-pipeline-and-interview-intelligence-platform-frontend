"use client";

import { useRouter } from "next/navigation";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";

import { useCandidateInterviewAccess } from "@/features/candidate-interview/hooks/use-candidate-interview";
import { getApiErrorMessage } from "@/utils/api-error-handler";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString();
}

function getFriendlyError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("expired")) return "Link expired";
  if (normalized.includes("revoked")) return "Link revoked";
  if (normalized.includes("completed")) return "Interview already completed";
  return "Invalid interview link";
}

export function CandidateInterviewJoinPage({ token }: { token: string }) {
  const router = useRouter();
  const accessQuery = useCandidateInterviewAccess(token);
  const info = accessQuery.data?.data;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Card elevation={0} sx={{ width: "100%", maxWidth: 760, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 4 }}>
          {accessQuery.isLoading ? (
            <Stack spacing={2} sx={{ alignItems: "center", py: 6 }}>
              <CircularProgress />
              <Typography sx={{ fontWeight: 800 }}>Validating your interview link...</Typography>
            </Stack>
          ) : accessQuery.isError || !info ? (
            <Stack spacing={2}>
              <Alert severity="error">{getFriendlyError(getApiErrorMessage(accessQuery.error))}</Alert>
              <Typography variant="body2" color="text.secondary">
                This interview link is unavailable. Please contact the recruitment team if you think this is a mistake.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                  Candidate Interview
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Review the details below, then continue to your device check.
                </Typography>
              </Box>

              <Stack spacing={1}>
                <Typography><strong>Candidate:</strong> {info.candidate.full_name}</Typography>
                <Typography><strong>Job title:</strong> {info.job_opening.title}</Typography>
                <Typography><strong>Interview round:</strong> {info.interview_round.round_name}</Typography>
                <Typography><strong>Scheduled:</strong> {formatDateTime(info.scheduled_start_at)}</Typography>
                <Typography><strong>Estimated duration:</strong> {info.estimated_duration_minutes} minutes</Typography>
              </Stack>

              <Box>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Instructions</Typography>
                {info.instructions.map((instruction) => (
                  <Typography key={instruction} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {instruction}
                  </Typography>
                ))}
              </Box>

              <Box>
                <Button
                  variant="contained"
                  onClick={() => router.push(`/interview/join/${token}/lobby`)}
                  sx={{ borderRadius: 2, fontWeight: 900 }}
                >
                  Continue to Device Check
                </Button>
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
