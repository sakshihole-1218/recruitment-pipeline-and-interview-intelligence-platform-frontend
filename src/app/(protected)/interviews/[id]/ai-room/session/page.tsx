"use client";

import { useParams } from "next/navigation";

import { AiInterviewRoomPage } from "@/features/ai-interview/pages/ai-interview-room-page";

export default function InterviewAiRoomSessionRoute() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  if (!id) return null;

  return <AiInterviewRoomPage id={id} />;
}
