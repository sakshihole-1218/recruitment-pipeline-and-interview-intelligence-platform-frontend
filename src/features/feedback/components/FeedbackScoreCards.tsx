"use client";

import { alpha, Box, Card, CardContent, Typography } from "@mui/material";

function formatScore(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

function ScoreCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | null | undefined;
  accent: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800, mb: 1 }}>
          {label}
        </Typography>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 0.75,
            px: 1.5,
            py: 0.85,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.07),
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 900, color: accent, lineHeight: 1 }}>
            {formatScore(value)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            /100
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export function FeedbackScoreCards({
  technicalScore,
  communicationScore,
  problemSolvingScore,
  projectUnderstandingScore,
  overallScore,
}: {
  technicalScore: number | null;
  communicationScore: number | null;
  problemSolvingScore: number | null;
  projectUnderstandingScore: number | null;
  overallScore: number | null;
}) {
  const cards = [
    { label: "Technical", value: technicalScore, accent: "primary.main" },
    { label: "Communication", value: communicationScore, accent: "info.main" },
    {
      label: "Problem Solving",
      value: problemSolvingScore,
      accent: "warning.main",
    },
    {
      label: "Project Understanding",
      value: projectUnderstandingScore,
      accent: "secondary.main",
    },
    { label: "Overall", value: overallScore, accent: "success.main" },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(5, minmax(0, 1fr))",
        },
        gap: 2,
      }}
    >
      {cards.map((card) => (
        <ScoreCard
          key={card.label}
          label={card.label}
          value={card.value}
          accent={card.accent}
        />
      ))}
    </Box>
  );
}
