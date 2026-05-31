"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  ToggleOn as ActivateIcon,
  ToggleOff as DeactivateIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getUserRole } from "@/utils/rbac";
import { ROLES } from "@/constants/roles";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useUser, useToggleUserStatus } from "@/features/users/hooks/use-users";
import { UserStatusChip } from "@/features/users/components/user-status-chip";
import { ConfirmDialog } from "@/features/users/components/confirm-dialog";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";
import { useState } from "react";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>
        {typeof value === "string" ? (
          <Typography variant="body1">{value}</Typography>
        ) : (
          value
        )}
      </Box>
    </Grid>
  );
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const role = getUserRole();
  const isAdmin = role === ROLES.ADMIN;

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, isError, error } = useUser(id);
  const user = data?.data;

  const toggleStatus = useToggleUserStatus(id);

  const handleToggleConfirm = async () => {
    if (!user) return;
    try {
      await toggleStatus.mutateAsync(!user.is_active);
      showSuccess(
        `User ${!user.is_active ? "activated" : "deactivated"} successfully.`,
      );
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setConfirmOpen(false);
    }
  };

  const fullName = user ? `${user.first_name} ${user.last_name}` : "";
  const initials = user
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : "";

  if (isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load user
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getApiErrorMessage(error)}
        </Typography>
        <Button
          variant="outlined"
          sx={{ mt: 3 }}
          onClick={() => router.push(ROUTES.USERS)}
        >
          Back to Users
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.USERS} underline="hover" color="inherit">
          Users
        </Link>
        <Typography color="text.primary">
          {isLoading ? <Skeleton width={120} /> : fullName}
        </Typography>
      </Breadcrumbs>

      {/* Page header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 3, gap: 2 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Button
            variant="text"
            startIcon={<BackIcon />}
            onClick={() => router.push(ROUTES.USERS)}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            User Details
          </Typography>
        </Stack>

        {isAdmin && user && (
          <Stack direction="row" sx={{ gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={user.is_active ? <DeactivateIcon /> : <ActivateIcon />}
              color={user.is_active ? "error" : "success"}
              onClick={() => setConfirmOpen(true)}
            >
              {user.is_active ? "Deactivate" : "Activate"}
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => router.push(`${ROUTES.USERS}/${id}/edit`)}
            >
              Edit
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Main card */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {isLoading ? (
            <Stack spacing={2}>
              <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
                <Skeleton variant="circular" width={64} height={64} />
                <Box>
                  <Skeleton width={200} height={28} />
                  <Skeleton width={160} height={20} />
                </Box>
              </Stack>
              <Skeleton height={1} />
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} width="100%" height={48} />
              ))}
            </Stack>
          ) : user ? (
            <>
              {/* Avatar + name */}
              <Stack direction="row" sx={{ gap: 2.5, alignItems: "center", mb: 3 }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    fontSize: "1.5rem",
                    bgcolor: "primary.main",
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
                <Box sx={{ ml: "auto" }}>
                  <UserStatusChip isActive={user.is_active} />
                </Box>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              {/* Details grid */}
              <Grid container spacing={3}>
                <DetailRow label="First Name" value={user.first_name} />
                <DetailRow label="Last Name" value={user.last_name} />
                <DetailRow label="Email" value={user.email} />
                <DetailRow
                  label="Phone"
                  value={
                    user.phone ?? (
                      <Typography variant="body2" color="text.disabled">
                        Not provided
                      </Typography>
                    )
                  }
                />
                <DetailRow
                  label="Last Login"
                  value={
                    user.last_login_at
                      ? new Date(user.last_login_at).toLocaleString()
                      : (
                          <Typography variant="body2" color="text.disabled">
                            Never
                          </Typography>
                        )
                  }
                />
                <DetailRow
                  label="Member Since"
                  value={new Date(user.created_at).toLocaleDateString()}
                />
                <Grid size={12}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Roles
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((r) => (
                        <Chip
                          key={r.id}
                          label={r.name}
                          variant="outlined"
                          color="primary"
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        No roles assigned
                      </Typography>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      {user && (
        <ConfirmDialog
          open={confirmOpen}
          title={user.is_active ? "Deactivate User" : "Activate User"}
          description={
            user.is_active
              ? `Are you sure you want to deactivate ${fullName}? They will lose access to the system.`
              : `Are you sure you want to activate ${fullName}?`
          }
          confirmLabel={user.is_active ? "Deactivate" : "Activate"}
          confirmColor={user.is_active ? "error" : "success"}
          loading={toggleStatus.isPending}
          onConfirm={handleToggleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
