"use client";

import { useParams } from "next/navigation";

import { InterviewRoundEditView } from "@/features/interview-rounds/components/interview-round-edit-view";

export default function EditInterviewRoundPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  if (!id) return null;

  return <InterviewRoundEditView id={id} />;
}
