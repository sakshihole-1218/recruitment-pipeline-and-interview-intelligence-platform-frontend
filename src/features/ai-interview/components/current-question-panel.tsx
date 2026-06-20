"use client";

import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { HelpOutlined as QuestionIcon } from "@mui/icons-material";

import type { AiInterviewQuestionResponse } from "@/features/ai-interview/types/ai-interview.types";

interface CurrentQuestionPanelProps {
  currentQuestion: AiInterviewQuestionResponse | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestionLabel: string;
  isFollowUp: boolean;
}

export function CurrentQuestionPanel({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  currentQuestionLabel,
  isFollowUp,
}: CurrentQuestionPanelProps) {
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
            spacing={1.25}
            sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between" }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <QuestionIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Current Question
              </Typography>
            </Stack>

            <Chip
              label={
                isFollowUp
                  ? "Follow-up Question"
                  : totalQuestions
                    ? `Question ${currentQuestionIndex + 1} of ${totalQuestions}`
                    : "No questions"
              }
              color={isFollowUp ? "warning" : "primary"}
              variant={isFollowUp ? "filled" : "outlined"}
            />
          </Stack>

          {currentQuestion ? (
            <>
              <Typography variant="body2" color="text.secondary">
                {currentQuestionLabel}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Chip label={currentQuestion.topic} variant="outlined" />
                <Chip label={currentQuestion.difficulty_level} variant="outlined" />
                <Chip
                  label={isFollowUp ? "FOLLOW-UP" : currentQuestion.question_type}
                  color={isFollowUp ? "warning" : "default"}
                  variant="outlined"
                />
              </Stack>

              <Typography
                variant="h6"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "divider",
                  fontWeight: 700,
                }}
              >
                {currentQuestion.question_text}
              </Typography>
            </>
          ) : (
            <Typography
              variant="body1"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "grey.50",
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              No interview questions are available for this session yet.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
