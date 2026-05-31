"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Avatar,
  Box,
  Breadcrumbs,
  CircularProgress,
  Divider,
  IconButton,
  Link,
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
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { authStorage } from "@/utils/auth-storage";
import { authService } from "@/features/auth/services/auth.service";
import { ROUTES } from "@/constants/routes";
import { SIDEBAR_WIDTH } from "@/components/sidebar";

interface TopbarProps {
  onMobileMenuOpen: () => void;
}

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const isId = (s: string) =>
    /^[0-9a-f-]{8,}$/i.test(s) || /^\d+$/.test(s);

  return segments
    .map((seg, i) => ({
      label: isId(seg)
        ? seg
        : seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      path: "/" + segments.slice(0, i + 1).join("/"),
      isId: isId(seg),
    }))
    .filter((b) => !b.isId);
}

export function Topbar({ onMobileMenuOpen }: TopbarProps) {
  const router = useRouter();
  const user = authStorage.getUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const breadcrumbs = useBreadcrumbs();

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

    } finally {
      authStorage.clear();
      router.replace(ROUTES.LOGIN);
    }
  };

  const currentPageTitle =
    breadcrumbs.length > 0
      ? breadcrumbs[breadcrumbs.length - 1].label
      : "Home";

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
      <Toolbar sx={{ minHeight: "56px !important", px: { xs: 2, sm: 3 }, gap: 2 }}>
        {/* Mobile hamburger */}
        <IconButton
          edge="start"
          onClick={onMobileMenuOpen}
          sx={{ display: { md: "none" } }}
          aria-label="open navigation"
        >
          <MenuIcon />
        </IconButton>

        {/* Breadcrumb + page title */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {breadcrumbs.length > 1 && (
            <Breadcrumbs
              separator={<NavigateNextIcon sx={{ fontSize: 14 }} />}
              sx={{ mb: 0.1 }}
            >
              {breadcrumbs.slice(0, -1).map((b) => (
                <Link
                  key={b.path}
                  component={NextLink}
                  href={b.path}
                  underline="hover"
                  sx={{ fontSize: "0.72rem", color: "text.secondary" }}
                >
                  {b.label}
                </Link>
              ))}
              <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                {currentPageTitle}
              </Typography>
            </Breadcrumbs>
          )}
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: "1rem" }}
            noWrap
          >
            {currentPageTitle}
          </Typography>
        </Box>

        {/* Right: username + avatar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column", alignItems: "flex-end" }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {fullName}
            </Typography>
            {user?.roles && user.roles.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                {user.roles[0]}
              </Typography>
            )}
          </Box>
          <Tooltip title={fullName}>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              aria-controls={Boolean(anchorEl) ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? "true" : undefined}
              sx={{ p: 0 }}
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

      {/* Account dropdown */}
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
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {fullName}
          </Typography>
          {user?.email && (
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
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
