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
import {
  useDepartment,
  useUpdateDepartmentStatus,
} from "@/features/departments/hooks/use-departments";
import { useDepartmentsPermissions } from "@/features/departments/hooks/use-departments-permissions";
import { DepartmentStatusChip } from "@/features/departments/components/department-status-chip";
import { ConfirmDialog } from "@/features/departments/components/confirm-dialog";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

interface DepartmentDetailPageProps {
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
        {typeof value === "string" ? <Typography variant="body1">{value}</Typography> : value}
      </Box>
    </Grid>
  );
}

export default function DepartmentDetailPage({ params }: DepartmentDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const { canEditDepartment, canToggleDepartmentStatus } = useDepartmentsPermissions();

  const { data, isLoading, isError, error } = useDepartment(id);
  const department = data?.data;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const toggleStatus = useUpdateDepartmentStatus(id);

  const createdAt = department?.created_at
    ? new Date(department.created_at).toLocaleString()
    : "";

  const updatedAt = department?.updated_at
    ? new Date(department.updated_at).toLocaleString()
    : "";

  const handleToggleConfirm = async () => {
    if (!department) return;
    try {
      await toggleStatus.mutateAsync(!department.is_active);
      showSuccess(
        `Department ${!department.is_active ? "activated" : "deactivated"} successfully.`,
      );
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
          Failed to load department
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getApiErrorMessage(error)}
        </Typography>
        <Button
          variant="outlined"
          sx={{ mt: 3 }}
          onClick={() => router.push(ROUTES.DEPARTMENTS)}
        >
          Back to Departments
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DEPARTMENTS} underline="hover" color="inherit">
          Departments
        </Link>
        <Typography color="text.primary">
          {isLoading ? <Skeleton width={180} /> : department?.name}
        </Typography>
      </Breadcrumbs>

      {/* Page header */}
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
            onClick={() => router.push(ROUTES.DEPARTMENTS)}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Department Details
          </Typography>
        </Stack>

        {department ? (
          <Stack direction="row" sx={{ gap: 1.5 }}>
            {canToggleDepartmentStatus ? (
              <Button
                variant="outlined"
                startIcon={department.is_active ? <DeactivateIcon /> : <ActivateIcon />}
                color={department.is_active ? "error" : "success"}
                onClick={() => setConfirmOpen(true)}
              >
                {department.is_active ? "Deactivate" : "Activate"}
              </Button>
            ) : null}

            {canEditDepartment ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => router.push(`${ROUTES.DEPARTMENTS}/${id}/edit`)}
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
          ) : department ? (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1, alignItems: { sm: "center" }, mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {department.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Code: <Box component="span" sx={{ fontWeight: 800 }}>{department.code}</Box>
                  </Typography>
                </Box>
                <Box sx={{ ml: { sm: "auto" } }}>
                  <DepartmentStatusChip isActive={department.is_active} />
                </Box>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <DetailRow label="Name" value={department.name} />
                <DetailRow label="Code" value={department.code} />
                <DetailRow
                  label="Description"
                  value={
                    department.description ? (
                      department.description
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    )
                  }
                />
                <DetailRow
                  label="Status"
                  value={<DepartmentStatusChip isActive={department.is_active} />}
                />
                <DetailRow label="Created At" value={createdAt} />
                <DetailRow label="Updated At" value={updatedAt} />
              </Grid>
            </>
          ) : null}
        </CardContent>
      </Card>

      {department ? (
        <ConfirmDialog
          open={confirmOpen}
          title={department.is_active ? "Deactivate Department" : "Activate Department"}
          description={
            department.is_active
              ? `Are you sure you want to deactivate ${department.name}?`
              : `Are you sure you want to activate ${department.name}?`
          }
          confirmLabel={department.is_active ? "Deactivate" : "Activate"}
          confirmColor={department.is_active ? "error" : "success"}
          loading={toggleStatus.isPending}
          onConfirm={handleToggleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
