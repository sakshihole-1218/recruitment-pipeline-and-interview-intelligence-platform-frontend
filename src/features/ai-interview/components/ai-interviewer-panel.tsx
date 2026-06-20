"use client";

import { Avatar, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { PsychologyAlt as AiIcon } from "@mui/icons-material";

export function AiInterviewerPanel() {
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
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}>
              <AiIcon />
            </Avatar>
            <Stack spacing={0.25}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                AI Interviewer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connected interface placeholder
              </Typography>
            </Stack>
          </Stack>

          <Chip
            label="Interview flow automation coming next"
            color="primary"
            variant="outlined"
            sx={{ alignSelf: "flex-start" }}
          />

          <Typography variant="body2" color="text.secondary">
            The real AI agent conversation, STT, and TTS are intentionally not part of this MVP.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
