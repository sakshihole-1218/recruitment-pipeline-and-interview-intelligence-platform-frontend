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
  Apartment as DepartmentsIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useCreateDepartment } from "@/features/departments/hooks/use-departments";
import {
  DepartmentForm,
} from "@/features/departments/components/department-form";
import type { DepartmentFormValues } from "@/features/departments/schemas/department.schema";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

export default function CreateDepartmentPage() {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const createDepartment = useCreateDepartment();

  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      const payload = {
        name: values.name.trim(),
        code: values.code.trim(),
        description:
          values.description && values.description.trim() !== ""
            ? values.description.trim()
            : null,
        is_active: values.is_active ?? true,
      };

      const result = await createDepartment.mutateAsync(payload);
      showSuccess(result.message || "Department created successfully");
      router.push(`${ROUTES.DEPARTMENTS}/${result.data.id}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  return (
    <Box sx={{ maxWidth: 780, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          component={NextLink}
          href={ROUTES.DEPARTMENTS}
          underline="hover"
          color="text.secondary"
          sx={{ fontWeight: 500, fontSize: "0.875rem" }}
        >
          Departments
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
              <DepartmentsIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Create Department
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Add a new department used across job openings and workflows.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <DepartmentForm
            title="Department Information"
            subtitle="Provide the department name, code and optional description."
            submitLabel="Create"
            isSubmitting={createDepartment.isPending}
            onCancel={() => router.push(ROUTES.DEPARTMENTS)}
            onSubmit={onSubmit}
          />
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
