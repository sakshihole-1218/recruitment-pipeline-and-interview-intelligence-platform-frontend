"use client";

import { alpha, Grid, Paper, Stack, Typography } from "@mui/material";
import {
  PsychologyAlt as AiScoreIcon,
  PersonOutlined as CandidateIcon,
  FactCheckOutlined as DecisionIcon,
  AssignmentIndOutlined as RecommendationIcon,
  FlagOutlined as StageIcon,
} from "@mui/icons-material";

import type { DecisionSummaryMetrics } from "@/features/decisions/types/decision.types";

const CARD_CONFIG = [
  {
    key: "candidateName",
    label: "Candidate",
    icon: CandidateIcon,
    color: "#1565c0",
  },
  {
    key: "resumeScore",
    label: "Resume AI Score",
    icon: AiScoreIcon,
    color: "#2e7d32",
  },
  {
    key: "interviewScore",
    label: "Interview Score",
    icon: DecisionIcon,
    color: "#ef6c00",
  },
  {
    key: "humanRecommendation",
    label: "Human Recommendation",
    icon: RecommendationIcon,
    color: "#6a1b9a",
  },
  {
    key: "currentStage",
    label: "Current Stage",
    icon: StageIcon,
    color: "#b71c1c",
  },
] as const;

export function DecisionSummaryCards({
  metrics,
}: {
  metrics: DecisionSummaryMetrics;
}) {
  return (
    <Grid container spacing={2}>
      {CARD_CONFIG.map((card) => {
        const Icon = card.icon;
        const value = metrics[card.key];

        return (
          <Grid key={card.key} size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                p: 2.25,
                height: "100%",
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
                  <Stack
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2.25,
                      bgcolor: alpha(card.color, 0.12),
                      color: card.color,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon fontSize="small" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                    {card.label}
                  </Typography>
                </Stack>
                <Typography sx={{ fontWeight: 900, fontSize: "1rem", lineHeight: 1.35 }}>
                  {value}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}
