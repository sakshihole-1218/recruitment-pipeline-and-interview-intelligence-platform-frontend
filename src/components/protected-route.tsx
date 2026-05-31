"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";

import { authStorage } from "@/utils/auth-storage";
import { ROUTES } from "@/constants/routes";

interface ProtectedRouteProps {
  children: React.ReactNode;
}


const noop = () => () => {};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();

  const token = useSyncExternalStore(
    noop,
    () => authStorage.getAccessToken(),
    () => null,
  );

  useEffect(() => {
    if (token === null) {
      router.replace(ROUTES.LOGIN);
    }
  }, [token, router]);

  if (token === null) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return <>{children}</>;
}

