"use client";

import { useEffect, useRef } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { SubtitlesOutlined as TranscriptIcon } from "@mui/icons-material";

import type {
  AiInterviewQuestionResponse,
  AiInterviewTranscriptEntryResponse,
} from "@/features/ai-interview/types/ai-interview.types";

interface TranscriptPanelProps {
  questions: AiInterviewQuestionResponse[];
  transcriptEntries: AiInterviewTranscriptEntryResponse[];
}

function getSpeakerLabel(speakerType: AiInterviewTranscriptEntryResponse["speaker_type"]) {
  if (speakerType === "AI_INTERVIEWER") return "AI";
  if (speakerType === "CANDIDATE") return "Candidate";
  return "System";
}

function getBubbleAlignment(
  speakerType: AiInterviewTranscriptEntryResponse["speaker_type"],
) {
  return speakerType === "CANDIDATE" ? "flex-end" : "flex-start";
}

export function TranscriptPanel({
  questions,
  transcriptEntries,
}: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const questionById = new Map(questions.map((question) => [question.id, question]));

  const orderedTranscriptEntries = transcriptEntries.filter((entry, index, entries) => {
    if (entry.speaker_type !== "AI_INTERVIEWER" || !entry.ai_interview_question_id) {
      return true;
    }

    return (
      entries.findIndex(
        (candidate) =>
          candidate.speaker_type === "AI_INTERVIEWER" &&
          candidate.ai_interview_question_id === entry.ai_interview_question_id &&
          candidate.message_text.trim() === entry.message_text.trim(),
      ) === index
    );
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [orderedTranscriptEntries]);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        minHeight: 360,
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 3, height: "100%" }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <TranscriptIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Transcript
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Interview transcripts refresh automatically after each spoken answer.
          </Typography>

          <Stack
            spacing={1.5}
            sx={{
              flex: 1,
              minHeight: 0,
              maxHeight: 460,
              overflowY: "auto",
              pr: 1,
            }}
          >
            {orderedTranscriptEntries.length ? (
              orderedTranscriptEntries.map((entry) => {
                const relatedQuestion = entry.ai_interview_question_id
                  ? questionById.get(entry.ai_interview_question_id) ?? null
                  : null;

                return (
                <Stack
                  key={entry.id}
                  spacing={0.75}
                  sx={{ alignItems: getBubbleAlignment(entry.speaker_type) }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "flex-start",
                      width: "100%",
                      justifyContent:
                        entry.speaker_type === "CANDIDATE" ? "flex-end" : "flex-start",
                    }}
                  >
                    {entry.speaker_type === "CANDIDATE" ? null : (
                      <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.main", fontSize: 12 }}>
                        {getSpeakerLabel(entry.speaker_type).slice(0, 1)}
                      </Avatar>
                    )}

                    <Box
                      sx={{
                        maxWidth: "85%",
                        px: 1.5,
                        py: 1.25,
                        borderRadius: 2.5,
                        bgcolor:
                          entry.speaker_type === "CANDIDATE"
                            ? "primary.main"
                            : (t) => t.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "grey.100",
                        color:
                          entry.speaker_type === "CANDIDATE"
                            ? "primary.contrastText"
                            : "text.primary",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mb: 0.5,
                          opacity: entry.speaker_type === "CANDIDATE" ? 0.85 : 0.7,
                          fontWeight: 700,
                        }}
                      >
                        {getSpeakerLabel(entry.speaker_type)}
                      </Typography>
                      {relatedQuestion?.is_follow_up ? (
                        <Chip
                          size="small"
                          label="Follow-up"
                          color="warning"
                          variant="outlined"
                          sx={{ mb: 0.75 }}
                        />
                      ) : null}
                      <Typography variant="body2">{entry.message_text}</Typography>
                    </Box>

                    {entry.speaker_type === "CANDIDATE" ? (
                      <Avatar sx={{ width: 28, height: 28, bgcolor: "secondary.main", fontSize: 12 }}>
                        C
                      </Avatar>
                    ) : null}
                  </Stack>
                </Stack>
                );
              })
            ) : (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No transcript entries yet. The first interviewer prompt will appear here once a question is loaded.
                </Typography>
              </Box>
            )}
            <Box ref={scrollRef} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
