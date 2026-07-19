import { createTheme } from "@mui/material/styles";

const baseOptions = {
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
          "&:hover": {
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          },
        },
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
        root: {
          border: "none",
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(224, 224, 224, 0.1)",
          },
          "& .MuiDataGrid-columnHeaders": {
            borderBottom: "none",
            backgroundColor: "rgba(0, 0, 0, 0.02)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 700,
          },
          "& .MuiDataGrid-row": {
            transition: "background-color 0.2s, transform 0.2s",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
              transform: "translateY(-1px)",
            },
            "&:nth-of-type(even)": {
              backgroundColor: "rgba(0, 0, 0, 0.01)",
            },
          },
        },
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