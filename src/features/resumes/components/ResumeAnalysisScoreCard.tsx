"use client";

import { Box, Card, CardContent, Chip, Grid, LinearProgress, Stack, Typography } from "@mui/material";

import {
  RESUME_ROW_STATUS_LABELS,
  type ResumeAiAnalysisResponse,
  type ResumeRowStatus,
  getResumeAnalysisStatusColor,
} from "@/features/resumes/types/resumeAnalysis.types";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatFitScore(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return `${Number(value).toFixed(1)} / 100`;
}

function formatExperience(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return `${value} years`;
}

export function ResumeAnalysisScoreCard({
  analysis,
  status,
}: {
  analysis: ResumeAiAnalysisResponse | null;
  status: ResumeRowStatus;
}) {
  const showProgress = status === "PENDING" || status === "PROCESSING";

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2.5 }}
        >
          <Stack spacing={0.3}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              AI Resume Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fit score, current analysis state, and the latest processing timestamp.
            </Typography>
          </Stack>

          <Chip
            label={RESUME_ROW_STATUS_LABELS[status]}
            color={getResumeAnalysisStatusColor(status)}
            sx={{ fontWeight: 800 }}
          />
        </Stack>

        {showProgress ? (
          <Box sx={{ mb: 2.5 }}>
            <LinearProgress sx={{ height: 8, borderRadius: 999 }} />
          </Box>
        ) : null}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Metric title="AI Fit Score" value={formatFitScore(analysis?.ai_fit_score)} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Metric title="Status" value={RESUME_ROW_STATUS_LABELS[status]} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Metric
              title="Experience Detected"
              value={formatExperience(analysis?.total_experience_years_detected)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Metric title="Analyzed At" value={formatDateTime(analysis?.analyzed_at)} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Stack
      spacing={0.5}
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
        height: "100%",
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography sx={{ fontWeight: 900 }}>{value}</Typography>
    </Stack>
  );
}
