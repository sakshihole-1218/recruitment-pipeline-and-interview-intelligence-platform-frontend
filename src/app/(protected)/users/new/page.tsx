"use client";

import { useRouter } from "next/navigation";
import {
  alpha,
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  NavigateNext as NavigateNextIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useCreateUser } from "@/features/users/hooks/use-users";
import {
  createUserSchema,
  type CreateUserFormValues,
} from "@/features/users/schemas/user.schema";
import { UserFormFields } from "@/features/users/components/user-form-fields";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

export default function CreateUserPage() {
  const router = useRouter();
  const { snackbar, showError, closeSnackbar } = useSnackbar();

  const createUser = useCreateUser();

  const methods = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      role_codes: [],
    },
  });

  const onSubmit = async (values: CreateUserFormValues) => {
    try {
      const payload = {
        ...values,
        phone: values.phone?.trim() || undefined,
        role_codes:
          values.role_codes && values.role_codes.length > 0
            ? values.role_codes
            : undefined,
      };
      await createUser.mutateAsync(payload);
      router.push(ROUTES.USERS);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  return (
    <Box sx={{ maxWidth: 780, mx: "auto" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 3 }}
      >
        <Link
          component={NextLink}
          href={ROUTES.USERS}
          underline="hover"
          color="text.secondary"
          sx={{ fontWeight: 500, fontSize: "0.875rem" }}
        >
          Users
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
          Create User
        </Typography>
      </Breadcrumbs>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {/* Card header strip */}
        <Box
          sx={{
            px: 4,
            py: 3,
            background: (t) =>
              `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.08)} 0%, ${alpha(t.palette.primary.main, 0.03)} 100%)`,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <PersonAddIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Create New User
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Fill in the details below to add a new system user
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <FormProvider {...methods}>
            <Box
              component="form"
              onSubmit={methods.handleSubmit(onSubmit)}
              noValidate
            >
              <UserFormFields
                mode="create"
                isSubmitting={createUser.isPending}
                onCancel={() => router.push(ROUTES.USERS)}
              />
            </Box>
          </FormProvider>
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
