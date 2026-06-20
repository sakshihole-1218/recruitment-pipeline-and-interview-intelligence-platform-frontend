"use client";

import { useInterviewEngineContext } from "@/features/ai-interview/context/interview-engine-context";

export function useInterviewEngine() {
  return useInterviewEngineContext();
}
