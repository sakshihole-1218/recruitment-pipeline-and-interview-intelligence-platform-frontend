"use client";

import { useParams } from "next/navigation";

import { AiInterviewLobbyPage } from "@/features/ai-interview/pages/ai-interview-lobby-page";

export default function InterviewAiRoomLobbyRoute() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  if (!id) return null;

  return <AiInterviewLobbyPage id={id} />;
}
