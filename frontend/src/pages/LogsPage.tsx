import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useQuery } from "@tanstack/react-query";
import { logsApi } from "../api/logs";
import type { LogEntry } from "../api/logs";

const LEVEL_COLORS: Record<string, string> = {
  INFO: "#58a6ff",
  WARNING: "#d29922",
  ERROR: "#f85149",
  DEBUG: "#8b949e",
};

function LevelChip({ level }: { level: string }) {
  const color = LEVEL_COLORS[level] ?? "#8b949e";
  return (
    <Chip
      label={level}
      size="small"
      sx={{
        height: 18,
        fontSize: 10,
        bgcolor: color + "22",
        color,
        border: `1px solid ${color}44`,
      }}
    />
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const LIMITS = [100, 250, 500, 1000];

export default function LogsPage() {
  const [limit, setLimit] = useState(500);
  const [levelFilter, setLevelFilter] = useState<string>("ALL");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["logs", limit],
    queryFn: () => logsApi.list(limit).then((r) => r.data.data as LogEntry[]),
    refetchInterval: 30_000,
  });

  const rows =
    levelFilter === "ALL"
      ? (data ?? [])
      : (data ?? []).filter((l) => l.level === levelFilter);

  return (
    <Box
      sx={{
        maxWidth: 1100,
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 100px)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 2,
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mr: "auto" }}>
          Журнал подій
        </Typography>

        <Select
          size="small"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          sx={{
            fontSize: 12,
            minWidth: 110,
            "& fieldset": { borderColor: "#30363d" },
          }}
        >
          <MenuItem value="ALL">Всі рівні</MenuItem>
          {Object.keys(LEVEL_COLORS).map((l) => (
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          sx={{
            fontSize: 12,
            minWidth: 90,
            "& fieldset": { borderColor: "#30363d" },
          }}
        >
          {LIMITS.map((n) => (
            <MenuItem key={n} value={n}>
              Останні {n}
            </MenuItem>
          ))}
        </Select>

        <Button
          size="small"
          variant="outlined"
          startIcon={
            isFetching ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <RefreshIcon />
            )
          }
          onClick={() => refetch()}
          disabled={isFetching}
          sx={{ borderColor: "#30363d", color: "text.secondary" }}
        >
          Оновити
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Paper
          sx={{
            bgcolor: "#161b22",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TableContainer sx={{ flex: 1, minHeight: 0 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      color: "text.secondary",
                      fontSize: 11,
                      borderColor: "#30363d",
                      bgcolor: "#161b22",
                    },
                  }}
                >
                  <TableCell sx={{ width: 160 }}>Час</TableCell>
                  <TableCell sx={{ width: 90 }}>Рівень</TableCell>
                  <TableCell sx={{ width: 140 }}>Модуль</TableCell>
                  <TableCell>Повідомлення</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      sx={{
                        textAlign: "center",
                        color: "text.secondary",
                        py: 4,
                        border: 0,
                      }}
                    >
                      Записів немає
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((log) => (
                    <TableRow
                      key={log.id}
                      sx={{ "& td": { borderColor: "#30363d" } }}
                    >
                      <TableCell
                        sx={{
                          fontSize: 11,
                          color: "text.secondary",
                          fontFamily: '"JetBrains Mono", monospace',
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <LevelChip level={log.level} />
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: 11,
                          color: "text.secondary",
                          fontFamily: '"JetBrains Mono", monospace',
                        }}
                      >
                        {log.module ?? "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{log.message}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            sx={{
              px: 2,
              py: 0.75,
              borderTop: "1px solid #30363d",
              flexShrink: 0,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Показано: {rows.length}
              {levelFilter !== "ALL" && ` (фільтр: ${levelFilter})`} — оновлення
              кожні 30 с
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
