import { DecisionDetailPage } from "@/features/decisions/pages/DecisionDetailPage";

export default async function DecisionDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DecisionDetailPage id={id} />;
}
