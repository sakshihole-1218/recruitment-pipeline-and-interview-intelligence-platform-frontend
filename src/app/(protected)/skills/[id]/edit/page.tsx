"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Link,
  Skeleton,
  Typography,
} from "@mui/material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useSkill, useUpdateSkill } from "@/features/skills/hooks/use-skills";
import { SkillForm } from "@/features/skills/components/skill-form";
import type { SkillFormValues } from "@/features/skills/schemas/skill.schema";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

interface EditSkillPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSkillPage({ params }: EditSkillPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const { data, isLoading } = useSkill(id);
  const skill = data?.data;

  const updateSkill = useUpdateSkill(id);

  const defaultValues: SkillFormValues | null = skill
    ? {
        name: skill.name,
        code: skill.code,
        description: skill.description ?? "",
        category: skill.category,
        is_active: skill.is_active,
      }
    : null;

  const onSubmit = async (values: SkillFormValues) => {
    try {
      const payload = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        description:
          values.description && values.description.trim() !== ""
            ? values.description.trim()
            : null,
        category: values.category,
        is_active: values.is_active ?? true,
      };

      const result = await updateSkill.mutateAsync(payload);
      showSuccess(result.message || "Skill updated successfully");
      router.push(`${ROUTES.SKILLS}/${id}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  return (
    <Box sx={{ maxWidth: 780, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.SKILLS} underline="hover" color="inherit">
          Skills
        </Link>
        <Link
          component={NextLink}
          href={`${ROUTES.SKILLS}/${id}`}
          underline="hover"
          color="inherit"
        >
          {isLoading ? <Skeleton width={160} /> : skill?.name ?? "Skill"}
        </Link>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
        Edit Skill
      </Typography>

      <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <CardContent sx={{ p: 4 }}>
          {isLoading || !defaultValues ? (
            <Box>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={56} sx={{ mb: 2 }} />
              ))}
            </Box>
          ) : (
            <SkillForm
              key={skill?.id}
              title="Update Skill"
              subtitle="Update skill metadata and status."
              defaultValues={defaultValues}
              submitLabel="Save Changes"
              isSubmitting={updateSkill.isPending}
              onCancel={() => router.push(`${ROUTES.SKILLS}/${id}`)}
              onSubmit={onSubmit}
            />
          )}
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
