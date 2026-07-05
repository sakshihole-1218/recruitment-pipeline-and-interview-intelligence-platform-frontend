"use client";

import { Button, Stack } from "@mui/material";
import {
  Autorenew as RetryIcon,
  PlayArrow as AnalyzeIcon,
  Refresh as ReanalyzeIcon,
} from "@mui/icons-material";

export function ResumeAnalysisActions({
  canAnalyze,
  canReanalyze,
  canRetry,
  runningLabel,
  isBusy,
  onAnalyze,
  onReanalyze,
  onRetry,
}: {
  canAnalyze: boolean;
  canReanalyze: boolean;
  canRetry: boolean;
  runningLabel: string | null;
  isBusy: boolean;
  onAnalyze: () => void;
  onReanalyze: () => void;
  onRetry: () => void;
}) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
      {canAnalyze ? (
        <Button
          variant="contained"
          startIcon={<AnalyzeIcon />}
          onClick={onAnalyze}
          disabled={isBusy}
          sx={{ borderRadius: 2, fontWeight: 900 }}
        >
          {runningLabel && isBusy ? runningLabel : "Analyze Resume"}
        </Button>
      ) : null}

      {canRetry ? (
        <Button
          variant="contained"
          color="error"
          startIcon={<RetryIcon />}
          onClick={onRetry}
          disabled={isBusy}
          sx={{ borderRadius: 2, fontWeight: 900 }}
        >
          {runningLabel && isBusy ? runningLabel : "Retry Analysis"}
        </Button>
      ) : null}

      {canReanalyze ? (
        <Button
          variant="outlined"
          startIcon={<ReanalyzeIcon />}
          onClick={onReanalyze}
          disabled={isBusy}
          sx={{ borderRadius: 2, fontWeight: 900 }}
        >
          {runningLabel && isBusy ? runningLabel : "Re-analyze Resume"}
        </Button>
      ) : null}
    </Stack>
  );
}
