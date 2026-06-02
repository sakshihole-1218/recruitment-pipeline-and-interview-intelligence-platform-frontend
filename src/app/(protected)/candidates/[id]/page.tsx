"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  Link,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Group as CandidatesIcon,
  Star as PrimarySkillIcon,
  ToggleOff as DeactivateIcon,
  ToggleOn as ActivateIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";
import {
  useCandidate,
  useCandidateDocuments,
  useCandidateSkills,
  useMarkLatestResume,
  useUpdateCandidate,
  useUploadCandidateDocument,
} from "@/features/candidates/hooks/use-candidates";
import { useCandidatesPermissions } from "@/features/candidates/hooks/use-candidates-permissions";
import { CandidateStatusChip } from "@/features/candidates/components/candidate-status-chip";
import { CandidateDocumentsCard } from "@/features/candidates/components/candidate-documents-card";
import { CandidateDocumentUploader } from "@/features/candidates/components/candidate-document-uploader";
import {
  CANDIDATE_GENDER_LABELS,
  CANDIDATE_SKILL_PROFICIENCY_LABELS,
  CANDIDATE_SOURCE_TYPE_LABELS,
} from "@/features/candidates/types/candidates.types";
import { ConfirmDialog } from "@/features/candidates/components/confirm-dialog";

interface CandidateDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export default function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const {
    canEditCandidate,
    canToggleCandidateStatus,
    canUploadCandidateDocuments,
  } = useCandidatesPermissions();

  const candidateQuery = useCandidate(id);
  const skillsQuery = useCandidateSkills(id);
  const documentsQuery = useCandidateDocuments(id);

  const updateCandidate = useUpdateCandidate(id);
  const uploadDoc = useUploadCandidateDocument();
  const markLatest = useMarkLatestResume();

  const candidate = candidateQuery.data?.data;
  const skills = skillsQuery.data?.data ?? [];
  const documents = documentsQuery.data?.data ?? [];

  const fullName = useMemo(() => {
    if (!candidate) return "";
    return `${candidate.first_name} ${candidate.last_name}`;
  }, [candidate]);

  const [confirm, setConfirm] = useState<{ open: boolean; nextActive: boolean } | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const isMutating = updateCandidate.isPending || uploadDoc.isPending || markLatest.isPending;

  const handleToggleStatus = async () => {
    if (!candidate || !confirm) return;
    try {
      const res = await updateCandidate.mutateAsync({ is_active: confirm.nextActive });
      showSuccess(res.message || `Candidate ${confirm.nextActive ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setConfirm(null);
    }
  };

  if (candidateQuery.isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load candidate
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getApiErrorMessage(candidateQuery.error)}
        </Typography>
        <Button variant="outlined" sx={{ mt: 3 }} onClick={() => router.push(ROUTES.CANDIDATES)}>
          Back to Candidates
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.CANDIDATES} underline="hover" color="inherit">
          Candidates
        </Link>
        <Typography color="text.primary">
          {candidateQuery.isLoading ? <Skeleton width={220} /> : fullName}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 3, gap: 2 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Button variant="text" startIcon={<BackIcon />} onClick={() => router.push(ROUTES.CANDIDATES)} sx={{ mr: 1 }}>
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Candidate Profile
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {candidate ? <CandidateStatusChip isActive={candidate.is_active} /> : null}
          <CandidatesIcon color="primary" />
          {canEditCandidate ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => router.push(`${ROUTES.CANDIDATES}/${id}/edit`)}
              sx={{ borderRadius: 2, fontWeight: 900 }}
            >
              Edit
            </Button>
          ) : null}
          {canToggleCandidateStatus && candidate ? (
            <Button
              variant="outlined"
              color={candidate.is_active ? "error" : "success"}
              startIcon={candidate.is_active ? <DeactivateIcon /> : <ActivateIcon />}
              onClick={() => setConfirm({ open: true, nextActive: !candidate.is_active })}
              sx={{ borderRadius: 2, fontWeight: 900 }}
            >
              {candidate.is_active ? "Deactivate" : "Activate"}
            </Button>
          ) : null}
        </Stack>
      </Stack>

      <Stack spacing={2.5}>
        {/* Profile summary */}
        <Box
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 3, sm: 4 },
            bgcolor: "background.paper",
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }} noWrap>
                  {candidateQuery.isLoading ? <Skeleton width={280} /> : fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {candidate?.resume_headline ? candidate.resume_headline : "Profile overview and key details"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {candidate?.current_job_title ? (
                  <Chip label={candidate.current_job_title} variant="outlined" />
                ) : null}
                {candidate?.current_company ? (
                  <Chip label={candidate.current_company} variant="outlined" />
                ) : null}
                {candidate?.current_location ? (
                  <Chip label={candidate.current_location} variant="outlined" />
                ) : null}
              </Stack>
            </Stack>

            <Divider />

            <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Personal Information</Typography>
                <Stack spacing={0.75}>
                  <Typography variant="body2"><b>Gender:</b> {candidate?.gender ? CANDIDATE_GENDER_LABELS[candidate.gender] : "—"}</Typography>
                  <Typography variant="body2"><b>Date of Birth:</b> {formatValue(candidate?.date_of_birth)}</Typography>
                  <Typography variant="body2"><b>Status:</b> {candidate ? (candidate.is_active ? "Active" : "Inactive") : "—"}</Typography>
                </Stack>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Contact Information</Typography>
                <Stack spacing={0.75}>
                  <Typography variant="body2"><b>Email:</b> {formatValue(candidate?.email)}</Typography>
                  <Typography variant="body2"><b>Phone:</b> {formatValue(candidate?.phone)}</Typography>
                </Stack>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Experience</Typography>
                <Stack spacing={0.75}>
                  <Typography variant="body2"><b>Total:</b> {candidate?.total_experience_years ? `${candidate.total_experience_years} years` : "—"}</Typography>
                  <Typography variant="body2"><b>Notice Period:</b> {candidate?.notice_period_days !== null && candidate?.notice_period_days !== undefined ? `${candidate.notice_period_days} days` : "—"}</Typography>
                </Stack>
              </Box>
            </Stack>

            <Divider />

            <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Sourcing</Typography>
                <Stack spacing={0.75}>
                  <Typography variant="body2"><b>Source:</b> {candidate?.source_type ? CANDIDATE_SOURCE_TYPE_LABELS[candidate.source_type] : "—"}</Typography>
                  <Typography variant="body2"><b>Details:</b> {formatValue(candidate?.source_details)}</Typography>
                </Stack>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Links</Typography>
                <Stack spacing={0.75}>
                  <Typography variant="body2"><b>LinkedIn:</b> {formatValue(candidate?.linkedin_url)}</Typography>
                  <Typography variant="body2"><b>GitHub:</b> {formatValue(candidate?.github_url)}</Typography>
                  <Typography variant="body2"><b>Portfolio:</b> {formatValue(candidate?.portfolio_url)}</Typography>
                </Stack>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Audit</Typography>
                <Stack spacing={0.75}>
                  <Typography variant="body2"><b>Created:</b> {candidate?.created_at ? new Date(candidate.created_at).toLocaleString() : "—"}</Typography>
                  <Typography variant="body2"><b>Updated:</b> {candidate?.updated_at ? new Date(candidate.updated_at).toLocaleString() : "—"}</Typography>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Box>

        {/* Skills */}
        <Box
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 3, sm: 4 },
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Skills
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Skills and proficiency captured for this candidate.
          </Typography>
          <Divider sx={{ my: 2.5 }} />

          {skillsQuery.isLoading ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Skeleton width={110} height={34} />
              <Skeleton width={120} height={34} />
              <Skeleton width={100} height={34} />
              <Skeleton width={140} height={34} />
              <Skeleton width={95} height={34} />
            </Box>
          ) : skills.length > 0 ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {skills
                .slice()
                .sort((a, b) => {
                  const mandatoryDiff = Number(b.is_primary) - Number(a.is_primary);
                  if (mandatoryDiff !== 0) return mandatoryDiff;
                  return String(a.skill_name ?? "").localeCompare(String(b.skill_name ?? ""));
                })
                .map((s) => {
                  const skillName = s.skill_name ?? "Skill";
                  const proficiencyLabel = s.proficiency_level
                    ? CANDIDATE_SKILL_PROFICIENCY_LABELS[s.proficiency_level]
                    : null;
                  const exp = s.years_of_experience ? String(s.years_of_experience).trim() : "";

                  const hasDetails = Boolean(proficiencyLabel || exp);
                  const tooltipTitle = hasDetails ? (
                    <Stack spacing={0.25} sx={{ py: 0.25 }}>
                      {proficiencyLabel ? (
                        <Typography variant="caption">Proficiency: {proficiencyLabel}</Typography>
                      ) : null}
                      {exp ? (
                        <Typography variant="caption">Experience: {exp} year(s)</Typography>
                      ) : null}
                    </Stack>
                  ) : (
                    "No additional details"
                  );

                  return (
                    <Tooltip key={s.id} title={tooltipTitle} arrow>
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                        <Chip
                          label={skillName}
                          title={skillName}
                          icon={s.is_primary ? <PrimarySkillIcon fontSize="small" /> : undefined}
                          color={s.is_primary ? "primary" : "default"}
                          variant={s.is_primary ? "filled" : "outlined"}
                          sx={{
                            fontWeight: 900,
                            maxWidth: { xs: 240, sm: 320 },
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                        />

                        <Box
                          component="span"
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 900,
                            border: "1px solid",
                            borderColor: s.is_primary ? "primary.main" : "divider",
                            color: s.is_primary ? "primary.main" : "text.secondary",
                            bgcolor: s.is_primary ? "primary.50" : "transparent",
                            lineHeight: 1.2,
                            userSelect: "none",
                          }}
                        >
                          {s.is_primary ? "Mandatory" : "Optional"}
                        </Box>
                      </Box>
                    </Tooltip>
                  );
                })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No skills added yet.
            </Typography>
          )}
        </Box>

        <CandidateDocumentsCard
          documents={documents}
          isLoading={documentsQuery.isLoading}
          canUpload={canUploadCandidateDocuments}
          onUploadClick={() => setUploadOpen(true)}
          onMarkLatest={(doc) => {
            void (async () => {
              try {
                const res = await markLatest.mutateAsync({ candidateId: id, documentId: doc.id });
                showSuccess(res.message || "Marked as latest");
              } catch (err) {
                showError(getApiErrorMessage(err));
              }
            })();
          }}
          markingLatestId={markLatest.isPending ? markLatest.variables?.documentId ?? null : null}
        />
      </Stack>

      <CandidateDocumentUploader
        open={uploadOpen}
        loading={uploadDoc.isPending}
        onClose={() => setUploadOpen(false)}
        onUpload={async (payload) => {
          try {
            const res = await uploadDoc.mutateAsync({
              candidateId: id,
              payload: { ...payload, file: payload.file },
            });
            showSuccess(res.message || "Document uploaded successfully");
            setUploadOpen(false);
          } catch (err) {
            showError(getApiErrorMessage(err));
          }
        }}
      />

      <ConfirmDialog
        open={!!confirm?.open}
        title={candidate?.is_active ? "Deactivate Candidate" : "Activate Candidate"}
        description={candidate ? `Are you sure you want to ${candidate.is_active ? "deactivate" : "activate"} ${fullName}?` : ""}
        confirmLabel={candidate?.is_active ? "Deactivate" : "Activate"}
        confirmColor={candidate?.is_active ? "error" : "success"}
        loading={isMutating}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirm(null)}
      />

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
