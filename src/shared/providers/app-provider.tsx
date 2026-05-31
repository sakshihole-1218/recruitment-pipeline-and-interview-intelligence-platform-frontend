"use client";

import { ReactNode } from "react";

import { ReactQueryProvider } from "@/shared/providers/react-query-provider";
import { AppThemeProvider } from "@/shared/providers/theme-provider";

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <AppThemeProvider>
      <ReactQueryProvider>{children}</ReactQueryProvider>
    </AppThemeProvider>
  );
}