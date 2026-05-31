"use client";

import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  AccountCircle as AccountIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
} from "@mui/icons-material";
import { Controller, useFormContext } from "react-hook-form";

import { useRoles } from "@/features/users/hooks/use-users";

interface UserFormFieldsProps {
  mode: "create" | "edit";
  isSubmitting: boolean;
  onCancel: () => void;
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.5 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.5,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", letterSpacing: 0.2 }}>
        {title}
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Stack>
  );
}

export function UserFormFields({
  mode,
  isSubmitting,
  onCancel,
}: UserFormFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const roles = rolesData?.data ?? [];

  return (
    <Stack sx={{ gap: 3.5 }}>
      {/* ── Personal Information ───────────────────────────────────── */}
      <Box>
        <SectionHeader
          icon={<AccountIcon sx={{ fontSize: 16, color: "primary.main" }} />}
          title="Personal Information"
        />
        <Stack sx={{ gap: 2.5, mt: 2 }}>
          {/* Name row */}
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
            <TextField
              {...register("first_name")}
              label="First Name"
              fullWidth
              error={!!errors.first_name}
              helperText={errors.first_name?.message as string | undefined}
              autoComplete="given-name"
            />
            <TextField
              {...register("last_name")}
              label="Last Name"
              fullWidth
              error={!!errors.last_name}
              helperText={errors.last_name?.message as string | undefined}
              autoComplete="family-name"
            />
          </Stack>

          {/* Email */}
          <TextField
            {...register("email")}
            label="Email Address"
            type="email"
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message as string | undefined}
            autoComplete="email"
          />

          {/* Phone */}
          <TextField
            {...register("phone")}
            label="Phone (optional)"
            placeholder="+919876543210"
            fullWidth
            error={!!errors.phone}
            helperText={
              (errors.phone?.message as string | undefined) ??
              "Include country code, e.g. +919876543210"
            }
            autoComplete="tel"
          />
        </Stack>
      </Box>

      {/* ── Account Details ─────────────────────────────────────────── */}
      <Box>
        <SectionHeader
          icon={<LockIcon sx={{ fontSize: 16, color: "primary.main" }} />}
          title="Account Details"
        />
        <Stack sx={{ gap: 2.5, mt: 2 }}>
          {/* Password */}
          <TextField
            {...register("password")}
            label={mode === "edit" ? "New Password (leave blank to keep)" : "Password"}
            type="password"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message as string | undefined}
            autoComplete={mode === "create" ? "new-password" : "current-password"}
          />

          {/* Active toggle – only on edit */}
          {mode === "edit" && (
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: field.value ? "success.light" : "divider",
                    bgcolor: (t) =>
                      field.value
                        ? alpha(t.palette.success.main, 0.04)
                        : alpha(t.palette.action.disabled, 0.04),
                    transition: "all 0.2s",
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Account Status
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {field.value ? "User can log in and access the system" : "User is blocked from logging in"}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value ?? true}
                        onChange={field.onChange}
                        color="success"
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: field.value ? "success.main" : "text.secondary",
                          minWidth: 56,
                        }}
                      >
                        {field.value ? "Active" : "Inactive"}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>
              )}
            />
          )}
        </Stack>
      </Box>

      {/* ── Roles & Permissions – only on create ──────────────────── */}
      {mode === "create" && (
        <Box>
          <SectionHeader
            icon={<ShieldIcon sx={{ fontSize: 16, color: "primary.main" }} />}
            title="Roles & Permissions"
          />
          <Stack sx={{ mt: 2 }}>
            <Controller
              name="role_codes"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.role_codes}>
                  <InputLabel id="role-codes-label">Assign Roles</InputLabel>
                  {rolesLoading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Loading roles…
                      </Typography>
                    </Box>
                  ) : (
                    <Select
                      labelId="role-codes-label"
                      multiple
                      value={field.value ?? []}
                      onChange={field.onChange}
                      input={<OutlinedInput label="Assign Roles" />}
                    >
                      {roles.map((role) => (
                        <MenuItem key={role.id} value={role.code}>
                          {role.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                  {errors.role_codes && (
                    <FormHelperText>
                      {errors.role_codes.message as string}
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Stack>
        </Box>
      )}

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <Divider />
      <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isSubmitting}
          sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          loading={isSubmitting}
          sx={{
            minWidth: 140,
            borderRadius: 2,
            fontWeight: 700,
            boxShadow: "0 2px 8px rgba(25,118,210,0.3)",
            "&:hover": { boxShadow: "0 4px 12px rgba(25,118,210,0.4)" },
          }}
        >
          {mode === "create" ? "Create User" : "Save Changes"}
        </Button>
      </Stack>
    </Stack>
  );
}
