"use client";

import { useMemo } from "react";
import NextLink from "next/link";
import { useQueries } from "@tanstack/react-query";
import {
  Alert,
  alpha,
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Chip,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  NavigateNext as NavigateNextIcon,
  Person as CandidateIcon,
  SmartToyOutlined as FeedbackIcon,
  WarningAmber as RiskIcon,
  WorkOutlined as JobIcon,
} from "@mui/icons-material";

import { AppSnackbar } from "@/components/app-snackbar";
import { ROUTES } from "@/constants/routes";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { authStorage } from "@/utils/auth-storage";
import { useApplication } from "@/features/applications/hooks/use-applications";
import { useCandidate } from "@/features/candidates/hooks/use-candidates";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import { useInterview } from "@/features/interviews/hooks/use-interviews";
import { usersService } from "@/features/users/services/users.service";
import type { AiInterviewQuestionResponse } from "@/features/ai-interview/types/ai-interview.types";
import { useCreateInterviewerReview, useFeedback, useFeedbackQuestions, useFeedbackSession, useFeedbackTranscripts, useInterviewerReviews, useProctoringRiskSummary, useSubmitInterviewerReview, useUpdateInterviewerReview } from "@/features/feedback/hooks/use-feedback";
import { FeedbackScoreCards } from "@/features/feedback/components/FeedbackScoreCards";
import { FeedbackSummaryCard } from "@/features/feedback/components/FeedbackSummaryCard";
import { InterviewerReviewForm, type InterviewerReviewFormValues } from "@/features/feedback/components/InterviewerReviewForm";
import { TranscriptViewer } from "@/features/feedback/components/TranscriptViewer";
import type { InterviewerReviewResponse } from "@/features/feedback/types/feedback.types";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function buildQuestionGroups(questions: AiInterviewQuestionResponse[]) {
  const roots = questions.filter((question) => !question.is_follow_up);
  const followUpsByParent = new Map<string, AiInterviewQuestionResponse[]>();

  for (const question of questions) {
    if (!question.is_follow_up || !question.parent_question_id) continue;

    const list = followUpsByParent.get(question.parent_question_id) ?? [];
    list.push(question);
    followUpsByParent.set(question.parent_question_id, list);
  }

  return roots.map((root) => ({
    root,
    followUps: (followUpsByParent.get(root.id) ?? []).sort(
      (a, b) => a.sequence_number - b.sequence_number,
    ),
  }));
}

function averageReviewScore(review: InterviewerReviewResponse) {
  const scores = [
    review.technical_score,
    review.communication_score,
    review.problem_solving_score,
    review.culture_fit_score,
  ].filter((value): value is number => value !== null && value !== undefined);

  if (scores.length === 0) return null;

  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, letterSpacing: 0.2 }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>{value}</Box>
    </Grid>
  );
}

export function FeedbackDetailPage({ id }: { id: string }) {
  const { snackbar, showError, showSuccess, closeSnackbar } = useSnackbar();
  const currentUser = typeof window === "undefined" ? null : authStorage.getUser();

  const feedbackQuery = useFeedback(id);
  const feedback = feedbackQuery.data?.data;

  const sessionQuery = useFeedbackSession(feedback?.ai_interview_session_id ?? "");
  const session = sessionQuery.data?.data ?? null;

  const applicationQuery = useApplication(feedback?.application_id ?? "");
  const application = applicationQuery.data?.data;

  const candidateQuery = useCandidate(feedback?.candidate_id ?? "");
  const candidate = candidateQuery.data?.data;

  const jobOpeningQuery = useJobOpening(application?.job_opening_id ?? "");
  const jobOpening = jobOpeningQuery.data?.data;

  const interviewQuery = useInterview(session?.interview_id ?? "");
  const interview = interviewQuery.data?.data;

  const questionsQuery = useFeedbackQuestions(session?.id ?? "");
  const transcriptsQuery = useFeedbackTranscripts(session?.id ?? "");
  const proctoringRiskQuery = useProctoringRiskSummary(session?.id ?? "");
  const reviewsQuery = useInterviewerReviews(session?.id ?? "");

  const createReviewMutation = useCreateInterviewerReview(session?.id ?? "");
  const updateReviewMutation = useUpdateInterviewerReview(session?.id ?? "");
  const submitReviewMutation = useSubmitInterviewerReview(session?.id ?? "");

  const reviews = reviewsQuery.data?.data ?? [];
  const currentUserReview =
    reviews.find((review) => review.reviewer_user_id === currentUser?.id) ?? null;

  const reviewerQueries = useQueries({
    queries: Array.from(new Set(reviews.map((review) => review.reviewer_user_id)))
      .filter(Boolean)
      .map((userId) => ({
        queryKey: ["users", "detail", userId],
        queryFn: () => usersService.getById(userId),
        staleTime: 5 * 60 * 1000,
      })),
  });

  const reviewersById = useMemo(
    () =>
      new Map(
        reviewerQueries
          .map((query) => query.data?.data)
          .filter((value): value is NonNullable<typeof value> => !!value)
          .map((user) => [user.id, user]),
      ),
    [reviewerQueries],
  );

  const questionGroups = useMemo(
    () => buildQuestionGroups(questionsQuery.data ?? []),
    [questionsQuery.data],
  );

  const pageError =
    (feedbackQuery.isError && getApiErrorMessage(feedbackQuery.error)) ||
    (sessionQuery.isError && getApiErrorMessage(sessionQuery.error)) ||
    "";

  const candidateName =
    candidate ? `${candidate.first_name} ${candidate.last_name}` : "Candidate";

  const handleSaveDraft = async (values: Partial<InterviewerReviewFormValues>) => {
    if (!currentUser || !session || !feedback) {
      showError("Unable to identify the current reviewer.");
      return;
    }

    try {
      if (currentUserReview) {
        await updateReviewMutation.mutateAsync({
          id: currentUserReview.id,
          payload: {
            technical_score: values.technical_score,
            communication_score: values.communication_score,
            problem_solving_score: values.problem_solving_score,
            culture_fit_score: values.culture_fit_score,
            strengths: values.strengths,
            concerns: values.concerns,
            detailed_review: values.detailed_review,
            interviewer_recommendation: values.interviewer_recommendation,
          },
        });
      } else {
        await createReviewMutation.mutateAsync({
          ai_interview_session_id: session.id,
          ai_interview_feedback_id: feedback.id,
          reviewer_user_id: currentUser.id,
          technical_score: values.technical_score,
          communication_score: values.communication_score,
          problem_solving_score: values.problem_solving_score,
          culture_fit_score: values.culture_fit_score,
          strengths: values.strengths,
          concerns: values.concerns,
          detailed_review: values.detailed_review,
          interviewer_recommendation: values.interviewer_recommendation,
          review_status: "DRAFT",
        });
      }

      showSuccess("Review draft saved");
    } catch (error) {
      showError(getApiErrorMessage(error));
    }
  };

  const handleSubmitReview = async (values: InterviewerReviewFormValues) => {
    if (!currentUser || !session || !feedback) {
      showError("Unable to identify the current reviewer.");
      return;
    }

    try {
      let reviewId = currentUserReview?.id;

      if (!reviewId) {
        const created = await createReviewMutation.mutateAsync({
          ai_interview_session_id: session.id,
          ai_interview_feedback_id: feedback.id,
          reviewer_user_id: currentUser.id,
          technical_score: values.technical_score,
          communication_score: values.communication_score,
          problem_solving_score: values.problem_solving_score,
          culture_fit_score: values.culture_fit_score,
          strengths: values.strengths,
          concerns: values.concerns,
          detailed_review: values.detailed_review,
          interviewer_recommendation: values.interviewer_recommendation,
          review_status: "DRAFT",
        });
        reviewId = created.data.id;
      }

      await submitReviewMutation.mutateAsync({
        id: reviewId,
        payload: values,
      });

      showSuccess("Review submitted successfully");
    } catch (error) {
      showError(getApiErrorMessage(error));
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.FEEDBACK} underline="hover" color="inherit">
          Feedback
        </Link>
        <Typography color="text.primary">Feedback Details</Typography>
      </Breadcrumbs>

      <Stack spacing={3}>
        <Box
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 3, sm: 4 },
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FeedbackIcon sx={{ color: "white" }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    {candidateName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {jobOpening?.title ?? "Job opening"}
                    {session?.session_code ? ` • ${session.session_code}` : ""}
                  </Typography>
                </Box>
              </Stack>

              {feedback ? (
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Chip
                    label={feedback.feedback_status}
                    color={feedback.feedback_status === "COMPLETED" ? "success" : "default"}
                    variant={feedback.feedback_status === "PENDING" ? "outlined" : "filled"}
                    sx={{ fontWeight: 800 }}
                  />
                  {feedback.recommendation ? (
                    <Chip
                      label={feedback.recommendation.replaceAll("_", " ")}
                      variant="outlined"
                      sx={{ fontWeight: 800 }}
                    />
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          </Stack>
        </Box>

        {pageError ? <Alert severity="error">{pageError}</Alert> : null}

        {feedbackQuery.isLoading ? (
          <Typography>Loading feedback details...</Typography>
        ) : !feedback ? (
          <Alert severity="warning">Feedback record not found.</Alert>
        ) : (
          <>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, lg: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                        <CandidateIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                          Candidate Details
                        </Typography>
                      </Stack>
                      <Grid container spacing={2}>
                        <DetailRow label="Name" value={<Typography>{candidateName}</Typography>} />
                        <DetailRow label="Email" value={<Typography>{candidate?.email ?? "—"}</Typography>} />
                        <DetailRow
                          label="Current role"
                          value={<Typography>{candidate?.current_job_title ?? "—"}</Typography>}
                        />
                        <DetailRow
                          label="Experience"
                          value={<Typography>{candidate?.total_experience_years ?? "—"}</Typography>}
                        />
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                        <JobIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                          Job Details
                        </Typography>
                      </Stack>
                      <Grid container spacing={2}>
                        <DetailRow label="Title" value={<Typography>{jobOpening?.title ?? "—"}</Typography>} />
                        <DetailRow label="Code" value={<Typography>{jobOpening?.code ?? "—"}</Typography>} />
                        <DetailRow label="Mode" value={<Typography>{jobOpening?.work_mode ?? "—"}</Typography>} />
                        <DetailRow label="Location" value={<Typography>{jobOpening?.location ?? "—"}</Typography>} />
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        AI Interview Session
                      </Typography>
                      <Grid container spacing={2}>
                        <DetailRow label="Session code" value={<Typography>{session?.session_code ?? "—"}</Typography>} />
                        <DetailRow label="Status" value={<Typography>{session?.session_status ?? "—"}</Typography>} />
                        <DetailRow label="Started at" value={<Typography>{formatDateTime(session?.started_at)}</Typography>} />
                        <DetailRow label="Ended at" value={<Typography>{formatDateTime(session?.ended_at)}</Typography>} />
                        <DetailRow label="Interview mode" value={<Typography>{interview?.interview_mode ?? "—"}</Typography>} />
                        <DetailRow label="Scheduled at" value={<Typography>{formatDateTime(interview?.scheduled_start_at)}</Typography>} />
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <FeedbackScoreCards
              technicalScore={feedback.technical_score}
              communicationScore={feedback.communication_score}
              problemSolvingScore={feedback.problem_solving_score}
              projectUnderstandingScore={feedback.experience_relevance_score}
              overallScore={feedback.overall_score}
            />

            <FeedbackSummaryCard
              recommendation={feedback.recommendation}
              feedbackStatus={feedback.feedback_status}
              strengths={feedback.strengths_summary}
              concerns={feedback.weaknesses_summary}
              improvementAreas={feedback.experience_relevance_summary}
              detailedFeedback={feedback.detailed_feedback}
            />

            {proctoringRiskQuery.data?.data ? (
              <Card
                elevation={0}
                sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                      <RiskIcon color="warning" />
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Proctoring Risk Summary
                      </Typography>
                    </Stack>
                    <Grid container spacing={2}>
                      <DetailRow label="Risk level" value={<Typography>{proctoringRiskQuery.data.data.risk_level}</Typography>} />
                      <DetailRow label="Risk score" value={<Typography>{proctoringRiskQuery.data.data.risk_score}</Typography>} />
                      <DetailRow label="Total events" value={<Typography>{proctoringRiskQuery.data.data.total_events}</Typography>} />
                      <DetailRow label="Critical events" value={<Typography>{proctoringRiskQuery.data.data.critical_count}</Typography>} />
                    </Grid>
                    <Typography variant="body2" color="text.secondary">
                      {proctoringRiskQuery.data.data.summary}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ) : null}

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, xl: 6 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Questions Asked
                      </Typography>
                      {questionsQuery.isLoading ? (
                        <Typography>Loading questions...</Typography>
                      ) : questionGroups.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No questions available for this session.
                        </Typography>
                      ) : (
                        <Stack spacing={2}>
                          {questionGroups.map(({ root, followUps }) => (
                            <Box
                              key={root.id}
                              sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 3,
                                p: 2,
                              }}
                            >
                              <Stack spacing={1.25}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                  <Chip size="small" label={`Q${root.sequence_number}`} color="primary" />
                                  <Chip size="small" label={root.question_type} variant="outlined" />
                                </Stack>
                                <Typography sx={{ fontWeight: 800 }}>{root.question_text}</Typography>
                                {followUps.length > 0 ? (
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>
                                      Follow-up questions
                                    </Typography>
                                    <Stack spacing={1}>
                                      {followUps.map((question) => (
                                        <Box
                                          key={question.id}
                                          sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                                          }}
                                        >
                                          <Typography variant="body2">
                                            {question.question_text}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Stack>
                                  </Box>
                                ) : null}
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, xl: 6 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Transcript
                      </Typography>
                      {transcriptsQuery.isLoading ? (
                        <Typography>Loading transcript...</Typography>
                      ) : (
                        <TranscriptViewer transcripts={transcriptsQuery.data ?? []} />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card
              elevation={0}
              sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Interviewer Reviews
                  </Typography>

                  {reviews.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No interviewer reviews submitted yet.
                    </Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {reviews.map((review) => {
                        const reviewer = reviewersById.get(review.reviewer_user_id);
                        const reviewerName = reviewer
                          ? `${reviewer.first_name} ${reviewer.last_name}`
                          : review.reviewer_user_id;
                        const overallScore =
                          review.overall_score ?? averageReviewScore(review);

                        return (
                          <Grid key={review.id} size={{ xs: 12, lg: 6 }}>
                            <Box
                              sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 3,
                                p: 2.5,
                                height: "100%",
                              }}
                            >
                              <Stack spacing={1.5}>
                                <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                                  <Box>
                                    <Typography sx={{ fontWeight: 900 }}>{reviewerName}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {review.review_status} • Reviewed {formatDateTime(review.reviewed_at || review.updated_at)}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={
                                      overallScore === null
                                        ? "No score"
                                        : `Overall ${overallScore.toFixed(1)}`
                                    }
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 800 }}
                                  />
                                </Stack>
                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                                  {review.detailed_review || "No detailed review provided."}
                                </Typography>
                              </Stack>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <InterviewerReviewForm
              review={currentUserReview}
              reviewerName={
                currentUser
                  ? `${currentUser.first_name} ${currentUser.last_name}`
                  : undefined
              }
              isCreating={createReviewMutation.isPending}
              isSavingDraft={updateReviewMutation.isPending}
              isSubmitting={submitReviewMutation.isPending}
              onSaveDraft={handleSaveDraft}
              onSubmitReview={handleSubmitReview}
            />
          </>
        )}
      </Stack>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
