"use client";

import { Box, Skeleton, Stack, Typography } from "@mui/material";

import { useApplication } from "@/features/applications/hooks/use-applications";
import { useInterviewRoundsByJobOpening } from "@/features/interview-rounds/hooks/use-interview-rounds";
import { InterviewRoundTypeChip } from "@/features/interview-rounds/components/interview-round-type-chip";

function useRoundLookup(applicationId: string, interviewRoundId: string) {
  const applicationQuery = useApplication(applicationId);
  const application = applicationQuery.data?.data;

  const jobOpeningId = application?.job_opening_id ?? "";

  const roundsQuery = useInterviewRoundsByJobOpening({ job_opening_id: jobOpeningId });

  const round = (roundsQuery.data?.data ?? []).find((r) => r.id === interviewRoundId) ?? null;

  return {
    applicationQuery,
    roundsQuery,
    round,
  };
}

export function InterviewRoundNameCell({
  applicationId,
  interviewRoundId,
}: {
  applicationId: string;
  interviewRoundId: string;
}) {
  const { applicationQuery, roundsQuery, round } = useRoundLookup(applicationId, interviewRoundId);

  if (applicationQuery.isLoading || roundsQuery.isLoading) {
    return (
      <Stack spacing={0.5} sx={{ py: 0.75 }}>
        <Skeleton width={180} height={18} />
      </Stack>
    );
  }

  if (applicationQuery.isError || roundsQuery.isError) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  if (!round) {
    return (
      <Typography variant="body2" color="text.secondary">
        Unknown round
      </Typography>
    );
  }

  return (
    <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
      {round.round_name}
    </Typography>
  );
}

export function InterviewRoundTypeCell({
  applicationId,
  interviewRoundId,
}: {
  applicationId: string;
  interviewRoundId: string;
}) {
  const { applicationQuery, roundsQuery, round } = useRoundLookup(applicationId, interviewRoundId);

  if (applicationQuery.isLoading || roundsQuery.isLoading) {
    return <Skeleton width={90} height={24} />;
  }

  if (applicationQuery.isError || roundsQuery.isError || !round) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <InterviewRoundTypeChip type={round.round_type} />
    </Box>
  );
}
