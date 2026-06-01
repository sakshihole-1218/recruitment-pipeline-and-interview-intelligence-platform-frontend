"use client";

import { useRouter } from "next/navigation";
import {
  alpha,
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  NavigateNext as NavigateNextIcon,
  Psychology as SkillsIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useCreateSkill } from "@/features/skills/hooks/use-skills";
import { SkillForm } from "@/features/skills/components/skill-form";
import type { SkillFormValues } from "@/features/skills/schemas/skill.schema";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

export default function CreateSkillPage() {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const createSkill = useCreateSkill();

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

      const result = await createSkill.mutateAsync(payload);
      showSuccess(result.message || "Skill created successfully");
      router.push(`${ROUTES.SKILLS}/${result.data.id}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  return (
    <Box sx={{ maxWidth: 780, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          component={NextLink}
          href={ROUTES.SKILLS}
          underline="hover"
          color="text.secondary"
          sx={{ fontWeight: 500, fontSize: "0.875rem" }}
        >
          Skills
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
          Create
        </Typography>
      </Breadcrumbs>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 4,
            py: 3,
            background: (t) =>
              `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.08)} 0%, ${alpha(t.palette.primary.main, 0.03)} 100%)`,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SkillsIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Create Skill
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Add a new skill used for job requirements and interviewer evaluation.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <SkillForm
            title="Skill Information"
            subtitle="Provide name, code, category and optional description."
            submitLabel="Create"
            isSubmitting={createSkill.isPending}
            onCancel={() => router.push(ROUTES.SKILLS)}
            onSubmit={onSubmit}
          />
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
