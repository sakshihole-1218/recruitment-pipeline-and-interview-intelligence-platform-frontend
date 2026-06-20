"use client";

import { useParams } from "next/navigation";

import { AiInterviewCompletedPage } from "@/features/ai-interview/pages/ai-interview-completed-page";

export default function InterviewAiRoomCompletedRoute() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  if (!id) return null;

  return <AiInterviewCompletedPage id={id} />;
}
