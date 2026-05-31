"use client";

import { useMutation } from "@tanstack/react-query";

import { authService } from "@/features/auth/services/auth.service";
import { LoginRequest } from "@/features/auth/types/auth.types";

export function useLogin() {
  const mutation = useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
  });

  return {
    loginAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
