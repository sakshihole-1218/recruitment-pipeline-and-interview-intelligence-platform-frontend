"use client";

import { useParams } from "next/navigation";

import { InterviewRoundDetailsView } from "@/features/interview-rounds/components/interview-round-details-view";

export default function InterviewRoundDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  if (!id) return null;

  return <InterviewRoundDetailsView id={id} />;
}
