"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff, WorkOutlined } from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";

import { loginSchema, LoginFormValues } from "@/features/auth/schemas/login.schema";
import { useLogin } from "@/features/auth/hooks/use-login";
import { authStorage } from "@/utils/auth-storage";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { darkTheme } from "@/theme/theme";

export function LoginForm() {
  const router = useRouter();
  const { loginAsync, isPending } = useLogin();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    authStorage.clear();
    try {
      const response = await loginAsync(values);
      authStorage.setAccessToken(response.data.access_token);
      authStorage.setRefreshToken(response.data.refresh_token);
      authStorage.setUser(response.data.user);
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
        p: { xs: 3, sm: 5 },
      }}
    >
      {/* Logo / Brand */}
      <Stack sx={{ alignItems: "center", gap: 1.5, mb: 4 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WorkOutlined sx={{ color: "white", fontSize: 30 }} />
        </Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, textAlign: "center", color: "common.white" }}
        >
          Recruitment Intelligence
        </Typography>
        <Typography
          variant="body2"
          sx={{ textAlign: "center", color: "grey.400" }}
        >
          Sign in to your admin account to continue
        </Typography>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Error Alert */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Form */}
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        method="post"
        noValidate
        autoComplete="off"
      >
        <Stack sx={{ gap: 2.5 }}>
          <TextField
            {...register("email")}
            label="Email Address"
            type="email"
            fullWidth
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={{
              "& .MuiInputBase-input": { color: "common.white" },
              "& .MuiInputLabel-root": { color: "grey.400" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.2)" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.3)" },
            }}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <WorkOutlined sx={{ fontSize: 18, color: "grey.400" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            {...register("password")}
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            autoComplete="current-password"
            placeholder="Enter your password"
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={{
              "& .MuiInputBase-input": { color: "common.white" },
              "& .MuiInputLabel-root": { color: "grey.400" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.2)" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.3)" },
            }}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      sx={{ color: "grey.400" }}
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: 18 }} />
                      ) : (
                        <Visibility sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isPending}
            sx={{
              mt: 1,
              py: 1.5,
              fontWeight: 600,
              fontSize: "1rem",
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            {isPending ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Sign In"
            )}
          </Button>
        </Stack>
      </Box>

      {/* Footer */}
      <Stack sx={{ alignItems: "center", mt: 4, gap: 0.5 }}>
        <Typography variant="caption" sx={{ color: "grey.500" }}>
          © 2026 Recruitment Intelligence Platform
        </Typography>
        <Typography variant="caption" sx={{ color: "grey.500" }}>
          All rights reserved
        </Typography>
      </Stack>
    </Box>
    </ThemeProvider>
  );
}
