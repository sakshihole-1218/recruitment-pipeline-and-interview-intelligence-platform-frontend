"use client";

import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { aiInterviewSessionService } from "@/features/ai-interview/services/ai-interview-session.service";
import { livekitService } from "@/features/ai-interview/services/livekit.service";
import type {
  AiInterviewRoomConnection,
  AiInterviewSessionResponse,
  AiInterviewSessionStatus,
} from "@/features/ai-interview/types/ai-interview.types";

export const AI_INTERVIEW_QUERY_KEYS = {
  all: ["ai-interview"] as const,
  sessionByInterview: (interviewId: string) =>
    ["ai-interview", "session", "interview", interviewId] as const,
};

const ACTIVE_AI_SESSION_STATUSES: ReadonlySet<AiInterviewSessionStatus> = new Set([
  "PENDING",
  "READY",
  "IN_PROGRESS",
]);

const TERMINAL_AI_SESSION_STATUSES: ReadonlySet<AiInterviewSessionStatus> = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

const AI_INTERVIEW_PREP_TIMEOUT_MS = 15000;

function getApiErrorCode(error: unknown): string | undefined {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as
      | { error?: { code?: string }; code?: string }
      | undefined;

    return responseData?.error?.code || responseData?.code;
  }

  return undefined;
}

function pickReusableSession(sessions: AiInterviewSessionResponse[]) {
  return sessions.find((session) =>
    ACTIVE_AI_SESSION_STATUSES.has(session.session_status),
  );
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out after ${AI_INTERVIEW_PREP_TIMEOUT_MS / 1000} seconds. Check backend and LiveKit services.`,
        ),
      );
    }, AI_INTERVIEW_PREP_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function useEnsureAiInterviewSession(interviewId: string) {
  return useQuery({
    queryKey: AI_INTERVIEW_QUERY_KEYS.sessionByInterview(interviewId),
    queryFn: async () => {
      const existingResponse =
        await aiInterviewSessionService.listByInterviewId(interviewId);
      const existingSession = pickReusableSession(existingResponse.data);

      if (existingSession) {
        return existingSession;
      }

      const createdResponse = await aiInterviewSessionService.create({
        interview_id: interviewId,
      });

      return createdResponse.data;
    },
    enabled: !!interviewId,
    retry: false,
  });
}

export function usePrepareAiInterviewRoom() {
  return useMutation({
    mutationFn: async (params: {
      aiInterviewSessionId: string;
      displayName?: string;
    }) => {
      const roomResponse = await livekitService.createRoom({
        ai_interview_session_id: params.aiInterviewSessionId,
      });

      const tokenResponse = await livekitService.generateToken({
        ai_interview_session_id: params.aiInterviewSessionId,
        participant_type: "CANDIDATE",
        display_name: params.displayName,
      });

      return {
        room: roomResponse.data,
        token: tokenResponse.data,
      };
    },
  });
}

export function usePrepareAiInterviewRoomConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      interviewId: string;
      session: AiInterviewSessionResponse;
      displayName?: string;
    }): Promise<AiInterviewRoomConnection> => {
      let session = params.session;
      const findExistingActiveSession = async () => {
        const sessionsResponse = await aiInterviewSessionService.listByInterviewId(
          params.interviewId,
        );
        const activeSession = pickReusableSession(sessionsResponse.data);

        if (!activeSession) {
          throw new Error("No reusable AI interview session was found for this interview.");
        }

        return activeSession;
      };

      if (TERMINAL_AI_SESSION_STATUSES.has(session.session_status)) {
        try {
          const createdSessionResponse = await aiInterviewSessionService.create({
            interview_id: params.interviewId,
          });
          session = createdSessionResponse.data;
        } catch (error) {
          const errorCode = getApiErrorCode(error);
          if (errorCode === "AI_SESSION_DUPLICATE_ACTIVE_FOR_INTERVIEW") {
            session = await findExistingActiveSession();
          } else {
            throw error;
          }
        }
      }

      if (session.session_status === "READY") {
        const startedResponse = await withTimeout(
          aiInterviewSessionService.start(session.id),
          "Starting AI interview session",
        );
        session = startedResponse.data;
      }

      let roomResponse;
      try {
        roomResponse = await withTimeout(
          livekitService.createRoom({
            ai_interview_session_id: session.id,
          }),
          "Creating LiveKit room",
        );
      } catch (error) {
        const errorCode = getApiErrorCode(error);

        if (errorCode === "LIVEKIT_ROOM_ALREADY_ENDED") {
          try {
            const createdSessionResponse = await aiInterviewSessionService.create({
              interview_id: params.interviewId,
            });
            session = createdSessionResponse.data;
          } catch (retryCreateError) {
            const retryErrorCode = getApiErrorCode(retryCreateError);

            if (retryErrorCode === "AI_SESSION_DUPLICATE_ACTIVE_FOR_INTERVIEW") {
              session = await findExistingActiveSession();
            } else {
              throw retryCreateError;
            }
          }

          if (session.session_status === "READY") {
            const startedResponse = await withTimeout(
              aiInterviewSessionService.start(session.id),
              "Starting AI interview session",
            );
            session = startedResponse.data;
          }

          roomResponse = await withTimeout(
            livekitService.createRoom({
              ai_interview_session_id: session.id,
            }),
            "Creating LiveKit room",
          );
        } else {
          throw error;
        }
      }

      const tokenResponse = await withTimeout(
        livekitService.generateToken({
          ai_interview_session_id: session.id,
          participant_type: "CANDIDATE",
          display_name: params.displayName,
        }),
        "Generating LiveKit token",
      );

      return {
        session,
        room: roomResponse.data,
        token: tokenResponse.data,
      };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(
        AI_INTERVIEW_QUERY_KEYS.sessionByInterview(result.session.interview_id),
        result.session,
      );
    },
  });
}

export function useEndAiInterviewSession(interviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => aiInterviewSessionService.end(sessionId),
    onSuccess: (result) => {
      queryClient.setQueryData(
        AI_INTERVIEW_QUERY_KEYS.sessionByInterview(interviewId),
        result.data,
      );
    },
  });
}

export function useStartAiInterviewSession(interviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => aiInterviewSessionService.start(sessionId),
    onSuccess: (result) => {
      queryClient.setQueryData(
        AI_INTERVIEW_QUERY_KEYS.sessionByInterview(interviewId),
        result.data,
      );
    },
  });
}
