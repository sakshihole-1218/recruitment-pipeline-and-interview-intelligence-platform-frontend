"use client";

import { useParams } from "next/navigation";

import { CandidateInterviewSessionPage } from "@/features/candidate-interview/pages/candidate-interview-session-page";

export default function CandidateInterviewSessionRoute() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  if (!token) return null;
  return <CandidateInterviewSessionPage token={token} />;
}
