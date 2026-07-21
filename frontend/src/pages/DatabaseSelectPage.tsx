import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { databasesApi } from "../api/databases";
import type { DatabaseInfo } from "../api/databases";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface Props {
  onSelect: (db: DatabaseInfo) => void;
}

export default function DatabaseSelectPage({ onSelect }: Props) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["databases"],
    queryFn: () => databasesApi.list().then((r) => r.data.data as DatabaseInfo[]),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => databasesApi.create(name),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["databases"] });
      const db = res.data.data as DatabaseInfo;
      setCreating(false);
      setNewName("");
      onSelect(db);
    },
    onError: () => setError("Помилка створення бази даних"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => databasesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["databases"] }),
  });

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) { setError("Введіть назву бази даних"); return; }
    setError(null);
    createMutation.mutate(name);
  };

  const handleDelete = (db: DatabaseInfo) => {
    if (confirm(`Видалити базу "${db.name}"? Всі дані будуть втрачені.`)) {
      deleteMutation.mutate(db.id);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0d1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 520 }}>
        {/* Заголовок */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
          <StorageIcon sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              IZI Staff
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Система управління інвентарем
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Існуючі бази */}
        <Paper sx={{ bgcolor: "#161b22", mb: 2 }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #30363d" }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
              ОБЕРІТЬ БАЗУ ДАНИХ
            </Typography>
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : !data?.length ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography color="text.secondary" variant="body2">
                Баз даних ще немає. Створіть першу.
              </Typography>
            </Box>
          ) : (
            data.map((db, i) => (
              <Box key={db.id}>
                {i > 0 && <Divider sx={{ borderColor: "#30363d" }} />}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1.5,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#1f2d3d" },
                    transition: "background 0.15s",
                  }}
                  onClick={() => onSelect(db)}
                >
                  <StorageIcon sx={{ fontSize: 18, color: "primary.main", mr: 1.5, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {db.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(db.created_at)} · {formatBytes(db.size_bytes)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {db.id !== "default" && (
                      <Tooltip title="Видалити">
                        <IconButton
                          size="small"
                          sx={{ color: "#f85149" }}
                          onClick={(e) => { e.stopPropagation(); handleDelete(db); }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <ArrowForwardIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Paper>

        {/* Створити нову */}
        <Paper sx={{ bgcolor: "#161b22" }}>
          {!creating ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1.5,
                cursor: "pointer",
                "&:hover": { bgcolor: "#1f2d3d" },
                transition: "background 0.15s",
              }}
              onClick={() => setCreating(true)}
            >
              <AddIcon sx={{ fontSize: 18, color: "#3fb950" }} />
              <Typography variant="body2" sx={{ color: "#3fb950", fontWeight: 500 }}>
                Створити нову базу даних
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Назва бази даних (наприклад: ІТ відділ, Логістика)
              </Typography>
              <TextField
                autoFocus
                size="small"
                fullWidth
                placeholder="Введіть назву..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setCreating(false); setNewName(""); }
                }}
                sx={{ mb: 1.5, "& fieldset": { borderColor: "#30363d" } }}
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  startIcon={createMutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
                  sx={{ bgcolor: "#238636", "&:hover": { bgcolor: "#2ea043" } }}
                >
                  Створити
                </Button>
                <Button
                  size="small"
                  sx={{ color: "text.secondary" }}
                  onClick={() => { setCreating(false); setNewName(""); setError(null); }}
                >
                  Скасувати
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
