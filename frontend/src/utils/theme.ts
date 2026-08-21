import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0d1117",
      paper: "#161b22",
    },
    primary: { main: "#58a6ff" },
    secondary: { main: "#3fb950" },
    error: { main: "#f85149" },
    warning: { main: "#d29922" },
    success: { main: "#3fb950" },
    divider: "#30363d",
    text: {
      primary: "#e6edf3",
      secondary: "#8b949e",
    },
  },
  typography: {
    fontFamily: '"Inter", "JetBrains Mono", monospace',
    fontSize: 13,
  },
  shape: { borderRadius: 6 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Раніше тут був примусовий minWidth: 1280 — саме через нього
        // застосунок завжди рендерився як десктопна версія, навіть на
        // телефоні (сторінка просто масштабувалась, а не адаптувалась).
        body: { scrollbarColor: "#30363d #0d1117" },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", border: "1px solid #30363d" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: "#30363d" },
      },
    },
  },
});

export const STATUS_COLORS: Record<string, string> = {
  Warehouse: "#3fb950",
  Issued: "#58a6ff",
  Returned: "#d29922",
  "Written Off": "#8b949e",
};

export const STATUS_UA: Record<string, string> = {
  Warehouse: "Склад",
  Issued: "Видано",
  Returned: "Повернуто",
  "Written Off": "Списано",
};

export const DAYS_COLORS = (days: number): string => {
  if (days <= 30) return "#e6edf3";
  if (days <= 60) return "#d29922";
  if (days <= 90) return "#f0883e";
  return "#f85149";
};
