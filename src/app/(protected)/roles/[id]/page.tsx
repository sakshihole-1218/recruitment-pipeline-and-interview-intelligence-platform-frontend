"use client";

import { use, useMemo } from "react";
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
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useRole } from "@/features/roles/hooks/use-roles";
import { useRolesPermissions } from "@/features/roles/hooks/use-roles-permissions";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

interface RoleDetailPageProps {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700, textTransform: "none", letterSpacing: 0.2 }}
      >
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>
        {typeof value === "string" ? <Typography variant="body1">{value}</Typography> : value}
      </Box>
    </Grid>
  );
}

export default function RoleDetailPage({ params }: RoleDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { snackbar, showError, closeSnackbar } = useSnackbar();

  const { canEditRole, roleMutationsSupported } = useRolesPermissions();

  const { data, isLoading, isError, error } = useRole(id);
  const role = data?.data;

  const createdAt = useMemo(
    () => (role?.created_at ? new Date(role.created_at).toLocaleString() : ""),
    [role?.created_at],
  );

  const updatedAt = useMemo(
    () => (role?.updated_at ? new Date(role.updated_at).toLocaleString() : ""),
    [role?.updated_at],
  );

  if (isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load role
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getApiErrorMessage(error)}
        </Typography>
        <Button variant="outlined" sx={{ mt: 3 }} onClick={() => router.push(ROUTES.ROLES)}>
          Back to Roles
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.ROLES} underline="hover" color="inherit">
          Roles
        </Link>
        <Typography color="text.primary">{isLoading ? <Skeleton width={180} /> : role?.name}</Typography>
      </Breadcrumbs>

      {/* Page header */}
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 3, gap: 2 }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Button variant="text" startIcon={<BackIcon />} onClick={() => router.push(ROUTES.ROLES)} sx={{ mr: 1 }}>
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Role Details
          </Typography>
        </Stack>

        {/* Edit button (backend does not support role mutations) */}
        {canEditRole ? (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => router.push(`${ROUTES.ROLES}/${id}/edit`)}
          >
            Edit
          </Button>
        ) : (
          <Tooltip title={roleMutationsSupported ? "" : "Role editing is not available (backend endpoint not implemented)"}>
            <span>
              <Button
                variant="contained"
                disabled
                startIcon={<EditIcon />}
                onClick={() => showError("Role editing is not available yet.")}
              >
                Edit
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>

      <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {isLoading ? (
            <Stack spacing={2}>
              <Skeleton width={280} height={28} />
              <Skeleton width={220} height={20} />
              <Skeleton height={1} />
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} width="100%" height={48} />
              ))}
            </Stack>
          ) : role ? (
            <>
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {role.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Code: <Box component="span" sx={{ fontWeight: 800 }}>{role.code}</Box>
                </Typography>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <DetailRow label="Role Name" value={role.name} />
                <DetailRow label="Role Code" value={role.code} />
                <DetailRow
                  label="Status"
                  value={
                    <Typography variant="body2" color="text.secondary">
                      Not provided by backend
                    </Typography>
                  }
                />
                <DetailRow
                  label="Description"
                  value={
                    role.description ? (
                      role.description
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    )
                  }
                />
                <DetailRow label="Created At" value={createdAt} />
                <DetailRow label="Updated At" value={updatedAt} />
              </Grid>
            </>
          ) : null}
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
