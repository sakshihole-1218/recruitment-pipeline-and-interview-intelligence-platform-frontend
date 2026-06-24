import { FeedbackDetailPage } from "@/features/feedback/pages/FeedbackDetailPage";

export default async function FeedbackDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <FeedbackDetailPage id={id} />;
}
