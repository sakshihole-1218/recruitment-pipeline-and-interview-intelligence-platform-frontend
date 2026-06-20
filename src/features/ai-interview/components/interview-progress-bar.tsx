"use client";

import { Box, Card, CardContent, LinearProgress, Stack, Typography } from "@mui/material";

interface InterviewProgressBarProps {
  questionLabel: string;
  answeredQuestions: number;
  totalQuestions: number;
  progressPercent: number;
}

export function InterviewProgressBar({
  questionLabel,
  answeredQuestions,
  totalQuestions,
  progressPercent,
}: InterviewProgressBarProps) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Interview Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {questionLabel} / {totalQuestions || 0}
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{ height: 10, borderRadius: 999 }}
          />

          <Box>
            <Typography variant="body2" color="text.secondary">
              {answeredQuestions} answered
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
