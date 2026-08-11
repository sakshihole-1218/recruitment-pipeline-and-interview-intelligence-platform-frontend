"use client";

import { useParams } from "next/navigation";

import { CandidateInterviewLobbyPage } from "@/features/candidate-interview/pages/candidate-interview-lobby-page";

export default function CandidateInterviewLobbyRoute() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  if (!token) return null;
  return <CandidateInterviewLobbyPage token={token} />;
}
