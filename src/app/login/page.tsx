import { Metadata } from "next";
import { Box } from "@mui/material";

import { AuthLayout } from "@/shared/layouts/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign In | Recruitment Intelligence Platform",
  description: "Sign in to the Recruitment Pipeline & Interview Intelligence Platform",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          py: 6,
          px: 2,
          background: "linear-gradient(135deg, #e3edf7 0%, #f8fafc 60%, #ede7f6 100%)",
        }}
      >
        <LoginForm />
      </Box>
    </AuthLayout>
  );
}
