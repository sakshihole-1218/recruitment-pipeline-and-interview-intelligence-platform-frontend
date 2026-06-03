"use client";

import { Box, Skeleton, Stack, Typography } from "@mui/material";

import { useApplication } from "@/features/applications/hooks/use-applications";
import { useCandidate } from "@/features/candidates/hooks/use-candidates";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";

function safeText(value: string | null | undefined) {
  return value && value.trim() !== "" ? value : "—";
}

export function InterviewContextCell({ applicationId }: { applicationId: string }) {
  const applicationQuery = useApplication(applicationId);

  const application = applicationQuery.data?.data;

  const candidateId = application?.candidate_id ?? "";
  const jobOpeningId = application?.job_opening_id ?? "";

  const candidateQuery = useCandidate(candidateId);
  const jobOpeningQuery = useJobOpening(jobOpeningId);

  const candidate = candidateQuery.data?.data;
  const jobOpening = jobOpeningQuery.data?.data;

  if (applicationQuery.isLoading) {
    return (
      <Stack spacing={0.5} sx={{ py: 0.75 }}>
        <Skeleton width={220} height={18} />
        <Skeleton width={260} height={16} />
      </Stack>
    );
  }

  if (applicationQuery.isError) {
    return (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          Application
        </Typography>
        <Typography variant="caption" color="error">
          Unable to load application context
        </Typography>
      </Box>
    );
  }

  const candidateName = candidate
    ? `${safeText(candidate.first_name)} ${safeText(candidate.last_name)}`.trim()
    : "Loading candidate...";

  const jobTitle = jobOpening ? safeText(jobOpening.title) : "Loading job...";

  return (
    <Stack spacing={0.25} sx={{ py: 0.5, minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
        {candidateName}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        {jobTitle}
      </Typography>
    </Stack>
  );
}
