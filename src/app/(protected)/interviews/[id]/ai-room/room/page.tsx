"use client";

import { useParams } from "next/navigation";

import { AiInterviewRoomPlaceholderPage } from "@/features/ai-interview/pages/ai-interview-room-placeholder-page";

export default function InterviewAiRoomPlaceholderRoute() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  if (!id) return null;

  return <AiInterviewRoomPlaceholderPage id={id} />;
}
