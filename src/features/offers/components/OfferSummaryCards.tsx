"use client";

import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import {
  CheckCircleOutlined as AcceptedIcon,
  LocalOfferOutlined as DraftIcon,
  MailOutlined as SentIcon,
  HighlightOffOutlined as DeclinedIcon,
  ScheduleOutlined as ExpiredIcon,
} from "@mui/icons-material";

import type { OfferSummaryMetric } from "@/features/offers/types/offer.types";

const ICONS = {
  Draft: <DraftIcon sx={{ fontSize: 28 }} />,
  Sent: <SentIcon sx={{ fontSize: 28 }} />,
  Accepted: <AcceptedIcon sx={{ fontSize: 28 }} />,
  Declined: <DeclinedIcon sx={{ fontSize: 28 }} />,
  Expired: <ExpiredIcon sx={{ fontSize: 28 }} />,
} as const;

const TONES = {
  default: { color: "#455a64", bg: "#eceff1" },
  info: { color: "#1565c0", bg: "#e3f2fd" },
  success: { color: "#2e7d32", bg: "#e8f5e9" },
  warning: { color: "#ef6c00", bg: "#fff3e0" },
  error: { color: "#c62828", bg: "#ffebee" },
} as const;

export function OfferSummaryCards({ metrics }: { metrics: OfferSummaryMetric[] }) {
  return (
    <Grid container spacing={2}>
      {metrics.map((metric) => {
        const tone = TONES[metric.tone];

        return (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: tone.bg,
                        color: tone.color,
                      }}
                    >
                      {ICONS[metric.label as keyof typeof ICONS] ?? <DraftIcon sx={{ fontSize: 28 }} />}
                    </Box>
                  </Stack>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mt: 0.5, fontWeight: 800 }}>
                      {metric.label} Offers
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Snapshot from current backend records
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
