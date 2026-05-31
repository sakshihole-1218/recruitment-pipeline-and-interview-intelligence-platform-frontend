"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
} from "@mui/material";
import { LockOutlined as LockIcon } from "@mui/icons-material";

import { canAccessRoute } from "@/shared/utils/rbac";
import { ROUTES } from "@/shared/constants/routes";

interface RouteGuardProps {
  children: React.ReactNode;
}

const noop = () => () => {};

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Server snapshot → null (unknown access during SSR → renders nothing).
  // Client snapshot → reads localStorage role and checks against allowed routes.
  // Consistent initial value prevents hydration mismatches.
  const accessState = useSyncExternalStore(
    noop,
    () => (canAccessRoute(pathname) ? "allowed" : "denied"),
    () => null, // server snapshot — render nothing until client resolves
  );

  if (accessState === null) {
    // Still hydrating — render nothing to avoid flicker
    return null;
  }

  if (accessState === "denied") {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
            textAlign: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "error.50",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
            }}
          >
            <LockIcon sx={{ fontSize: 40, color: "error.main" }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You don&apos;t have permission to view this page.
            <br />
            Please contact your administrator if you believe this is a mistake.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.replace(ROUTES.DASHBOARD)}
            sx={{ mt: 1 }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  return <>{children}</>;
}
