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
import {
  useDepartment,
  useUpdateDepartment,
} from "@/features/departments/hooks/use-departments";
import {
  DepartmentForm,
} from "@/features/departments/components/department-form";
import type { DepartmentFormValues } from "@/features/departments/schemas/department.schema";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

interface EditDepartmentPageProps {
  params: Promise<{ id: string }>;
}

export default function EditDepartmentPage({ params }: EditDepartmentPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const { data, isLoading } = useDepartment(id);
  const department = data?.data;

  const updateDepartment = useUpdateDepartment(id);

  const defaultValues: DepartmentFormValues | null = department
    ? {
        name: department.name,
        code: department.code,
        description: department.description ?? "",
        is_active: department.is_active,
      }
    : null;

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

      const result = await updateDepartment.mutateAsync(payload);
      showSuccess(result.message || "Department updated successfully");
      router.push(`${ROUTES.DEPARTMENTS}/${id}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  return (
    <Box sx={{ maxWidth: 780, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DEPARTMENTS} underline="hover" color="inherit">
          Departments
        </Link>
        <Link
          component={NextLink}
          href={`${ROUTES.DEPARTMENTS}/${id}`}
          underline="hover"
          color="inherit"
        >
          {isLoading ? <Skeleton width={160} /> : department?.name ?? "Department"}
        </Link>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
        Edit Department
      </Typography>

      <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <CardContent sx={{ p: 4 }}>
          {isLoading || !defaultValues ? (
            <Box>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} height={56} sx={{ mb: 2 }} />
              ))}
            </Box>
          ) : (
            <DepartmentForm
              key={department?.id}
              title="Update Department"
              subtitle="Update department metadata and status."
              defaultValues={defaultValues}
              submitLabel="Save Changes"
              isSubmitting={updateDepartment.isPending}
              onCancel={() => router.push(`${ROUTES.DEPARTMENTS}/${id}`)}
              onSubmit={onSubmit}
            />
          )}
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
