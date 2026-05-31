"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";

import { roleSchema, type RoleFormSchemaValues } from "@/features/roles/schemas/role.schema";

export interface RoleFormProps {
  title: string;
  subtitle?: string;
  defaultValues?: Partial<RoleFormSchemaValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  disableSubmit?: boolean;
  onCancel?: () => void;
  onSubmit: (values: RoleFormSchemaValues) => void | Promise<void>;
}

export function RoleForm({
  title,
  subtitle,
  defaultValues,
  submitLabel = "Save",
  isSubmitting,
  disableSubmit,
  onCancel,
  onSubmit,
}: RoleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormSchemaValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      code: defaultValues?.code ?? "",
      description: defaultValues?.description ?? "",
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
                label="Role Name"
                fullWidth
                placeholder="e.g. Recruiter"
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Role Code"
                fullWidth
                placeholder="e.g. RECRUITER"
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
                    isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined
                  }
                  sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
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
