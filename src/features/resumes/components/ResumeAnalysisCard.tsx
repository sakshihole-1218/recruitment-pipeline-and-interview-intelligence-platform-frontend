"use client";

import { Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";

import {
  RESUME_ANALYSIS_STATUS_LABELS,
  type ResumeAiAnalysisResponse,
} from "@/features/resumes/types/resume.types";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function getStatusColor(status: ResumeAiAnalysisResponse["analysis_status"]) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "FAILED":
      return "error";
    case "PROCESSING":
      return "warning";
    default:
      return "default";
  }
}

export function ResumeAnalysisCard({
  analysis,
}: {
  analysis: ResumeAiAnalysisResponse;
}) {
  const fitScore =
    analysis.ai_fit_score === null ? "—" : `${Number(analysis.ai_fit_score).toFixed(1)} / 100`;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2.5 }}
        >
          <BoxTitle
            title="AI Resume Analysis"
            subtitle="Current analysis status and fit score for this resume."
          />
          <Chip
            label={RESUME_ANALYSIS_STATUS_LABELS[analysis.analysis_status]}
            color={getStatusColor(analysis.analysis_status)}
            sx={{ fontWeight: 800 }}
          />
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Metric title="AI Fit Score" value={fitScore} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Metric
              title="Analysis Status"
              value={RESUME_ANALYSIS_STATUS_LABELS[analysis.analysis_status]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Metric title="Analyzed At" value={formatDateTime(analysis.analyzed_at)} />
          </Grid>
        </Grid>

        {analysis.failure_reason ? (
          <Stack spacing={0.5} sx={{ mt: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              Failure Reason
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {analysis.failure_reason}
            </Typography>
          </Stack>
        ) : null}
      </CardContent>
    </Card>
  );
}

function BoxTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Stack spacing={0.3}>
      <Typography variant="h6" sx={{ fontWeight: 900 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Stack>
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
