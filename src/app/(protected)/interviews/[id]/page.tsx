"use client";

import { useParams } from "next/navigation";

import { InterviewDetailsView } from "@/features/interviews/components/interview-details-view";

export default function InterviewDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  if (!id) return null;
  return <InterviewDetailsView id={id} />;
}
