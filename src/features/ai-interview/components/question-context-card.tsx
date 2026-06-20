"use client";

import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";

import type { AiInterviewQuestionResponse } from "@/features/ai-interview/types/ai-interview.types";

interface QuestionContextCardProps {
  currentQuestion: AiInterviewQuestionResponse | null;
  isFollowUp: boolean;
}

export function QuestionContextCard({
  currentQuestion,
  isFollowUp,
}: QuestionContextCardProps) {
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
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Question Context
          </Typography>

          {currentQuestion ? (
            <>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Chip label={currentQuestion.topic} variant="outlined" />
                <Chip label={currentQuestion.difficulty_level} variant="outlined" />
                <Chip
                  label={isFollowUp ? "FOLLOW-UP" : currentQuestion.question_type}
                  color={isFollowUp ? "warning" : "primary"}
                  variant={isFollowUp ? "filled" : "outlined"}
                />
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Type: {currentQuestion.question_type}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Follow-up: {isFollowUp ? "Yes" : "No"}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Question context will appear once the interview engine loads a question.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
