"use client";

import { Card, CardContent, Chip, Divider, Grid, Stack, Typography } from "@mui/material";

import {
  AI_INTERVIEW_FEEDBACK_STATUS_LABELS,
  RECOMMENDATION_LABELS,
  type AiInterviewFeedbackStatus,
  type AiInterviewRecommendation,
} from "@/features/feedback/types/feedback.types";

function EmptyValue() {
  return (
    <Typography variant="body2" color="text.disabled">
      —
    </Typography>
  );
}

function SummaryBlock({
  title,
  value,
}: {
  title: string;
  value: string | null | undefined;
}) {
  return (
    <Stack spacing={0.75}>
      <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
        {title}
      </Typography>
      {value ? (
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
          {value}
        </Typography>
      ) : (
        <EmptyValue />
      )}
    </Stack>
  );
}

export function FeedbackSummaryCard({
  recommendation,
  feedbackStatus,
  strengths,
  concerns,
  improvementAreas,
  detailedFeedback,
}: {
  recommendation: AiInterviewRecommendation | null;
  feedbackStatus: AiInterviewFeedbackStatus;
  strengths: string | null;
  concerns: string | null;
  improvementAreas: string | null;
  detailedFeedback: string | null;
}) {
  const recommendationColor =
    recommendation === "STRONGLY_SELECT" || recommendation === "SELECT"
      ? "success"
      : recommendation === "HOLD"
        ? "warning"
        : "error";

  const statusColor =
    feedbackStatus === "COMPLETED"
      ? "success"
      : feedbackStatus === "PROCESSING"
        ? "warning"
        : feedbackStatus === "FAILED"
          ? "error"
          : "default";

  return (
    <Card
      elevation={0}
      sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ justifyContent: "space-between" }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              AI Feedback Summary
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Chip
                size="small"
                label={
                  recommendation
                    ? RECOMMENDATION_LABELS[recommendation]
                    : "Recommendation not set"
                }
                color={recommendation ? recommendationColor : "default"}
                variant={recommendation ? "filled" : "outlined"}
                sx={{ fontWeight: 800 }}
              />
              <Chip
                size="small"
                label={AI_INTERVIEW_FEEDBACK_STATUS_LABELS[feedbackStatus]}
                color={statusColor}
                variant={feedbackStatus === "PENDING" ? "outlined" : "filled"}
                sx={{ fontWeight: 800 }}
              />
            </Stack>
          </Stack>

          <Divider />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SummaryBlock title="Strengths" value={strengths} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <SummaryBlock title="Concerns" value={concerns} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <SummaryBlock title="Improvement Areas" value={improvementAreas} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <SummaryBlock title="Detailed AI Feedback" value={detailedFeedback} />
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}
