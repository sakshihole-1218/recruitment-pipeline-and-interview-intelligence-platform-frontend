"use client";

import { AxiosError } from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
} from "@/features/ai-interview/hooks/use-interview-transcripts";
import { useTranscribeInterviewAnswer } from "@/features/ai-interview/hooks/use-interview-transcripts";
import type {
  AiInterviewAnswerNextStep,
  AiInterviewAnswerSubmissionResult,
  AiInterviewQuestionResponse,
  AiInterviewTranscriptEntryResponse,
  TranscribeAiInterviewAnswerPayload,
} from "@/features/ai-interview/types/ai-interview.types";
import type { RecordedAudio } from "@/features/ai-interview/components/audio-recorder";
import { getApiErrorMessage } from "@/utils/api-error-handler";

interface InterviewEngineContextValue {
  questions: AiInterviewQuestionResponse[];
  currentQuestion: AiInterviewQuestionResponse | null;
  currentQuestionLabel: string;
  currentFollowUpDepth: number;
  currentFollowUpPosition: number;
  maxFollowUpsPerQuestion: number;
  isCurrentQuestionFollowUp: boolean;
  rootQuestionIndex: number;
  rootQuestions: AiInterviewQuestionResponse[];
  transcriptEntries: AiInterviewTranscriptEntryResponse[];
  totalQuestions: number;
  answeredQuestions: number;
  progressPercent: number;
  isBusy: boolean;
  isLoading: boolean;
  isCompleted: boolean;
  isGeneratingFollowUp: boolean;
  currentQuestionHasCandidateAnswer: boolean;
  errorMessage: string;
  submitAnswer: (
    messageText: string,
  ) => Promise<AiInterviewAnswerSubmissionResult>;
  submitAudioAnswer: (
    recording: RecordedAudio,
  ) => Promise<AiInterviewAnswerSubmissionResult>;
}

const InterviewEngineContext = createContext<InterviewEngineContextValue | null>(
  null,
);

const MAX_FOLLOW_UPS_PER_QUESTION = 2;

interface InterviewEngineProviderProps {
  sessionId: string;
  children: React.ReactNode;
  onError: (message: string) => void;
}

function getRootQuestions(questions: AiInterviewQuestionResponse[]) {
  return questions.filter((question) => !question.parent_question_id);
}

function buildQuestionMap(questions: AiInterviewQuestionResponse[]) {
  return new Map(questions.map((question) => [question.id, question]));
}

function buildChildrenByParentId(questions: AiInterviewQuestionResponse[]) {
  const childrenByParentId = new Map<string, AiInterviewQuestionResponse[]>();

  questions.forEach((question) => {
    if (!question.parent_question_id) {
      return;
    }

    const existingChildren = childrenByParentId.get(question.parent_question_id) ?? [];
    existingChildren.push(question);
    existingChildren.sort((left, right) => left.sequence_number - right.sequence_number);
    childrenByParentId.set(question.parent_question_id, existingChildren);
  });

  return childrenByParentId;
}

function flattenQuestionTree(
  questions: AiInterviewQuestionResponse[],
  childrenByParentId: Map<string, AiInterviewQuestionResponse[]>,
) {
  const orderedQuestions: AiInterviewQuestionResponse[] = [];

  const appendQuestionBranch = (question: AiInterviewQuestionResponse) => {
    orderedQuestions.push(question);

    const children = childrenByParentId.get(question.id) ?? [];
    children.forEach(appendQuestionBranch);
  };

  questions.forEach(appendQuestionBranch);

  return orderedQuestions;
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

function isSkippableFollowUpError(error: unknown) {
  const errorCode = getApiErrorCode(error);

  return (
    errorCode === "AI_INTERVIEW_TRANSCRIPT_EMPTY" ||
    errorCode === "AI_INTERVIEW_TRANSCRIPT_TOO_SHORT" ||
    errorCode === "AI_INTERVIEW_FOLLOW_UP_LIMIT_REACHED" ||
    errorCode === "AI_INTERVIEW_FOLLOW_UP_EMPTY" ||
    errorCode === "AI_INTERVIEW_DUPLICATE_FOLLOW_UP" ||
    errorCode === "AI_INTERVIEW_TRANSCRIPT_NOT_FOUND"
  );
}

function resolveRootQuestionId(
  question: AiInterviewQuestionResponse | null,
  questionById: Map<string, AiInterviewQuestionResponse>,
) {
  if (!question) {
    return null;
  }

  let currentParentId = question.parent_question_id;
  let rootId = question.id;

  while (currentParentId) {
    const parentQuestion = questionById.get(currentParentId);

    if (!parentQuestion) {
      break;
    }

    rootId = parentQuestion.id;
    currentParentId = parentQuestion.parent_question_id;
  }

  return rootId;
}

function getFollowUpDepth(
  question: AiInterviewQuestionResponse | null,
  questionById: Map<string, AiInterviewQuestionResponse>,
) {
  if (!question?.parent_question_id) {
    return 0;
  }

  let depth = 0;
  let currentParentId: string | null = question.parent_question_id;

  while (currentParentId) {
    const parentQuestion = questionById.get(currentParentId);

    if (!parentQuestion) {
      break;
    }

    depth += 1;
    currentParentId = parentQuestion.parent_question_id;
  }

  return depth;
}

function getRootFollowUpCount(
  rootQuestionId: string | null,
  questions: AiInterviewQuestionResponse[],
  questionById: Map<string, AiInterviewQuestionResponse>,
) {
  if (!rootQuestionId) {
    return 0;
  }

  return questions.filter((question) => {
    if (!question.parent_question_id) {
      return false;
    }

    return resolveRootQuestionId(question, questionById) === rootQuestionId;
  }).length;
}

function getNextStepAfterRefresh(
  questions: AiInterviewQuestionResponse[],
  transcriptEntries: AiInterviewTranscriptEntryResponse[],
): AiInterviewAnswerNextStep {
  const childrenByParentId = buildChildrenByParentId(questions);
  const orderedQuestions = flattenQuestionTree(getRootQuestions(questions), childrenByParentId);
  const answeredQuestionIds = new Set(
    transcriptEntries
      .filter((entry) => entry.speaker_type === "CANDIDATE")
      .map((entry) => entry.ai_interview_question_id)
      .filter((questionId): questionId is string => Boolean(questionId)),
  );

  const nextQuestion = orderedQuestions.find(
    (question) => !answeredQuestionIds.has(question.id),
  );

  return nextQuestion ? "MOVING_NEXT" : "COMPLETED";
}

export function InterviewEngineProvider({
  sessionId,
  children,
  onError,
}: InterviewEngineProviderProps) {
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
  const questionById = useMemo(() => buildQuestionMap(questions), [questions]);
  const childrenByParentId = useMemo(
    () => buildChildrenByParentId(questions),
    [questions],
  );
  const orderedQuestions = useMemo(
    () => flattenQuestionTree(rootQuestions, childrenByParentId),
    [childrenByParentId, rootQuestions],
  );

  const candidateTranscriptQuestionIds = useMemo(
    () =>
      new Set(
        transcriptEntries
          .filter((entry) => entry.speaker_type === "CANDIDATE")
          .map((entry) => entry.ai_interview_question_id)
          .filter((questionId): questionId is string => Boolean(questionId)),
      ),
    [transcriptEntries],
  );

  const aiTranscriptQuestionIds = useMemo(
    () =>
      new Set(
        transcriptEntries
          .filter((entry) => entry.speaker_type === "AI_INTERVIEWER")
          .map((entry) => entry.ai_interview_question_id)
          .filter((questionId): questionId is string => Boolean(questionId)),
      ),
    [transcriptEntries],
  );

  const currentQuestion = useMemo(
    () =>
      orderedQuestions.find(
        (question) => !candidateTranscriptQuestionIds.has(question.id),
      ) ?? null,
    [candidateTranscriptQuestionIds, orderedQuestions],
  );

  const currentQuestionRootId = useMemo(
    () => resolveRootQuestionId(currentQuestion, questionById),
    [currentQuestion, questionById],
  );

  const rootQuestionIndex = currentQuestionRootId
    ? Math.max(
        rootQuestions.findIndex((question) => question.id === currentQuestionRootId),
        0,
      )
    : rootQuestions.length
      ? rootQuestions.length - 1
      : 0;

  const currentFollowUpDepth = useMemo(
    () => getFollowUpDepth(currentQuestion, questionById),
    [currentQuestion, questionById],
  );
  const currentFollowUpPosition = currentFollowUpDepth;

  const answeredQuestions = useMemo(
    () =>
      rootQuestions.filter((question) => candidateTranscriptQuestionIds.has(question.id))
        .length,
    [candidateTranscriptQuestionIds, rootQuestions],
  );

  const totalQuestions = rootQuestions.length;
  const currentQuestionHasCandidateAnswer = Boolean(
    currentQuestion && candidateTranscriptQuestionIds.has(currentQuestion.id),
  );
  const isCurrentQuestionFollowUp = currentFollowUpDepth > 0;
  const currentQuestionLabel = totalQuestions
    ? `Question ${rootQuestionIndex + 1} of ${totalQuestions}`
    : "Question";
  const progressPercent = totalQuestions
    ? Math.min((answeredQuestions / totalQuestions) * 100, 100)
    : 0;
  const isCompleted =
    totalQuestions > 0 &&
    answeredQuestions >= totalQuestions &&
    !currentQuestion;

  const errorMessage =
    (questionsQuery.isError && getApiErrorMessage(questionsQuery.error)) ||
    (transcriptQuery.isError && getApiErrorMessage(transcriptQuery.error)) ||
    "";

  const refreshInterviewData = useCallback(async () => {
    const [questionsResult, transcriptResult] = await Promise.all([
      questionsQuery.refetch(),
      transcriptQuery.refetch(),
    ]);

    return {
      questions: questionsResult.data ?? questionsQuery.data ?? [],
      transcriptEntries: transcriptResult.data ?? transcriptQuery.data ?? [],
    };
  }, [questionsQuery, transcriptQuery]);

  const markQuestionAnswered = useCallback(
    async (questionId: string) => {
      try {
        await markQuestionAnsweredMutation.mutateAsync(questionId);
      } catch (error) {
        onError(getApiErrorMessage(error));
      }
    },
    [markQuestionAnsweredMutation, onError],
  );

  const generateFollowUpOrContinue = useCallback(
    async (
      question: AiInterviewQuestionResponse,
      candidateAnswer: string,
    ) => {
      const normalizedAnswer = candidateAnswer.trim();
      const rootQuestionId = resolveRootQuestionId(question, questionById);
      const rootFollowUpCount = getRootFollowUpCount(
        rootQuestionId,
        questions,
        questionById,
      );

      if (!normalizedAnswer || rootFollowUpCount >= MAX_FOLLOW_UPS_PER_QUESTION) {
        const refreshedData = await refreshInterviewData();

        return {
          nextStep: getNextStepAfterRefresh(
            refreshedData.questions,
            refreshedData.transcriptEntries,
          ),
          generatedFollowUpQuestionId: null,
        };
      }

      try {
        const response = await generateFollowUpMutation.mutateAsync(question.id);

        await refreshInterviewData();

        return {
          nextStep: "FOLLOWUP_READY" as const,
          generatedFollowUpQuestionId: response.data.id,
        };
      } catch (error) {
        if (!isSkippableFollowUpError(error)) {
          // Follow-up generation should never block the interview flow.
          onError("Follow-up generation failed. Continuing to the next main question.");
        }

        const refreshedData = await refreshInterviewData();

        return {
          nextStep: getNextStepAfterRefresh(
            refreshedData.questions,
            refreshedData.transcriptEntries,
          ),
          generatedFollowUpQuestionId: null,
        };
      }
    },
    [
      generateFollowUpMutation,
      onError,
      questionById,
      questions,
      refreshInterviewData,
    ],
  );

  const submitAnswer = useCallback(
    async (messageText: string) => {
      if (!currentQuestion || currentQuestionHasCandidateAnswer) {
        return {
          transcriptText: "",
          nextStep: isCompleted ? ("COMPLETED" as const) : ("MOVING_NEXT" as const),
          generatedFollowUpQuestionId: null,
        };
      }

      const trimmed = messageText.trim();
      if (!trimmed) {
        return {
          transcriptText: "",
          nextStep: "MOVING_NEXT" as const,
          generatedFollowUpQuestionId: null,
        };
      }

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

      await markQuestionAnswered(currentQuestion.id);
      await refreshInterviewData();
      const followUpResult = await generateFollowUpOrContinue(currentQuestion, trimmed);

      return {
        transcriptText: trimmed,
        ...followUpResult,
      };
    },
    [
      createTranscriptMutation,
      currentQuestion,
      currentQuestionHasCandidateAnswer,
      generateFollowUpOrContinue,
      isCompleted,
      markQuestionAnswered,
      onError,
      refreshInterviewData,
      sessionId,
    ],
  );

  const submitAudioAnswer = useCallback(
    async (recording: RecordedAudio) => {
      if (!currentQuestion || currentQuestionHasCandidateAnswer) {
        return {
          transcriptText: "",
          nextStep: isCompleted ? ("COMPLETED" as const) : ("MOVING_NEXT" as const),
          generatedFollowUpQuestionId: null,
        };
      }

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

      const transcriptText = response.data.message_text.trim();

      if (!transcriptText) {
        const error = new Error("The answer transcript was empty. Please record the response again.");
        onError(error.message);
        throw error;
      }

      await markQuestionAnswered(currentQuestion.id);
      await refreshInterviewData();
      const followUpResult = await generateFollowUpOrContinue(currentQuestion, transcriptText);

      return {
        transcriptText,
        ...followUpResult,
      };
    },
    [
      currentQuestion,
      currentQuestionHasCandidateAnswer,
      generateFollowUpOrContinue,
      isCompleted,
      markQuestionAnswered,
      onError,
      refreshInterviewData,
      sessionId,
      transcribeAnswerMutation,
    ],
  );

  useEffect(() => {
    if (!currentQuestion || !sessionId) {
      return;
    }

    if (
      aiTranscriptQuestionIds.has(currentQuestion.id) ||
      postedInterviewerQuestionsRef.current.has(currentQuestion.id)
    ) {
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
      const createTranscriptResult = results[0];
      const markAskedResult = results[1];

      if (createTranscriptResult.status === "rejected") {
        postedInterviewerQuestionsRef.current.delete(currentQuestion.id);
        onError(getApiErrorMessage(createTranscriptResult.reason));
      }

      if (markAskedResult.status === "rejected") {
        onError(getApiErrorMessage(markAskedResult.reason));
      }
    });
  }, [
    aiTranscriptQuestionIds,
    createTranscriptMutation,
    currentQuestion,
    markQuestionAskedMutation,
    onError,
    sessionId,
  ]);

  const value = useMemo<InterviewEngineContextValue>(
    () => ({
      questions,
      currentQuestion,
      currentQuestionLabel,
      currentFollowUpDepth,
      currentFollowUpPosition,
      maxFollowUpsPerQuestion: MAX_FOLLOW_UPS_PER_QUESTION,
      isCurrentQuestionFollowUp,
      rootQuestionIndex,
      rootQuestions,
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
      isCompleted,
      isGeneratingFollowUp: generateFollowUpMutation.isPending,
      currentQuestionHasCandidateAnswer,
      errorMessage,
      submitAnswer,
      submitAudioAnswer,
    }),
    [
      answeredQuestions,
      createTranscriptMutation.isPending,
      currentFollowUpDepth,
      currentFollowUpPosition,
      currentQuestion,
      currentQuestionHasCandidateAnswer,
      currentQuestionLabel,
      errorMessage,
      generateFollowUpMutation.isPending,
      isCompleted,
      isCurrentQuestionFollowUp,
      markQuestionAnsweredMutation.isPending,
      markQuestionAskedMutation.isPending,
      questions,
      progressPercent,
      questionsQuery.isLoading,
      rootQuestionIndex,
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
