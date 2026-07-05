import { ResumeDetailPage } from "@/features/resumes/pages/ResumeDetailPage";

interface ResumeDetailRouteProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ candidateId?: string; applicationId?: string }>;
}

export default function ResumeDetailRoute({ params, searchParams }: ResumeDetailRouteProps) {
  return <ResumeDetailPage params={params} searchParams={searchParams} />;
}
