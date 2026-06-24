"use client";

import { alpha, Box, Chip, Stack, Typography } from "@mui/material";

import type { AiInterviewTranscriptEntryResponse } from "@/features/ai-interview/types/ai-interview.types";

function speakerLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function TranscriptViewer({
  transcripts,
}: {
  transcripts: AiInterviewTranscriptEntryResponse[];
}) {
  if (transcripts.length === 0) {
    return (
      <Box
        sx={{
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 3,
          p: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No transcript entries available yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {transcripts.map((entry) => {
        const isCandidate = entry.speaker_type === "CANDIDATE";

        return (
          <Box
            key={entry.id}
            sx={{
              borderRadius: 3,
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: (theme) =>
                isCandidate
                  ? alpha(theme.palette.success.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", flexWrap: "wrap", mb: 1 }}
            >
              <Chip
                size="small"
                label={speakerLabel(entry.speaker_type)}
                color={isCandidate ? "success" : "primary"}
                variant="outlined"
                sx={{ fontWeight: 800 }}
              />
              <Typography variant="caption" color="text.secondary">
                Seq #{entry.sequence_number}
              </Typography>
              {entry.spoken_at ? (
                <Typography variant="caption" color="text.secondary">
                  {new Date(entry.spoken_at).toLocaleString()}
                </Typography>
              ) : null}
            </Stack>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {entry.message_text}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}
