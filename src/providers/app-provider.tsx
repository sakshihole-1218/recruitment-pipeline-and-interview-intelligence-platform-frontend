"use client";

import { ReactNode } from "react";

import { ReactQueryProvider } from "@/providers/react-query-provider";
import { AppThemeProvider } from "@/providers/theme-provider";

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