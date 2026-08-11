"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";

import { AppSnackbar } from "@/components/app-snackbar";
import { useSnackbar } from "@/hooks/use-snackbar";
import { CameraPreview } from "@/features/ai-interview/components/camera-preview";
import { CandidateVoiceAnswerBox } from "@/features/ai-interview/components/candidate-voice-answer-box";
import { CurrentQuestionPanel } from "@/features/ai-interview/components/current-question-panel";
import { TranscriptPanel } from "@/features/ai-interview/components/transcript-panel";
import { useBrowserTextToSpeech } from "@/features/ai-interview/hooks/useBrowserTextToSpeech";
import type {
  AiInterviewAnswerSubmissionResult,
  AiInterviewRoomState,
} from "@/features/ai-interview/types/ai-interview.types";
import {
  useCandidateInterviewAccess,
  useCompleteCandidateInterview,
} from "@/features/candidate-interview/hooks/use-candidate-interview";
import {
  CandidateInterviewEngineProvider,
  useCandidateInterviewEngine,
} from "@/features/candidate-interview/context/candidate-interview-engine-context";
import { getApiErrorMessage } from "@/utils/api-error-handler";

const INTERVIEW_STATE_COPY: Record<
  AiInterviewRoomState,
  { label: string; description: string; answerBoxMessage: string }
> = {
  AI_SPEAKING: {
    label: "Question playing",
    description: "Please listen to the current question.",
    answerBoxMessage: "Please wait for the question to finish before recording.",
  },
  WAITING_FOR_ANSWER: {
    label: "Ready for answer",
    description: "You can now record and submit your answer.",
    answerBoxMessage: "Recording is enabled. Submit your answer when you finish speaking.",
  },
  RECORDING: {
    label: "Recording",
    description: "Your answer is being recorded.",
    answerBoxMessage: "Recording is in progress. Stop recording when finished.",
  },
  TRANSCRIBING: {
    label: "Processing answer",
    description: "Your answer is being processed.",
    answerBoxMessage: "Please wait while your answer is processed.",
  },
  GENERATING_FOLLOWUP: {
    label: "Analyzing answer",
    description: "AI is checking whether a follow-up question is needed.",
    answerBoxMessage: "AI is analyzing your answer. Recording is temporarily disabled.",
  },
  FOLLOWUP_READY: {
    label: "Next question ready",
    description: "The next question is ready and will start automatically.",
    answerBoxMessage: "The next question is ready and will start automatically.",
  },
  MOVING_NEXT: {
    label: "Loading next question",
    description: "Your answer was saved. Moving to the next question.",
    answerBoxMessage: "Your answer was saved. Moving to the next question automatically.",
  },
  COMPLETED: {
    label: "Interview completed",
    description: "All questions are complete. You can now finish the interview.",
    answerBoxMessage: "All questions are complete. Finish the interview when ready.",
  },
};

export function CandidateInterviewSessionPage({ token }: { token: string }) {
  const { snackbar, showError, closeSnackbar } = useSnackbar();
  const accessQuery = useCandidateInterviewAccess(token);
  const info = accessQuery.data?.data;

  if (accessQuery.isLoading) {
    return (
      <Stack spacing={2} sx={{ minHeight: "80vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
        <Typography>Preparing your interview session...</Typography>
      </Stack>
    );
  }

  if (accessQuery.isError || !info) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", p: 2 }}>
        <Alert severity="error">{getApiErrorMessage(accessQuery.error)}</Alert>
      </Box>
    );
  }

  return (
    <>
      <CandidateInterviewEngineProvider token={token} onError={showError}>
        <CandidateInterviewSessionContent token={token} candidateName={info.candidate.full_name} jobTitle={info.job_opening.title} />
      </CandidateInterviewEngineProvider>
      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </>
  );
}

function CandidateInterviewSessionContent({
  token,
  candidateName,
  jobTitle,
}: {
  token: string;
  candidateName: string;
  jobTitle: string;
}) {
  const router = useRouter();
  const engine = useCandidateInterviewEngine();
  const completeMutation = useCompleteCandidateInterview(token);
  const questionSpeech = useBrowserTextToSpeech();
  const { isPaused, isSpeaking, isSupported, pause, resume, speak, stop } = questionSpeech;
  const [interviewState, setInterviewState] = useState<AiInterviewRoomState>("WAITING_FOR_ANSWER");
  const [showTranscript, setShowTranscript] = useState(false);
  const autoSpokenQuestionIdsRef = useRef<Set<string>>(new Set());
  const activeSpeechQuestionIdRef = useRef<string | null>(null);

  const speakQuestion = useCallback(
    (questionId: string, questionText: string) => {
      activeSpeechQuestionIdRef.current = questionId;
      if (!isSupported || !questionText.trim()) {
        setInterviewState("WAITING_FOR_ANSWER");
        return;
      }
      setInterviewState("AI_SPEAKING");
      stop();
      speak(questionText, {
        onEnd: () => {
          if (activeSpeechQuestionIdRef.current === questionId && !engine.isCompleted) {
            setInterviewState("WAITING_FOR_ANSWER");
          }
        },
        onError: () => {
          if (activeSpeechQuestionIdRef.current === questionId && !engine.isCompleted) {
            setInterviewState("WAITING_FOR_ANSWER");
          }
        },
      });
    },
    [engine.isCompleted, isSupported, speak, stop],
  );

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    if (engine.isCompleted || !engine.currentQuestion) return;
    if (interviewState === "TRANSCRIBING" || interviewState === "GENERATING_FOLLOWUP") return;
    if (autoSpokenQuestionIdsRef.current.has(engine.currentQuestion.id)) return;
    autoSpokenQuestionIdsRef.current.add(engine.currentQuestion.id);
    speakQuestion(engine.currentQuestion.id, engine.currentQuestion.question_text);
  }, [engine.currentQuestion, engine.isCompleted, interviewState, speakQuestion]);

  const handleAnswerProcessed = useCallback((result: AiInterviewAnswerSubmissionResult) => {
    if (result.nextStep === "FOLLOWUP_READY") {
      setInterviewState("FOLLOWUP_READY");
      return;
    }
    if (result.nextStep === "COMPLETED") {
      setInterviewState("COMPLETED");
      return;
    }
    setInterviewState("MOVING_NEXT");
  }, []);

  const effectiveInterviewState = engine.isCompleted
    ? "COMPLETED"
    : engine.isGeneratingFollowUp
      ? "GENERATING_FOLLOWUP"
      : engine.currentQuestionHasCandidateAnswer
        ? "MOVING_NEXT"
        : interviewState;

  const stateCopy = INTERVIEW_STATE_COPY[effectiveInterviewState];
  const isRecordingDisabled =
    !engine.currentQuestion ||
    effectiveInterviewState === "AI_SPEAKING" ||
    effectiveInterviewState === "TRANSCRIBING" ||
    effectiveInterviewState === "GENERATING_FOLLOWUP" ||
    effectiveInterviewState === "FOLLOWUP_READY" ||
    effectiveInterviewState === "MOVING_NEXT" ||
    effectiveInterviewState === "COMPLETED";

  const canSubmitAnswer =
    Boolean(engine.currentQuestion) &&
    !engine.currentQuestionHasCandidateAnswer &&
    !isRecordingDisabled;

  if (engine.errorMessage) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", p: 2 }}>
        <Alert severity="error">{engine.errorMessage}</Alert>
      </Box>
    );
  }

  if (engine.isLoading) {
    return (
      <Stack spacing={2} sx={{ minHeight: "80vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
        <Typography>Loading interview questions and transcript...</Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto", p: 2, pb: { xs: 10, md: 12 } }}>
      <Stack spacing={3}>
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}
            >
              <Box>
                <Typography sx={{ fontWeight: 900 }}>{candidateName}</Typography>
                <Typography variant="body2" color="text.secondary">{jobTitle}</Typography>
              </Box>

              <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowTranscript((value) => !value)}
                  sx={{ borderRadius: 2, fontWeight: 900 }}
                >
                  {showTranscript ? "Hide Transcript" : "View Transcript"}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  disabled={completeMutation.isPending}
                  onClick={async () => {
                    stop();
                    await completeMutation.mutateAsync();
                    router.push(`/interview/join/${token}/completed`);
                  }}
                  sx={{ borderRadius: 2, fontWeight: 900 }}
                >
                  {completeMutation.isPending ? "Finishing..." : engine.isCompleted ? "Finish Interview" : "End Interview"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Stack spacing={3}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: 3,
              alignItems: "stretch",
            }}
          >
            <CameraPreview hideHelpText compact fillHeight />

            <CurrentQuestionPanel
              currentQuestion={engine.currentQuestion}
              currentQuestionIndex={engine.rootQuestionIndex}
              totalQuestions={engine.totalQuestions}
              answeredQuestions={engine.answeredQuestions}
              currentQuestionLabel={engine.currentQuestionLabel}
              currentFollowUpPosition={engine.currentFollowUpPosition}
              maxFollowUpsPerQuestion={engine.maxFollowUpsPerQuestion}
              isFollowUp={engine.isCurrentQuestionFollowUp}
              interviewState={effectiveInterviewState}
              interviewStateLabel={stateCopy.label}
              interviewStateDescription={stateCopy.description}
              isSpeechSupported={isSupported}
              isSpeaking={isSpeaking}
              isPaused={isPaused}
              onReplayQuestion={() => {
                if (engine.currentQuestion) {
                  speakQuestion(engine.currentQuestion.id, engine.currentQuestion.question_text);
                }
              }}
              onStopSpeaking={stop}
              onPauseSpeaking={pause}
              onResumeSpeaking={resume}
              fillHeight
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: 3,
              alignItems: "stretch",
            }}
          >
            <CandidateVoiceAnswerBox
              disabled={!engine.currentQuestion || engine.isBusy || effectiveInterviewState === "COMPLETED"}
              canRecord={!isRecordingDisabled}
              canSubmit={canSubmitAnswer}
              interviewState={effectiveInterviewState}
              statusMessage={stateCopy.answerBoxMessage}
              isAiSpeaking={isSpeaking || isPaused}
              speechWarningMessage="Please wait until the AI interviewer finishes speaking before recording."
              submitPending={engine.isBusy}
              hasAnsweredCurrentQuestion={engine.currentQuestionHasCandidateAnswer}
              onRecordingStateChange={(isRecording) => {
                if (isRecording) {
                  setInterviewState("RECORDING");
                  return;
                }
                setInterviewState((current) => current === "RECORDING" ? "WAITING_FOR_ANSWER" : current);
              }}
              onTranscriptionStart={() => setInterviewState("TRANSCRIBING")}
              onTranscriptionSuccess={handleAnswerProcessed}
              onSubmitError={() => setInterviewState("WAITING_FOR_ANSWER")}
              onSubmitManualAnswer={engine.submitAnswer}
              onSubmitAudioAnswer={engine.submitAudioAnswer}
              fillHeight
            />

            {showTranscript ? (
              <TranscriptPanel
                questions={engine.questions}
                transcriptEntries={engine.transcriptEntries}
                fillHeight
              />
            ) : (
              <Box sx={{ display: { xs: "none", lg: "block" } }} />
            )}
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
