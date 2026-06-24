import { ResumeDetailPage } from "@/features/resumes/pages/ResumeDetailPage";

interface ResumeDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default function ResumeDetailRoute({ params }: ResumeDetailRouteProps) {
  return <ResumeDetailPage params={params} />;
}
