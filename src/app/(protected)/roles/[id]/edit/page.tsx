"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Breadcrumbs, Link, Skeleton, Stack, Typography } from "@mui/material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { RoleForm } from "@/features/roles/components/role-form";
import { useRole } from "@/features/roles/hooks/use-roles";
import type { RoleFormSchemaValues } from "@/features/roles/schemas/role.schema";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

interface EditRolePageProps {
  params: Promise<{ id: string }>;
}

export default function EditRolePage({ params }: EditRolePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { snackbar, showError, closeSnackbar } = useSnackbar();

  const { data, isLoading, isError, error } = useRole(id);
  const role = data?.data;

  const handleSubmit = async (_values: RoleFormSchemaValues) => {
    showError("Role editing is not available yet because the backend does not expose an update role endpoint.");
  };

  if (isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load role
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getApiErrorMessage(error)}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.ROLES} underline="hover" color="inherit">
          Roles
        </Link>
        <Link component={NextLink} href={`${ROUTES.ROLES}/${id}`} underline="hover" color="inherit">
          {isLoading ? <Skeleton width={120} /> : role?.name}
        </Link>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      <Stack spacing={2.5}>
        <Alert severity="info" variant="outlined">
          Role editing is not available yet. The current backend module provides only role listing and role details endpoints.
        </Alert>

        <RoleForm
          title="Edit Role"
          subtitle="Update role metadata"
          submitLabel="Save Changes"
          disableSubmit
          defaultValues={{
            name: role?.name ?? "",
            code: role?.code ?? "",
            description: role?.description ?? "",
          }}
          onCancel={() => router.push(`${ROUTES.ROLES}/${id}`)}
          onSubmit={handleSubmit}
        />
      </Stack>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
