"use client";

import { ReactNode } from "react";

import { ReactQueryProvider } from "@/shared/providers/react-query-provider";

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}