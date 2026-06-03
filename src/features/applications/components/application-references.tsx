"use client";

import NextLink from "next/link";
import {
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import { ROUTES } from "@/constants/routes";
import { useCandidate } from "@/features/candidates/hooks/use-candidates";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import { useUser } from "@/features/users/hooks/use-users";

function NameSkeleton() {
  return <Skeleton variant="text" width={140} />;
}

export function CandidateRef({ candidateId }: { candidateId: string }) {
  const { data, isLoading, isError } = useCandidate(candidateId);

  if (isLoading) return <NameSkeleton />;
  if (isError || !data?.data) return <Typography variant="body2">{candidateId}</Typography>;

  const c = data.data;
  const label = `${c.first_name} ${c.last_name}`.trim();

  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Link
        component={NextLink}
        href={`${ROUTES.CANDIDATES}/${candidateId}`}
        underline="hover"
        sx={{ fontWeight: 800 }}
        noWrap
      >
        {label || candidateId}
      </Link>
      <Typography variant="caption" color="text.secondary" noWrap>
        {c.email}
      </Typography>
    </Stack>
  );
}

export function JobOpeningRef({
  jobOpeningId,
  showCode = true,
}: {
  jobOpeningId: string;
  showCode?: boolean;
}) {
  const { data, isLoading, isError } = useJobOpening(jobOpeningId);

  if (isLoading) return <NameSkeleton />;
  if (isError || !data?.data) return <Typography variant="body2">{jobOpeningId}</Typography>;

  const opening = data.data;

  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Link
        component={NextLink}
        href={`${ROUTES.JOB_OPENINGS}/${jobOpeningId}`}
        underline="hover"
        sx={{ fontWeight: 800 }}
        noWrap
      >
        {opening.title}
      </Link>
      {showCode ? (
        <Typography variant="caption" color="text.secondary" noWrap>
          {opening.code}
        </Typography>
      ) : null}
    </Stack>
  );
}

export function UserRef({ userId }: { userId: string | null }) {
  const id = userId ?? "";
  const { data, isLoading, isError } = useUser(id);

  if (!userId) {
    return (
      <Typography variant="body2" color="text.disabled">
        —
      </Typography>
    );
  }

  if (isLoading) return <NameSkeleton />;
  if (isError || !data?.data) return <Typography variant="body2">{userId}</Typography>;

  const u = data.data;
  const label = `${u.first_name} ${u.last_name}`.trim();

  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
        {label || userId}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        {u.email}
      </Typography>
    </Stack>
  );
}
