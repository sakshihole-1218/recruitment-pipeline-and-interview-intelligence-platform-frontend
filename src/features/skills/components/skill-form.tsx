"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

import {
  skillSchema,
  type SkillFormValues,
} from "@/features/skills/schemas/skill.schema";
import {
  SKILL_CATEGORIES,
  SKILL_CATEGORY_LABELS,
} from "@/features/skills/types/skills.types";

export interface SkillFormProps {
  title: string;
  subtitle?: string;
  defaultValues?: Partial<SkillFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  disableSubmit?: boolean;
  showStatusToggle?: boolean;
  onCancel?: () => void;
  onSubmit: (values: SkillFormValues) => void | Promise<void>;
}

export function SkillForm({
  title,
  subtitle,
  defaultValues,
  submitLabel = "Save",
  isSubmitting,
  disableSubmit,
  showStatusToggle = true,
  onCancel,
  onSubmit,
}: SkillFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      code: defaultValues?.code ?? "",
      description: defaultValues?.description ?? "",
      category:
        (defaultValues?.category as SkillFormValues["category"]) ??
        SKILL_CATEGORIES[0],
      is_active: defaultValues?.is_active ?? true,
    },
    mode: "onTouched",
  });

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={0.75}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Skill Name"
                fullWidth
                placeholder="e.g. TypeScript"
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Skill Code"
                fullWidth
                placeholder="e.g. TYPESCRIPT"
                {...register("code")}
                error={!!errors.code}
                helperText={errors.code?.message ?? "Uppercase, numbers, underscores"}
                slotProps={{
                  htmlInput: { style: { textTransform: "uppercase" } },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Category"
                    fullWidth
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.category}
                    helperText={errors.category?.message}
                  >
                    {SKILL_CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>
                        {SKILL_CATEGORY_LABELS[c]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              {showStatusToggle ? (
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                          color="success"
                        />
                      }
                      label={
                        <Typography sx={{ fontWeight: 700 }}>
                          {field.value ? "Active" : "Inactive"}
                        </Typography>
                      }
                    />
                  )}
                />
              ) : null}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={3}
                placeholder="Optional description"
                {...register("description")}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ justifyContent: "flex-end" }}
              >
                {onCancel ? (
                  <Button
                    variant="outlined"
                    onClick={onCancel}
                    sx={{ borderRadius: 2, px: 2.5 }}
                  >
                    Cancel
                  </Button>
                ) : null}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={!!disableSubmit || !!isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : undefined
                  }
                  sx={{ borderRadius: 2, px: 3, fontWeight: 800 }}
                >
                  {submitLabel}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}
