"use client";

import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  Mic as MicIcon,
  NavigateNext as NavigateNextIcon,
  PsychologyAlt as AiIcon,
} from "@mui/icons-material";

import { AppSnackbar } from "@/components/app-snackbar";
import { ROUTES } from "@/constants/routes";
import { useSnackbar } from "@/hooks/use-snackbar";
import { useApplication } from "@/features/applications/hooks/use-applications";
import { AiInterviewerPanel } from "@/features/ai-interview/components/ai-interviewer-panel";
import { CameraPreview } from "@/features/ai-interview/components/camera-preview";
import { CandidateVoiceAnswerBox } from "@/features/ai-interview/components/candidate-voice-answer-box";
import { CurrentQuestionPanel } from "@/features/ai-interview/components/current-question-panel";
import { InterviewEngineProvider } from "@/features/ai-interview/context/interview-engine-context";
import { useInterviewEngine } from "@/features/ai-interview/hooks/use-interview-engine";
import { InterviewProgressBar } from "@/features/ai-interview/components/interview-progress-bar";
import { QuestionContextCard } from "@/features/ai-interview/components/question-context-card";
import { TranscriptPanel } from "@/features/ai-interview/components/transcript-panel";
import {
  useEndAiInterviewSession,
  useEnsureAiInterviewSession,
  useStartAiInterviewSession,
} from "@/features/ai-interview/hooks/use-ai-interview";
import { useBrowserTextToSpeech } from "@/features/ai-interview/hooks/useBrowserTextToSpeech";
import { useGenerateInterviewPlan } from "@/features/ai-interview/hooks/use-interview-questions";
import type {
  AiInterviewAnswerSubmissionResult,
  AiInterviewRoomState,
  AiInterviewSessionResponse,
} from "@/features/ai-interview/types/ai-interview.types";
import { useCandidate } from "@/features/candidates/hooks/use-candidates";
import { useInterview } from "@/features/interviews/hooks/use-interviews";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import { getApiErrorMessage } from "@/utils/api-error-handler";

function buildCandidateName(firstName?: string | null, lastName?: string | null) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || "Candidate";
}

function getApiErrorCode(error: unknown): string | undefined {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as
      | { error?: { code?: string }; code?: string }
      | undefined;

    return responseData?.error?.code || responseData?.code;
  }

  return undefined;
}

const INTERVIEW_STATE_COPY: Record<
  AiInterviewRoomState,
  { label: string; description: string; answerBoxMessage: string }
> = {
  AI_SPEAKING: {
    label: "Question playing",
    description: "Please listen to the current question.",
    answerBoxMessage:
      "Please wait for the question to finish playing before recording the answer.",
  },
  WAITING_FOR_ANSWER: {
    label: "Ready for answer",
    description: "You can now record and submit your answer.",
    answerBoxMessage:
      "Recording is enabled. Submit the answer once you finish speaking.",
  },
  RECORDING: {
    label: "Recording",
    description: "Your answer is being recorded.",
    answerBoxMessage:
      "Recording is in progress. Stop recording when you finish speaking.",
  },
  TRANSCRIBING: {
    label: "Processing answer",
    description: "Your answer is being processed.",
    answerBoxMessage:
      "Please wait while your answer is processed.",
  },
  GENERATING_FOLLOWUP: {
    label: "Analyzing answer",
    description: "AI is analyzing the latest answer and checking for a follow-up question.",
    answerBoxMessage:
      "AI is analyzing your answer. Recording is temporarily disabled.",
  },
  FOLLOWUP_READY: {
    label: "Next question ready",
    description: "The next question is ready and will start automatically.",
    answerBoxMessage:
      "The next question is ready and will start automatically.",
  },
  MOVING_NEXT: {
    label: "Loading next question",
    description: "Your answer was saved. Moving to the next question.",
    answerBoxMessage:
      "Your answer was saved. Moving to the next question automatically.",
  },
  COMPLETED: {
    label: "Interview completed",
    description: "All questions are complete. You can now finish the interview.",
    answerBoxMessage:
      "All questions are complete. Review the transcript and end the interview when ready.",
  },
};

function logInterviewEvent(event: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (details) {
    console.debug(`[AI Interview] ${event}`, details);
    return;
  }

  console.debug(`[AI Interview] ${event}`);
}

export function AiInterviewRoomPage({ id }: { id: string }) {
  const router = useRouter();
  const { snackbar, showError, closeSnackbar } = useSnackbar();
  const hasStartedSessionRef = useRef(false);
  const generatedPlanSessionIdRef = useRef<string | null>(null);
  const [questionPlanReadySessionId, setQuestionPlanReadySessionId] = useState<string | null>(null);
  const [questionPlanError, setQuestionPlanError] = useState("");

  const interviewQuery = useInterview(id);
  const interview = interviewQuery.data?.data;

  const applicationQuery = useApplication(interview?.application_id ?? "");
  const application = applicationQuery.data?.data;

  const candidateQuery = useCandidate(application?.candidate_id ?? "");
  const candidate = candidateQuery.data?.data;

  const jobOpeningQuery = useJobOpening(application?.job_opening_id ?? "");
  const jobOpening = jobOpeningQuery.data?.data;

  const aiSessionQuery = useEnsureAiInterviewSession(id);
  const aiSession = aiSessionQuery.data;

  const startSessionMutation = useStartAiInterviewSession(id);
  const endInterviewMutation = useEndAiInterviewSession(id);
  const generateInterviewPlanMutation = useGenerateInterviewPlan(aiSession?.id ?? "");

  const candidateName = useMemo(
    () => buildCandidateName(candidate?.first_name, candidate?.last_name),
    [candidate?.first_name, candidate?.last_name],
  );

  useEffect(() => {
    if (!aiSession) {
      hasStartedSessionRef.current = false;
      generatedPlanSessionIdRef.current = null;
      return;
    }

    if (aiSession.session_status === "IN_PROGRESS") {
      return;
    }

    if (aiSession.session_status !== "READY") {
      return;
    }

    if (hasStartedSessionRef.current || startSessionMutation.isPending) {
      return;
    }

    hasStartedSessionRef.current = true;

    startSessionMutation.mutate(aiSession.id, {
      onError: (error) => {
        hasStartedSessionRef.current = false;
        showError(getApiErrorMessage(error));
      },
    });
  }, [aiSession, showError, startSessionMutation]);

  useEffect(() => {
    if (!aiSession) {
      return;
    }

    if (aiSession.question_generation_status === "COMPLETED") {
      return;
    }

    if (aiSession.question_generation_status === "FAILED") {
      return;
    }

    if (aiSession.session_status !== "IN_PROGRESS") {
      return;
    }

    if (
      generatedPlanSessionIdRef.current === aiSession.id ||
      generateInterviewPlanMutation.isPending
    ) {
      return;
    }

    generatedPlanSessionIdRef.current = aiSession.id;

    generateInterviewPlanMutation.mutate(undefined, {
      onSuccess: async () => {
        setQuestionPlanError("");
        setQuestionPlanReadySessionId(aiSession.id);
        await aiSessionQuery.refetch();
      },
      onError: async (error) => {
        const errorCode = getApiErrorCode(error);

        if (
          errorCode === "AI_INTERVIEW_QUESTIONS_ALREADY_EXIST" ||
          errorCode === "AI_INTERVIEW_PLAN_ALREADY_GENERATED"
        ) {
          setQuestionPlanError("");
          setQuestionPlanReadySessionId(aiSession.id);
          await aiSessionQuery.refetch();
          return;
        }

        const message = getApiErrorMessage(error);
        setQuestionPlanError(message);
        showError(message);
      },
    });
  }, [aiSession, aiSessionQuery, generateInterviewPlanMutation, showError]);

  const handleRetryQuestionPlan = async () => {
    if (!aiSession) {
      return;
    }

    generatedPlanSessionIdRef.current = null;
    setQuestionPlanError("");
    await aiSessionQuery.refetch();
  };

  const handleEndInterview = async () => {
    const sessionId = aiSession?.id;

    if (!sessionId) {
      router.push(`${ROUTES.INTERVIEWS}/${id}/ai-room/completed`);
      return;
    }

    try {
      await endInterviewMutation.mutateAsync(sessionId);
    } catch (error) {
      showError(getApiErrorMessage(error));
      throw error;
    }

    router.push(`${ROUTES.INTERVIEWS}/${id}/ai-room/completed`);
  };

  const pageError =
    (interviewQuery.isError && getApiErrorMessage(interviewQuery.error)) ||
    (aiSessionQuery.isError && getApiErrorMessage(aiSessionQuery.error)) ||
    (startSessionMutation.isError &&
      getApiErrorMessage(startSessionMutation.error)) ||
    (aiSession?.question_generation_status === "FAILED"
      ? "Interview question setup failed for this session. Please retry question setup."
      : "") ||
    questionPlanError ||
    "";

  const isQuestionPlanReady = Boolean(
    aiSession &&
      (aiSession.question_generation_status === "COMPLETED" ||
        questionPlanReadySessionId === aiSession.id),
  );

  const isPreparing =
    interviewQuery.isLoading ||
    aiSessionQuery.isLoading ||
    startSessionMutation.isPending ||
    generateInterviewPlanMutation.isPending ||
    !aiSession ||
    aiSession.session_status !== "IN_PROGRESS" ||
    !isQuestionPlanReady;

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto", minHeight: "calc(100vh - 140px)" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.INTERVIEWS} underline="hover" color="inherit">
          Interviews
        </Link>
        <Link component={NextLink} href={`${ROUTES.INTERVIEWS}/${id}`} underline="hover" color="inherit">
          Interview Details
        </Link>
        <Link component={NextLink} href={`${ROUTES.INTERVIEWS}/${id}/ai-room`} underline="hover" color="inherit">
          AI Interview Lobby
        </Link>
        <Typography color="text.primary">AI Interview Session</Typography>
      </Breadcrumbs>

      {pageError ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={2}>
              <Alert severity="error">{pageError}</Alert>
              <Button
                variant="outlined"
                onClick={() => router.push(`${ROUTES.INTERVIEWS}/${id}/ai-room`)}
                sx={{ alignSelf: "flex-start", borderRadius: 2, fontWeight: 800 }}
              >
                Back to Lobby
              </Button>
              {questionPlanError ? (
                <Button
                  variant="contained"
                  onClick={handleRetryQuestionPlan}
                  sx={{ alignSelf: "flex-start", borderRadius: 2, fontWeight: 800 }}
                >
                  Retry Question Setup
                </Button>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      ) : isPreparing ? (
        <InterviewRoomLoadingState />
      ) : aiSession ? (
        <InterviewEngineProvider sessionId={aiSession.id} onError={showError}>
          <AiInterviewRoomContent
            session={aiSession}
            candidateName={candidateName}
            candidateLoading={candidateQuery.isLoading}
            jobOpeningTitle={jobOpening?.title ?? "-"}
            jobOpeningLoading={jobOpeningQuery.isLoading}
            onEndInterview={handleEndInterview}
            endPending={endInterviewMutation.isPending}
          />
        </InterviewEngineProvider>
      ) : null}

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}

function AiInterviewRoomContent({
  session,
  candidateName,
  candidateLoading,
  jobOpeningTitle,
  jobOpeningLoading,
  onEndInterview,
  endPending,
}: {
  session: AiInterviewSessionResponse;
  candidateName: string;
  candidateLoading: boolean;
  jobOpeningTitle: string;
  jobOpeningLoading: boolean;
  onEndInterview: () => Promise<void>;
  endPending: boolean;
}) {
  const engine = useInterviewEngine();
  const questionSpeech = useBrowserTextToSpeech();
  const {
    isPaused,
    isSpeaking,
    isSupported,
    pause,
    resume,
    speak,
    stop,
  } = questionSpeech;
  const [interviewState, setInterviewState] = useState<AiInterviewRoomState>("WAITING_FOR_ANSWER");
  const autoSpokenQuestionIdsRef = useRef<Set<string>>(new Set());
  const activeSpeechQuestionIdRef = useRef<string | null>(null);

  const speakQuestion = useCallback(
    (questionId: string, questionText: string) => {
      logInterviewEvent("Speak question requested", {
        questionId,
        preview: questionText.slice(0, 80),
      });
      activeSpeechQuestionIdRef.current = questionId;

      if (!isSupported || !questionText.trim()) {
        setInterviewState("WAITING_FOR_ANSWER");
        return;
      }

      setInterviewState("AI_SPEAKING");
      stop();
      speak(questionText, {
        onStart: () => {
          if (activeSpeechQuestionIdRef.current === questionId) {
            logInterviewEvent("Question playback started", { questionId });
            setInterviewState("AI_SPEAKING");
          }
        },
        onEnd: () => {
          if (activeSpeechQuestionIdRef.current === questionId && !engine.isCompleted) {
            logInterviewEvent("Question playback ended", { questionId });
            setInterviewState("WAITING_FOR_ANSWER");
          }
        },
        onError: () => {
          if (activeSpeechQuestionIdRef.current === questionId && !engine.isCompleted) {
            logInterviewEvent("Question playback errored", { questionId });
            setInterviewState("WAITING_FOR_ANSWER");
          }
        },
      });
    },
    [engine.isCompleted, isSupported, speak, stop],
  );

  useEffect(() => {
    return () => {
      activeSpeechQuestionIdRef.current = null;
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (engine.isCompleted) {
      activeSpeechQuestionIdRef.current = null;
      stop();
      return;
    }

    if (!engine.currentQuestion) {
      return;
    }

    if (
      interviewState === "TRANSCRIBING" ||
      interviewState === "GENERATING_FOLLOWUP"
    ) {
      return;
    }

    if (autoSpokenQuestionIdsRef.current.has(engine.currentQuestion.id)) {
      return;
    }

    autoSpokenQuestionIdsRef.current.add(engine.currentQuestion.id);
    speakQuestion(engine.currentQuestion.id, engine.currentQuestion.question_text);
  }, [
    engine.currentQuestion,
    engine.currentQuestionHasCandidateAnswer,
    engine.isCompleted,
    interviewState,
    isPaused,
    isSpeaking,
    speakQuestion,
    stop,
  ]);

  const handleReplayQuestion = useCallback(() => {
    if (!engine.currentQuestion) {
      return;
    }

    logInterviewEvent("Replay question", {
      questionId: engine.currentQuestion.id,
    });
    speakQuestion(engine.currentQuestion.id, engine.currentQuestion.question_text);
  }, [engine.currentQuestion, speakQuestion]);

  const handleRecordingStateChange = useCallback(
    (isRecording: boolean) => {
      logInterviewEvent("Recording state changed", { isRecording });
      if (isRecording) {
        setInterviewState("RECORDING");
        return;
      }

      setInterviewState((currentState) =>
        currentState === "RECORDING" ? "WAITING_FOR_ANSWER" : currentState,
      );
    },
    [],
  );

  const handleTranscriptionStart = useCallback(() => {
    logInterviewEvent("Answer submission started");
    setInterviewState("TRANSCRIBING");
  }, []);

  const handleTranscriptionError = useCallback(() => {
    logInterviewEvent("Answer submission failed");
    setInterviewState("WAITING_FOR_ANSWER");
  }, []);

  const handleAnswerProcessed = useCallback(
    (result: AiInterviewAnswerSubmissionResult) => {
      logInterviewEvent("Answer processed", {
        nextStep: result.nextStep,
        generatedFollowUpQuestionId: result.generatedFollowUpQuestionId,
      });
      if (result.nextStep === "FOLLOWUP_READY") {
        setInterviewState("FOLLOWUP_READY");
        return;
      }

      if (result.nextStep === "COMPLETED") {
        setInterviewState("COMPLETED");
        return;
      }

      setInterviewState("MOVING_NEXT");
    },
    [],
  );

  const effectiveInterviewState = engine.isCompleted
    ? "COMPLETED"
    : engine.isGeneratingFollowUp
      ? "GENERATING_FOLLOWUP"
      : engine.currentQuestionHasCandidateAnswer
      ? "MOVING_NEXT"
      : interviewState;
  const stateCopy = INTERVIEW_STATE_COPY[effectiveInterviewState];
  useEffect(() => {
    logInterviewEvent("Interview state changed", {
      state: effectiveInterviewState,
      questionId: engine.currentQuestion?.id ?? null,
      rootQuestionIndex: engine.rootQuestionIndex,
      followUpDepth: engine.currentFollowUpDepth,
      answeredQuestions: engine.answeredQuestions,
      totalQuestions: engine.totalQuestions,
    });
  }, [
    effectiveInterviewState,
    engine.answeredQuestions,
    engine.currentFollowUpDepth,
    engine.currentQuestion?.id,
    engine.rootQuestionIndex,
    engine.totalQuestions,
  ]);
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
    effectiveInterviewState !== "AI_SPEAKING" &&
    effectiveInterviewState !== "TRANSCRIBING" &&
    effectiveInterviewState !== "GENERATING_FOLLOWUP" &&
    effectiveInterviewState !== "FOLLOWUP_READY" &&
    effectiveInterviewState !== "MOVING_NEXT" &&
    effectiveInterviewState !== "COMPLETED";

  if (engine.errorMessage) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Alert severity="error">{engine.errorMessage}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (engine.isLoading) {
    return (
      <InterviewRoomLoadingState
        title="Loading interview data..."
        description="We're fetching interview questions and transcripts for this session."
      />
    );
  }

  return (
    <Stack spacing={3} sx={{ minHeight: "calc(100vh - 220px)" }}>
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
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Session Details
              </Typography>
              <Chip
                icon={<AiIcon />}
                label={`${session.session_code} • ${session.session_status}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`${engine.answeredQuestions}/${engine.totalQuestions || 0} answered`}
                variant="outlined"
              />
              <Chip icon={<MicIcon />} label="Voice mode" variant="outlined" />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Candidate: {candidateLoading ? "Loading..." : candidateName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Job Opening: {jobOpeningLoading ? "Loading..." : jobOpeningTitle}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <InterviewProgressBar
        questionLabel={engine.currentQuestionLabel}
        answeredQuestions={engine.answeredQuestions}
        totalQuestions={engine.totalQuestions}
        progressPercent={engine.progressPercent}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1.1fr 0.9fr 1fr" },
          gap: 3,
          alignItems: "stretch",
          minHeight: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <CameraPreview />
        </Box>

        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
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
            onReplayQuestion={handleReplayQuestion}
            onStopSpeaking={stop}
            onPauseSpeaking={pause}
            onResumeSpeaking={resume}
          />
          <QuestionContextCard
            currentQuestion={engine.currentQuestion}
            isFollowUp={engine.isCurrentQuestionFollowUp}
          />
          <AiInterviewerPanel />
        </Stack>

        <Box sx={{ minWidth: 0, minHeight: 0 }}>
          <TranscriptPanel
            questions={engine.questions}
            transcriptEntries={engine.transcriptEntries}
          />
        </Box>
      </Box>

      <CandidateVoiceAnswerBox
        disabled={!engine.currentQuestion || engine.isBusy || effectiveInterviewState === "COMPLETED"}
        canRecord={!isRecordingDisabled}
        canSubmit={canSubmitAnswer}
        interviewState={effectiveInterviewState}
        statusMessage={stateCopy.answerBoxMessage}
        isAiSpeaking={isSpeaking || isPaused}
        speechWarningMessage="Please wait until the AI interviewer finishes speaking before starting the recording."
        submitPending={engine.isBusy}
        hasAnsweredCurrentQuestion={engine.currentQuestionHasCandidateAnswer}
        onRecordingStateChange={handleRecordingStateChange}
        onTranscriptionStart={handleTranscriptionStart}
        onTranscriptionSuccess={handleAnswerProcessed}
        onSubmitError={handleTranscriptionError}
        onSubmitManualAnswer={engine.submitAnswer}
        onSubmitAudioAnswer={engine.submitAudioAnswer}
      />

      <InterviewFooterControls
        onEndInterview={onEndInterview}
        endPending={endPending}
        onStopSpeaking={stop}
        isCompleted={engine.isCompleted}
      />
    </Stack>
  );
}

function InterviewRoomLoadingState({
  title = "Preparing your interview session...",
  description = "We're getting the AI interview session ready without LiveKit.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Stack
      spacing={2}
      sx={{
        minHeight: 420,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
        p: 4,
      }}
    >
      <CircularProgress />
      <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Stack>
  );
}

function InterviewFooterControls({
  onEndInterview,
  endPending,
  onStopSpeaking,
  isCompleted,
}: {
  onEndInterview: () => Promise<void>;
  endPending: boolean;
  onStopSpeaking: () => void;
  isCompleted: boolean;
}) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={{
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "flex-end",
        p: 2,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Button
        variant="contained"
        color="error"
        onClick={async () => {
          onStopSpeaking();
          await onEndInterview();
        }}
        disabled={endPending}
        sx={{ borderRadius: 2, fontWeight: 900, minWidth: 180 }}
      >
        {endPending
          ? "Ending..."
          : isCompleted
            ? "Finish Interview"
            : "End Interview Early"}
      </Button>
    </Stack>
  );
}
