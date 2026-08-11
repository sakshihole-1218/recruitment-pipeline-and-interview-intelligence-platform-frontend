"use client";

import { Alert, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { HelpOutlined as QuestionIcon } from "@mui/icons-material";

import { AiQuestionSpeaker } from "@/features/ai-interview/components/AiQuestionSpeaker";
import type {
  AiInterviewQuestionResponse,
  AiInterviewRoomState,
} from "@/features/ai-interview/types/ai-interview.types";

interface CurrentQuestionPanelProps {
  currentQuestion: AiInterviewQuestionResponse | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: number;
  currentQuestionLabel: string;
  currentFollowUpPosition: number;
  maxFollowUpsPerQuestion: number;
  isFollowUp: boolean;
  interviewState: AiInterviewRoomState;
  interviewStateLabel: string;
  interviewStateDescription: string;
  isSpeechSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  onReplayQuestion: () => void;
  onStopSpeaking: () => void;
  onPauseSpeaking: () => void;
  onResumeSpeaking: () => void;
  fillHeight?: boolean;
}

export function CurrentQuestionPanel({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  answeredQuestions,
  currentQuestionLabel,
  currentFollowUpPosition,
  maxFollowUpsPerQuestion,
  isFollowUp,
  interviewState,
  interviewStateLabel,
  interviewStateDescription,
  isSpeechSupported,
  isSpeaking,
  isPaused,
  onReplayQuestion,
  onStopSpeaking,
  onPauseSpeaking,
  onResumeSpeaking,
  fillHeight = false,
}: CurrentQuestionPanelProps) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        height: fillHeight ? "100%" : "auto",
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

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              <Chip
                label={
                  totalQuestions
                    ? `Question ${currentQuestionIndex + 1} of ${totalQuestions}`
                    : "No questions"
                }
                color="primary"
                variant="outlined"
              />
              {isFollowUp ? (
                <Chip
                  label={
                    currentFollowUpPosition > 0
                      ? `Follow-Up ${currentFollowUpPosition} of ${maxFollowUpsPerQuestion}`
                      : "Follow-Up"
                  }
                  color="warning"
                  variant="outlined"
                />
              ) : null}
              <Chip
                label={`${answeredQuestions}/${totalQuestions || 0} answered`}
                variant="outlined"
              />
              <Chip
                label={interviewStateLabel}
                color={interviewState === "COMPLETED" ? "success" : "default"}
                variant={interviewState === "AI_SPEAKING" ? "filled" : "outlined"}
              />
            </Stack>
          </Stack>

          <Alert severity={interviewState === "COMPLETED" ? "success" : "info"}>
            {interviewStateDescription}
          </Alert>

          {currentQuestion ? (
            <>
              <Typography variant="body2" color="text.secondary">
                {isFollowUp
                  ? `${currentQuestionLabel} - Follow-Up ${currentFollowUpPosition} of ${maxFollowUpsPerQuestion}`
                  : currentQuestionLabel}
              </Typography>
              <AiQuestionSpeaker
                questionId={currentQuestion.id}
                questionText={currentQuestion.question_text}
                isSupported={isSpeechSupported}
                isSpeaking={isSpeaking}
                isPaused={isPaused}
                onReplay={onReplayQuestion}
                stop={onStopSpeaking}
                pause={onPauseSpeaking}
                resume={onResumeSpeaking}
              />
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Chip label={currentQuestion.topic} variant="outlined" />
                <Chip label={currentQuestion.difficulty_level} variant="outlined" />
                <Chip
                  label={
                    isFollowUp
                      ? `FOLLOW-UP ${currentFollowUpPosition} OF ${maxFollowUpsPerQuestion}`
                      : currentQuestion.question_type
                  }
                  color={isFollowUp ? "warning" : "default"}
                  variant="outlined"
                />
              </Stack>

              <Typography
                variant="h6"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: (t) => t.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "grey.50",
                  border: "1px solid",
                  borderColor: "divider",
                  fontWeight: 700,
                }}
              >
                {currentQuestion.question_text}
              </Typography>

              {isSpeaking ? (
                <Alert severity="info">
                  AI Interviewer is speaking. Recording will be available once playback finishes.
                </Alert>
              ) : null}
            </>
          ) : (
            <Typography
              variant="body1"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: (t) => t.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "grey.50",
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              Interview questions are complete for this session.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
