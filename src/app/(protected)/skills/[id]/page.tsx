"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  ToggleOff as DeactivateIcon,
  ToggleOn as ActivateIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useSkill, useUpdateSkillStatus } from "@/features/skills/hooks/use-skills";
import { useSkillsPermissions } from "@/features/skills/hooks/use-skills-permissions";
import { SkillStatusChip } from "@/features/skills/components/skill-status-chip";
import { ConfirmDialog } from "@/features/skills/components/confirm-dialog";
import { SKILL_CATEGORY_LABELS } from "@/features/skills/types/skills.types";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

interface SkillDetailPageProps {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 800, letterSpacing: 0.2 }}
      >
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>
        {typeof value === "string" ? (
          <Typography variant="body1">{value}</Typography>
        ) : (
          value
        )}
      </Box>
    </Grid>
  );
}

export default function SkillDetailPage({ params }: SkillDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const { canEditSkill, canToggleSkillStatus } = useSkillsPermissions();

  const { data, isLoading, isError, error } = useSkill(id);
  const skill = data?.data;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const toggleStatus = useUpdateSkillStatus(id);

  const createdAt = skill?.created_at ? new Date(skill.created_at).toLocaleString() : "";
  const updatedAt = skill?.updated_at ? new Date(skill.updated_at).toLocaleString() : "";

  const handleToggleConfirm = async () => {
    if (!skill) return;
    try {
      await toggleStatus.mutateAsync(!skill.is_active);
      showSuccess(`Skill ${!skill.is_active ? "activated" : "deactivated"} successfully.`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setConfirmOpen(false);
    }
  };

  if (isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load skill
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getApiErrorMessage(error)}
        </Typography>
        <Button variant="outlined" sx={{ mt: 3 }} onClick={() => router.push(ROUTES.SKILLS)}>
          Back to Skills
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.SKILLS} underline="hover" color="inherit">
          Skills
        </Link>
        <Typography color="text.primary">
          {isLoading ? <Skeleton width={180} /> : skill?.name}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 3,
          gap: 2,
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Button
            variant="text"
            startIcon={<BackIcon />}
            onClick={() => router.push(ROUTES.SKILLS)}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Skill Details
          </Typography>
        </Stack>

        {skill ? (
          <Stack direction="row" sx={{ gap: 1.5 }}>
            {canToggleSkillStatus ? (
              <Button
                variant="outlined"
                startIcon={skill.is_active ? <DeactivateIcon /> : <ActivateIcon />}
                color={skill.is_active ? "error" : "success"}
                onClick={() => setConfirmOpen(true)}
              >
                {skill.is_active ? "Deactivate" : "Activate"}
              </Button>
            ) : null}

            {canEditSkill ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => router.push(`${ROUTES.SKILLS}/${id}/edit`)}
              >
                Edit
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Stack>

      <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {isLoading ? (
            <Stack spacing={2}>
              <Skeleton width={300} height={28} />
              <Skeleton width={220} height={20} />
              <Skeleton height={1} />
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} width="100%" height={48} />
              ))}
            </Stack>
          ) : skill ? (
            <>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                sx={{ gap: 1, alignItems: { sm: "center" }, mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {skill.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Code: <Box component="span" sx={{ fontWeight: 800 }}>{skill.code}</Box>
                  </Typography>
                </Box>
                <Box sx={{ ml: { sm: "auto" } }}>
                  <SkillStatusChip isActive={skill.is_active} />
                </Box>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <DetailRow label="Name" value={skill.name} />
                <DetailRow label="Code" value={skill.code} />
                <DetailRow label="Category" value={SKILL_CATEGORY_LABELS[skill.category]} />
                <DetailRow
                  label="Description"
                  value={
                    skill.description ? (
                      skill.description
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    )
                  }
                />
                <DetailRow label="Status" value={<SkillStatusChip isActive={skill.is_active} />} />
                <DetailRow label="Created At" value={createdAt} />
                <DetailRow label="Updated At" value={updatedAt} />
              </Grid>
            </>
          ) : null}
        </CardContent>
      </Card>

      {skill ? (
        <ConfirmDialog
          open={confirmOpen}
          title={skill.is_active ? "Deactivate Skill" : "Activate Skill"}
          description={
            skill.is_active
              ? `Are you sure you want to deactivate ${skill.name}?`
              : `Are you sure you want to activate ${skill.name}?`
          }
          confirmLabel={skill.is_active ? "Deactivate" : "Activate"}
          confirmColor={skill.is_active ? "error" : "success"}
          loading={toggleStatus.isPending}
          onConfirm={handleToggleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
