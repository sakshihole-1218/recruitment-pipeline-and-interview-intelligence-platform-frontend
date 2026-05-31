"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Link,
  Skeleton,
  Typography,
} from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useUser, useUpdateUser } from "@/features/users/hooks/use-users";
import {
  editUserSchema,
  type EditUserFormValues,
} from "@/features/users/schemas/user.schema";
import { UserFormFields } from "@/features/users/components/user-form-fields";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { snackbar, showError, closeSnackbar } = useSnackbar();

  const { data, isLoading } = useUser(id);
  const user = data?.data;

  const updateUser = useUpdateUser(id);

  const methods = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      is_active: true,
    },
  });

  // Prefill form once user data arrives
  useEffect(() => {
    if (user) {
      methods.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone ?? "",
        password: "",
        is_active: user.is_active,
      });
    }
  }, [user, methods]);

  const onSubmit = async (values: EditUserFormValues) => {
    try {
      const payload: Record<string, unknown> = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        is_active: values.is_active,
      };

      // Only include phone if it has a value
      if (values.phone && values.phone.trim() !== "") {
        payload.phone = values.phone.trim();
      } else if (values.phone === "" || values.phone === null) {
        payload.phone = null;
      }

      // Only include password if the user typed a new one
      if (values.password && values.password.trim() !== "") {
        payload.password = values.password;
      }

      await updateUser.mutateAsync(
        payload as Parameters<typeof updateUser.mutateAsync>[0],
      );
      router.push(`${ROUTES.USERS}/${id}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  return (
    <Box sx={{ maxWidth: 780, mx: "auto" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.USERS} underline="hover" color="inherit">
          Users
        </Link>
        <Link
          component={NextLink}
          href={`${ROUTES.USERS}/${id}`}
          underline="hover"
          color="inherit"
        >
          {isLoading ? (
            <Skeleton width={100} />
          ) : (
            `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
          )}
        </Link>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      {/* Page header */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Edit User
      </Typography>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {isLoading ? (
            <Box>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={56} sx={{ mb: 2 }} />
              ))}
            </Box>
          ) : (
            <FormProvider {...methods}>
              <Box
                component="form"
                onSubmit={methods.handleSubmit(onSubmit)}
                noValidate
              >
                <UserFormFields
                  mode="edit"
                  isSubmitting={updateUser.isPending}
                  onCancel={() => router.push(`${ROUTES.USERS}/${id}`)}
                />
              </Box>
            </FormProvider>
          )}
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
