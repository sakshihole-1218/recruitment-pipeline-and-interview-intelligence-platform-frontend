"use client";

import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { TaskAlt as CheckIcon } from "@mui/icons-material";

const INSTRUCTIONS = [
  "Keep camera on",
  "Keep microphone enabled",
  "Sit in a quiet environment",
  "Do not switch tabs",
  "Look into the camera",
  "Click Join Interview when ready",
];

export function InterviewInstructionsCard() {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
          Before You Join
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Please review these instructions so the interview starts smoothly.
        </Typography>

        <List disablePadding>
          {INSTRUCTIONS.map((instruction) => (
            <ListItem key={instruction} disableGutters sx={{ alignItems: "flex-start", py: 0.75 }}>
              <ListItemIcon sx={{ minWidth: 32, mt: 0.25 }}>
                <CheckIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={instruction} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
