"use client";

import NextLink from "next/link";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  TaskAlt as CompletedIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";

export function AiInterviewCompletedPage({ id }: { id: string }) {
  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.INTERVIEWS} underline="hover" color="inherit">
          Interviews
        </Link>
        <Link component={NextLink} href={`${ROUTES.INTERVIEWS}/${id}`} underline="hover" color="inherit">
          Interview Details
        </Link>
        <Typography color="text.primary">Interview Completed</Typography>
      </Breadcrumbs>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: 5 }}>
          <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
            <CompletedIcon color="success" sx={{ fontSize: 56 }} />

            <Stack spacing={1}>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                Interview Completed
              </Typography>
              <Typography variant="body1" color="text.secondary">
                The candidate session has ended successfully.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Evaluation is in progress. AI-generated insights and feedback will be available once downstream processing is added.
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                component={NextLink}
                href={ROUTES.INTERVIEWS}
                variant="outlined"
                sx={{ borderRadius: 2, fontWeight: 800 }}
              >
                Back to Interviews
              </Button>
              <Button
                component={NextLink}
                href={`${ROUTES.INTERVIEWS}/${id}`}
                variant="contained"
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                View Interview Details
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
