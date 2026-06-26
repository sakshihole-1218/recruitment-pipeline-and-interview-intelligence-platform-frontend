import { DecisionFormPage } from "@/features/decisions/pages/DecisionFormPage";

export default async function EditDecisionRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DecisionFormPage mode="edit" id={id} />;
}
