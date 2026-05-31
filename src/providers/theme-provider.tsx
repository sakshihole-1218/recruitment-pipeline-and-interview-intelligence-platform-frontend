"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";

import { theme } from "@/theme/theme";

interface AppThemeProviderProps {
  children: React.ReactNode;
}

export function AppThemeProvider({
  children,
}: AppThemeProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}