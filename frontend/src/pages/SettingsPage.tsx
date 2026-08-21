import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../api/settings";

export default function SettingsPage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    database_path: "",
    backup_path: "",
    rows_per_page: "100",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get().then((r) => r.data.data),
  });

  useEffect(() => {
    if (data) {
      setForm({
        database_path: data.database_path ?? "",
        backup_path: data.backup_path ?? "",
        rows_per_page: String(data.rows_per_page ?? 100),
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      settingsApi.update({
        database_path: form.database_path || null,
        backup_path: form.backup_path || null,
        rows_per_page: Number(form.rows_per_page) || 100,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: () => setError("Помилка збереження налаштувань"),
  });

  const field = (key: keyof typeof form, label: string, helper?: string) => (
    <TextField
      size="small"
      fullWidth
      label={label}
      value={form[key]}
      helperText={helper}
      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
      sx={{ "& .MuiOutlinedInput-root fieldset": { borderColor: "#30363d" } }}
    />
  );

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Налаштування
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Збережено
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, bgcolor: "#161b22" }}>
        <Typography
          variant="caption"
          sx={{
            color: "primary.main",
            fontWeight: 600,
            display: "block",
            mb: 1.5,
          }}
        >
          ШЛЯХИ
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {field(
            "database_path",
            "Шлях до бази даних",
            "Залиште порожнім для використання шляху за замовчуванням",
          )}
          {field(
            "backup_path",
            "Шлях до резервних копій",
            "Залиште порожнім для використання шляху за замовчуванням",
          )}
        </Box>

        <Divider sx={{ borderColor: "#30363d", my: 2 }} />

        <Typography
          variant="caption"
          sx={{
            color: "primary.main",
            fontWeight: 600,
            display: "block",
            mb: 1.5,
          }}
        >
          ТАБЛИЦЯ
        </Typography>

        <TextField
          size="small"
          label="Рядків на сторінці"
          type="number"
          value={form.rows_per_page}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, rows_per_page: e.target.value }))
          }
          slotProps={{ htmlInput: { min: 10, max: 1000 } }}
          sx={{
            width: 200,
            "& .MuiOutlinedInput-root fieldset": { borderColor: "#30363d" },
          }}
        />
      </Paper>

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <Button
          variant="contained"
          size="small"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          sx={{ bgcolor: "#238636", "&:hover": { bgcolor: "#2ea043" } }}
        >
          {updateMutation.isPending ? "Збереження..." : "Зберегти"}
        </Button>
        <Button
          size="small"
          sx={{ color: "text.secondary" }}
          onClick={() =>
            data &&
            setForm({
              database_path: data.database_path ?? "",
              backup_path: data.backup_path ?? "",
              rows_per_page: String(data.rows_per_page),
            })
          }
        >
          Скасувати
        </Button>
      </Box>
    </Box>
  );
}
