"use client";

import { useParams } from "next/navigation";

import { CandidateInterviewJoinPage } from "@/features/candidate-interview/pages/candidate-interview-join-page";

export default function CandidateInterviewJoinRoute() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  if (!token) return null;
  return <CandidateInterviewJoinPage token={token} />;
}
