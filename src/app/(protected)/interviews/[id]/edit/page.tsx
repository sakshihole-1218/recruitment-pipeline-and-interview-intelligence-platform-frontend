"use client";

import { useParams } from "next/navigation";

import { InterviewEditView } from "@/features/interviews/components/interview-edit-view";

export default function EditInterviewPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  if (!id) return null;
  return <InterviewEditView id={id} />;
}
