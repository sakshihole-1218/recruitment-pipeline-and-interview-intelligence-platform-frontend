"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useGenerateFollowUpQuestion,
  useInterviewQuestions,
  useMarkInterviewQuestionAnswered,
  useMarkInterviewQuestionAsked,
} from "@/features/ai-interview/hooks/use-interview-questions";
import {
  useCreateInterviewTranscript,
  useInterviewTranscripts,
  useTranscribeInterviewAnswer,
} from "@/features/ai-interview/hooks/use-interview-transcripts";
import type {
  AiInterviewQuestionResponse,
  AiInterviewTranscriptEntryResponse,
  TranscribeAiInterviewAnswerPayload,
} from "@/features/ai-interview/types/ai-interview.types";
import type { RecordedAudio } from "@/features/ai-interview/components/audio-recorder";
import { getApiErrorMessage } from "@/utils/api-error-handler";

interface InterviewEngineContextValue {
  currentQuestion: AiInterviewQuestionResponse | null;
  currentQuestionLabel: string;
  isCurrentQuestionFollowUp: boolean;
  rootQuestionIndex: number;
  rootQuestions: AiInterviewQuestionResponse[];
  followUpQueue: AiInterviewQuestionResponse[];
  transcriptEntries: AiInterviewTranscriptEntryResponse[];
  totalQuestions: number;
  answeredQuestions: number;
  progressPercent: number;
  isBusy: boolean;
  isLoading: boolean;
  errorMessage: string;
  submitAnswer: (messageText: string) => Promise<void>;
  submitAudioAnswer: (recording: RecordedAudio) => Promise<void>;
  advanceToNextQuestion: () => Promise<void>;
  canAdvanceToNextQuestion: boolean;
}

const InterviewEngineContext = createContext<InterviewEngineContextValue | null>(
  null,
);

interface InterviewEngineProviderProps {
  sessionId: string;
  children: React.ReactNode;
  onError: (message: string) => void;
}

function getRootQuestions(questions: AiInterviewQuestionResponse[]) {
  return questions.filter((question) => !question.parent_question_id);
}

function nextUniqueQuestionQueue(
  queue: AiInterviewQuestionResponse[],
  question: AiInterviewQuestionResponse,
) {
  if (queue.some((item) => item.id === question.id)) {
    return queue;
  }

  return [...queue, question];
}

export function InterviewEngineProvider({
  sessionId,
  children,
  onError,
}: InterviewEngineProviderProps) {
  const [rootQuestionIndex, setRootQuestionIndex] = useState(0);
  const [followUpQueue, setFollowUpQueue] = useState<AiInterviewQuestionResponse[]>(
    [],
  );
  const [pendingAdvance, setPendingAdvance] = useState<{
    question: AiInterviewQuestionResponse;
    candidateAnswer: string;
  } | null>(null);

  const postedInterviewerQuestionsRef = useRef<Set<string>>(new Set());

  const questionsQuery = useInterviewQuestions(sessionId);
  const transcriptQuery = useInterviewTranscripts(sessionId);
  const createTranscriptMutation = useCreateInterviewTranscript(sessionId);
  const transcribeAnswerMutation = useTranscribeInterviewAnswer(sessionId);
  const markQuestionAskedMutation = useMarkInterviewQuestionAsked(sessionId);
  const markQuestionAnsweredMutation = useMarkInterviewQuestionAnswered(sessionId);
  const generateFollowUpMutation = useGenerateFollowUpQuestion(sessionId);

  const questions = useMemo(() => questionsQuery.data ?? [], [questionsQuery.data]);
  const transcriptEntries = useMemo(
    () => transcriptQuery.data ?? [],
    [transcriptQuery.data],
  );
  const rootQuestions = useMemo(() => getRootQuestions(questions), [questions]);

  const effectiveRootQuestionIndex = rootQuestions.length
    ? Math.min(rootQuestionIndex, rootQuestions.length - 1)
    : 0;

  const currentRootQuestion = rootQuestions[effectiveRootQuestionIndex] ?? null;
  const currentQuestion = followUpQueue[0] ?? currentRootQuestion;
  const isCurrentQuestionFollowUp = Boolean(currentQuestion?.is_follow_up);
  const totalQuestions = rootQuestions.length;

  const answeredQuestions = useMemo(() => {
    const answeredIds = new Set(
      transcriptEntries
        .filter((entry) => entry.speaker_type === "CANDIDATE")
        .map((entry) => entry.ai_interview_question_id)
        .filter((questionId): questionId is string => Boolean(questionId)),
    );

    return answeredIds.size;
  }, [transcriptEntries]);

  const currentQuestionLabel = isCurrentQuestionFollowUp
    ? "Follow-up Question"
    : totalQuestions
      ? `Question ${effectiveRootQuestionIndex + 1}`
      : "Question";

  const progressPercent = totalQuestions
    ? Math.min((answeredQuestions / totalQuestions) * 100, 100)
    : 0;
  const canAdvanceToNextQuestion = pendingAdvance?.question.id === currentQuestion?.id;

  const errorMessage =
    (questionsQuery.isError && getApiErrorMessage(questionsQuery.error)) ||
    (transcriptQuery.isError && getApiErrorMessage(transcriptQuery.error)) ||
    "";

  const proceedAfterQuestion = useCallback(
    async (
      question: AiInterviewQuestionResponse,
      candidateAnswer: string,
      currentQueue: AiInterviewQuestionResponse[],
    ) => {
      let shouldAdvanceRoot = false;
      let nextQueue = currentQueue;

      if (question.is_follow_up) {
        nextQueue = currentQueue.slice(1);
      }

      try {
        const response = await generateFollowUpMutation.mutateAsync({
          ai_interview_session_id: sessionId,
          ai_interview_question_id: question.id,
          candidate_answer: candidateAnswer,
        });

        if (response.data.should_generate_follow_up && response.data.follow_up_question) {
          nextQueue = nextUniqueQuestionQueue(
            nextQueue,
            response.data.follow_up_question,
          );
        } else if (question.is_follow_up) {
          shouldAdvanceRoot = nextQueue.length === 0;
        } else {
          shouldAdvanceRoot = true;
        }
      } catch (error) {
        onError(
          `${getApiErrorMessage(error)} Moving to the next root question.`,
        );

        if (question.is_follow_up) {
          shouldAdvanceRoot = nextQueue.length === 0;
        } else {
          shouldAdvanceRoot = true;
        }
      }

      setFollowUpQueue(nextQueue);

      if (shouldAdvanceRoot) {
        setRootQuestionIndex((currentIndex) => currentIndex + 1);
      }
    },
    [generateFollowUpMutation, onError, sessionId],
  );

  const submitAnswer = useCallback(
    async (messageText: string) => {
      if (!currentQuestion || pendingAdvance) return;

      const trimmed = messageText.trim();
      if (!trimmed) return;

      try {
        await createTranscriptMutation.mutateAsync({
          ai_interview_session_id: sessionId,
          ai_interview_question_id: currentQuestion.id,
          speaker_type: "CANDIDATE",
          message_text: trimmed,
        });
      } catch (error) {
        const message = getApiErrorMessage(error);
        onError(message);
        throw error;
      }

      try {
        await markQuestionAnsweredMutation.mutateAsync(currentQuestion.id);
      } catch (error) {
        onError(getApiErrorMessage(error));
      }

      setPendingAdvance({
        question: currentQuestion,
        candidateAnswer: trimmed,
      });
    },
    [
      createTranscriptMutation,
      currentQuestion,
      markQuestionAnsweredMutation,
      onError,
      pendingAdvance,
      sessionId,
    ],
  );

  const submitAudioAnswer = useCallback(
    async (recording: RecordedAudio) => {
      if (!currentQuestion || pendingAdvance) return;

      let response;

      try {
        const payload: TranscribeAiInterviewAnswerPayload = {
          ai_interview_session_id: sessionId,
          ai_interview_question_id: currentQuestion.id,
          audio: recording.blob,
          file_name: recording.fileName,
        };

        response = await transcribeAnswerMutation.mutateAsync(payload);
      } catch (error) {
        const message = getApiErrorMessage(error);
        onError(message);
        throw error;
      }

      setPendingAdvance({
        question: currentQuestion,
        candidateAnswer: response.data.message_text.trim(),
      });
    },
    [
      currentQuestion,
      onError,
      pendingAdvance,
      sessionId,
      transcribeAnswerMutation,
    ],
  );

  const advanceToNextQuestion = useCallback(async () => {
    if (!pendingAdvance) return;

    await proceedAfterQuestion(
      pendingAdvance.question,
      pendingAdvance.candidateAnswer,
      followUpQueue,
    );
    setPendingAdvance(null);
  }, [followUpQueue, pendingAdvance, proceedAfterQuestion]);

  useEffect(() => {
    if (!currentQuestion || !sessionId) return;

    const alreadyExists = transcriptEntries.some(
      (entry) =>
        entry.ai_interview_question_id === currentQuestion.id &&
        entry.speaker_type === "AI_INTERVIEWER" &&
        entry.message_text.trim() === currentQuestion.question_text.trim(),
    );

    if (alreadyExists || postedInterviewerQuestionsRef.current.has(currentQuestion.id)) {
      return;
    }

    postedInterviewerQuestionsRef.current.add(currentQuestion.id);

    Promise.allSettled([
      createTranscriptMutation.mutateAsync({
        ai_interview_session_id: sessionId,
        ai_interview_question_id: currentQuestion.id,
        speaker_type: "AI_INTERVIEWER",
        message_text: currentQuestion.question_text,
      }),
      markQuestionAskedMutation.mutateAsync(currentQuestion.id),
    ]).then((results) => {
      const rejectedResult = results.find(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      );

      if (rejectedResult) {
        postedInterviewerQuestionsRef.current.delete(currentQuestion.id);
        onError(getApiErrorMessage(rejectedResult.reason));
      }
    });
  }, [
    createTranscriptMutation,
    currentQuestion,
    markQuestionAskedMutation,
    onError,
    sessionId,
    transcriptEntries,
  ]);

  const value = useMemo<InterviewEngineContextValue>(
    () => ({
      currentQuestion,
      currentQuestionLabel,
      isCurrentQuestionFollowUp,
      rootQuestionIndex: effectiveRootQuestionIndex,
      rootQuestions,
      followUpQueue,
      transcriptEntries,
      totalQuestions,
      answeredQuestions,
      progressPercent,
      isBusy:
        createTranscriptMutation.isPending ||
        transcribeAnswerMutation.isPending ||
        markQuestionAskedMutation.isPending ||
        markQuestionAnsweredMutation.isPending ||
        generateFollowUpMutation.isPending,
      isLoading: questionsQuery.isLoading || transcriptQuery.isLoading,
      errorMessage,
      submitAnswer,
      submitAudioAnswer,
      advanceToNextQuestion,
      canAdvanceToNextQuestion,
    }),
    [
      advanceToNextQuestion,
      answeredQuestions,
      canAdvanceToNextQuestion,
      createTranscriptMutation.isPending,
      currentQuestion,
      currentQuestionLabel,
      effectiveRootQuestionIndex,
      errorMessage,
      followUpQueue,
      generateFollowUpMutation.isPending,
      isCurrentQuestionFollowUp,
      markQuestionAnsweredMutation.isPending,
      markQuestionAskedMutation.isPending,
      progressPercent,
      questionsQuery.isLoading,
      rootQuestions,
      submitAnswer,
      submitAudioAnswer,
      totalQuestions,
      transcriptEntries,
      transcribeAnswerMutation.isPending,
      transcriptQuery.isLoading,
    ],
  );

  return (
    <InterviewEngineContext.Provider value={value}>
      {children}
    </InterviewEngineContext.Provider>
  );
}

export function useInterviewEngineContext() {
  const context = useContext(InterviewEngineContext);

  if (!context) {
    throw new Error("useInterviewEngineContext must be used within InterviewEngineProvider");
  }

  return context;
}
