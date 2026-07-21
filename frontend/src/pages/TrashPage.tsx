import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
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
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "../api/inventory";
import { STATUS_COLORS } from "../utils/theme";

const STATUS_UA: Record<string, string> = {
  Warehouse: "Склад",
  Issued: "Видано",
  Returned: "Повернуто",
  "Written Off": "Списано",
};

export default function TrashPage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["trash"],
    queryFn: () => inventoryApi.getTrash().then((r) => r.data.data),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => inventoryApi.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trash"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["statistics"] });
    },
    onError: () => setError("Помилка відновлення"),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (id: number) => inventoryApi.permanentDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trash"] }),
    onError: () => setError("Помилка видалення"),
  });

  const emptyTrashMutation = useMutation({
    mutationFn: () => inventoryApi.emptyTrash(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trash"] }),
    onError: () => setError("Помилка очищення кошика"),
  });

  const handleEmptyTrash = () => {
    if (confirm(`Видалити назавжди всі ${data?.length ?? 0} записів?`)) {
      emptyTrashMutation.mutate();
    }
  };

  const handlePermanentDelete = (id: number, name: string) => {
    if (confirm(`Видалити "${name}" назавжди? Відновлення неможливе.`)) {
      permanentDeleteMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Кошик
        </Typography>
        {data && data.length > 0 && (
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<DeleteForeverIcon />}
            onClick={handleEmptyTrash}
            disabled={emptyTrashMutation.isPending}
          >
            Очистити кошик ({data.length})
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : !data?.length ? (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
          Кошик порожній
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: "#161b22" }}>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    color: "text.secondary",
                    fontSize: 12,
                    fontWeight: 600,
                    borderColor: "#30363d",
                  },
                }}
              >
                <TableCell>Інвент. №</TableCell>
                <TableCell>Назва майна</TableCell>
                <TableCell>Категорія</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Накладна</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item) => (
                <TableRow
                  key={item.id}
                  sx={{
                    "& td": { borderColor: "#30363d", fontSize: 12 },
                    "&:hover": { bgcolor: "#1f2d3d" },
                  }}
                >
                  <TableCell
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                    }}
                  >
                    {item.inventory_number}
                  </TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_UA[item.status] ?? item.status}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: 10,
                        bgcolor:
                          (STATUS_COLORS[item.status] ?? "#8b949e") + "22",
                        color: STATUS_COLORS[item.status] ?? "#8b949e",
                      }}
                    />
                  </TableCell>
                  <TableCell>{item.invoice_number}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Відновити">
                      <IconButton
                        size="small"
                        onClick={() => restoreMutation.mutate(item.id)}
                        disabled={restoreMutation.isPending}
                        sx={{ color: "#3fb950" }}
                      >
                        <RestoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Видалити назавжди">
                      <IconButton
                        size="small"
                        onClick={() =>
                          handlePermanentDelete(item.id, item.item_name)
                        }
                        disabled={permanentDeleteMutation.isPending}
                        sx={{ color: "#f85149" }}
                      >
                        <DeleteForeverIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
