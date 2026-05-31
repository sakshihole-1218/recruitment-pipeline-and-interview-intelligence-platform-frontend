"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Avatar,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";

import { authStorage } from "@/shared/utils/auth-storage";
import { authService } from "@/features/auth/services/auth.service";
import { ROUTES } from "@/shared/constants/routes";
import { SIDEBAR_WIDTH } from "@/shared/components/sidebar";

interface TopbarProps {
  onMobileMenuOpen: () => void;
}

export function Topbar({ onMobileMenuOpen }: TopbarProps) {
  const router = useRouter();
  const user = authStorage.getUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userInitials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "U";

  const fullName = user ? `${user.first_name} ${user.last_name}` : "User";

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch {
      // Intentionally swallow — still clear local state
    } finally {
      authStorage.clear();
      router.replace(ROUTES.LOGIN);
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { md: `${SIDEBAR_WIDTH}px` },
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "text.primary",
      }}
    >
      <Toolbar sx={{ minHeight: "64px !important", px: { xs: 2, sm: 3 } }}>
        {/* Mobile hamburger */}
        <IconButton
          edge="start"
          onClick={onMobileMenuOpen}
          sx={{ mr: 1, display: { md: "none" } }}
          aria-label="open navigation"
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flex: 1 }} />

        {/* Right section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title={fullName}>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              aria-controls={Boolean(anchorEl) ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? "true" : undefined}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "primary.main",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {userInitials}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Account dropdown menu */}
      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: { minWidth: 220, mt: 0.5, borderRadius: 2 },
          },
        }}
      >
        {/* User info header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {fullName}
          </Typography>
          {user?.email && (
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          )}
          {user?.roles && user.roles.length > 0 && (
            <Box sx={{ mt: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  bgcolor: "primary.50",
                  color: "primary.main",
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  fontWeight: 600,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {user.roles[0]}
              </Typography>
            </Box>
          )}
        </Box>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1.5, py: 1 }}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          sx={{ gap: 1.5, py: 1, color: "error.main" }}
        >
          <ListItemIcon>
            {isLoggingOut ? (
              <CircularProgress size={16} color="error" />
            ) : (
              <LogoutIcon fontSize="small" color="error" />
            )}
          </ListItemIcon>
          {isLoggingOut ? "Logging out…" : "Logout"}
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
