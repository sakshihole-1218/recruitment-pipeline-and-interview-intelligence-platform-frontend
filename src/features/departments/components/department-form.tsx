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
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

import {
  departmentSchema,
  type DepartmentFormValues,
} from "@/features/departments/schemas/department.schema";

export interface DepartmentFormProps {
  title: string;
  subtitle?: string;
  defaultValues?: Partial<DepartmentFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  disableSubmit?: boolean;
  showStatusToggle?: boolean;
  onCancel?: () => void;
  onSubmit: (values: DepartmentFormValues) => void | Promise<void>;
}

export function DepartmentForm({
  title,
  subtitle,
  defaultValues,
  submitLabel = "Save",
  isSubmitting,
  disableSubmit,
  showStatusToggle = true,
  onCancel,
  onSubmit,
}: DepartmentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      code: defaultValues?.code ?? "",
      description: defaultValues?.description ?? "",
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
                label="Department Name"
                fullWidth
                placeholder="e.g. Engineering"
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Department Code"
                fullWidth
                placeholder="e.g. ENG"
                {...register("code")}
                error={!!errors.code}
                helperText={errors.code?.message ?? "Uppercase, numbers, underscores"}
                slotProps={{
                  htmlInput: { style: { textTransform: "uppercase" } },
                }}
              />
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

            {showStatusToggle ? (
              <Grid size={{ xs: 12 }}>
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
              </Grid>
            ) : null}

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
