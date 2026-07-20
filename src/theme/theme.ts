import { createTheme, ThemeOptions } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

const baseOptions: ThemeOptions = {
  typography: {
    fontFamily: "var(--font-inter), Arial, sans-serif",
    button: {
      textTransform: "none" as const,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none" as const,
          boxShadow: "none",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            transform: "scale(1.02)",
          },
          "&:active": {
            transform: "scale(0.98)",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          transition: "all 0.2s ease",
          "&.Mui-focused": {
            boxShadow: theme.palette.mode === "dark" 
              ? "0 0 0 3px rgba(139, 92, 246, 0.2)" 
              : "0 0 0 3px rgba(79, 70, 229, 0.2)",
            transform: "translateY(-1px)",
          },
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: "none",
          "& .MuiDataGrid-cell": {
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
          },
          "& .MuiDataGrid-columnHeaders": {
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.875rem",
          },
          "& .MuiDataGrid-row": {
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
              transform: "translateY(-2px)",
              boxShadow: theme.palette.mode === "dark" ? "0 8px 16px rgba(0,0,0,0.4)" : "0 8px 16px rgba(0,0,0,0.1)",
              borderRadius: "8px",
              zIndex: 1,
            },
            "&:nth-of-type(even)": {
              backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)",
            },
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: `1px solid ${theme.palette.divider}`,
          },
        }),
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: "light",
    primary: {
      main: "#4F46E5",
    },
    background: {
      default: "#F8FAFC",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
    },
  },
});

export const darkTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: "dark",
    primary: {
      main: "#8B5CF6",
    },
    background: {
      default: "#0F172A",
      paper: "#1E293B",
    },
    text: {
      primary: "#F1F5F9",
    },
  },
});