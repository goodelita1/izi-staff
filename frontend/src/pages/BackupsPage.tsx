import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteIcon from "@mui/icons-material/Delete";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backupsApi } from "../api/backups";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

export default function BackupsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["backups"],
    queryFn: () =>
      backupsApi
        .list()
        .then(
          (r) =>
            r.data.data as {
              filename: string;
              size_bytes: number;
              created_at: string;
            }[],
        ),
  });

  const createMutation = useMutation({
    mutationFn: () => backupsApi.create(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backups"] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (filename: string) => backupsApi.restore(filename),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backups"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (filename: string) => backupsApi.delete(filename),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backups"] }),
  });

  const handleRestore = (filename: string) => {
    if (
      confirm(
        `Відновити базу даних з резервної копії "${filename}"? Поточні дані будуть замінені.`,
      )
    ) {
      restoreMutation.mutate(filename);
    }
  };

  const handleDelete = (filename: string) => {
    if (confirm(`Видалити резервну копію "${filename}"?`)) {
      deleteMutation.mutate(filename);
    }
  };

  const isPending =
    createMutation.isPending ||
    restoreMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Резервні копії
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={
            createMutation.isPending ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <AddIcon />
            )
          }
          onClick={() => createMutation.mutate()}
          disabled={isPending}
          sx={{ bgcolor: "#238636", "&:hover": { bgcolor: "#2ea043" } }}
        >
          Створити копію
        </Button>
      </Box>

      {createMutation.isSuccess && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => createMutation.reset()}
        >
          Резервну копію успішно створено
        </Alert>
      )}
      {restoreMutation.isSuccess && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => restoreMutation.reset()}
        >
          Базу даних успішно відновлено
        </Alert>
      )}
      {(createMutation.isError ||
        restoreMutation.isError ||
        deleteMutation.isError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Операція завершилась з помилкою
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : !data?.length ? (
        <Paper sx={{ bgcolor: "#161b22" }}>
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" variant="body2">
              Резервних копій ще немає
            </Typography>
          </Box>
        </Paper>
      ) : isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {data.map((b) => (
            <Box
              key={b.filename}
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                border: "1px solid #30363d",
                bgcolor: "#161b22",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontFamily: '"JetBrains Mono", monospace', wordBreak: "break-all" }}
              >
                {b.filename}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(b.created_at)} · {formatBytes(b.size_bytes)}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  startIcon={<RestoreIcon fontSize="small" />}
                  onClick={() => handleRestore(b.filename)}
                  disabled={isPending}
                  sx={{ color: "#58a6ff" }}
                >
                  Відновити
                </Button>
                <Button
                  size="small"
                  startIcon={<DeleteIcon fontSize="small" />}
                  onClick={() => handleDelete(b.filename)}
                  disabled={isPending}
                  sx={{ color: "#f85149" }}
                >
                  Видалити
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Paper sx={{ bgcolor: "#161b22" }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      color: "text.secondary",
                      fontSize: 11,
                      borderColor: "#30363d",
                    },
                  }}
                >
                  <TableCell>Файл</TableCell>
                  <TableCell align="right">Розмір</TableCell>
                  <TableCell>Дата створення</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((b) => (
                  <TableRow
                    key={b.filename}
                    sx={{ "& td": { borderColor: "#30363d" } }}
                  >
                    <TableCell
                      sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 12,
                      }}
                    >
                      {b.filename}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontSize: 12, color: "text.secondary" }}
                    >
                      {formatBytes(b.size_bytes)}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                      {formatDate(b.created_at)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Відновити">
                        <IconButton
                          size="small"
                          onClick={() => handleRestore(b.filename)}
                          disabled={isPending}
                          sx={{ color: "#58a6ff" }}
                        >
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Видалити">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(b.filename)}
                          disabled={isPending}
                          sx={{ color: "#f85149" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
