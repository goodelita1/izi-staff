import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "../api/inventory";

interface ImportError {
  row: number;
  field: string;
  message: string;
}

type Step = "select" | "result";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImportDialog({ open, onClose }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("select");
  const [result, setResult] = useState<{
    created: number;
    errors: ImportError[];
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: (file: File) => inventoryApi.importExcel(file),
    onSuccess: (res) => {
      setResult(res.data.data as { created: number; errors: ImportError[] });
      setStep("result");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["statistics"] });
    },
    onError: () => setFileError("Помилка імпорту. Перевірте формат файлу."),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    if (!file.name.endsWith(".xlsx")) {
      setFileError("Підтримуються тільки файли .xlsx");
      return;
    }
    importMutation.mutate(file);
  };

  const handleClose = () => {
    setStep("select");
    setResult(null);
    setFileError(null);
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: { sx: { bgcolor: "#161b22", border: "1px solid #30363d" } },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: "1px solid #30363d",
          py: 1.5,
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        Імпорт Excel
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {step === "select" && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Оберіть файл <strong>.xlsx</strong> для імпорту. Перший рядок має
              містити заголовки.
            </Typography>

            {fileError && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setFileError(null)}
              >
                {fileError}
              </Alert>
            )}

            {importMutation.isPending ? (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}
              >
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">
                  Обробка файлу...
                </Typography>
              </Box>
            ) : (
              <Box
                onClick={() => fileRef.current?.click()}
                sx={{
                  border: "2px dashed #30363d",
                  borderRadius: 1,
                  p: 4,
                  textAlign: "center",
                  cursor: "pointer",
                  "&:hover": { borderColor: "#58a6ff", bgcolor: "#1f2d3d" },
                  transition: "all 0.2s",
                }}
              >
                <FileUploadIcon
                  sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Натисніть або перетягніть файл .xlsx
                </Typography>
              </Box>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </Box>
        )}

        {step === "result" && result && (
          <Box>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Chip
                label={`Імпортовано: ${result.created}`}
                size="small"
                sx={{
                  bgcolor: "#3fb95022",
                  color: "#3fb950",
                  border: "1px solid #3fb95044",
                }}
              />
              {result.errors.length > 0 && (
                <Chip
                  label={`Помилок: ${result.errors.length}`}
                  size="small"
                  sx={{
                    bgcolor: "#f8514922",
                    color: "#f85149",
                    border: "1px solid #f8514944",
                  }}
                />
              )}
            </Box>

            {result.errors.length > 0 && (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  Рядки з помилками не були імпортовані:
                </Typography>
                <TableContainer sx={{ maxHeight: 240 }}>
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
                        <TableCell>Рядок</TableCell>
                        <TableCell>Поле</TableCell>
                        <TableCell>Помилка</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.errors.map((err, i) => (
                        <TableRow
                          key={i}
                          sx={{
                            "& td": { borderColor: "#30363d", fontSize: 11 },
                          }}
                        >
                          <TableCell>{err.row}</TableCell>
                          <TableCell
                            sx={{ fontFamily: '"JetBrains Mono", monospace' }}
                          >
                            {err.field}
                          </TableCell>
                          <TableCell sx={{ color: "#f85149" }}>
                            {err.message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {result.errors.length === 0 && (
              <Alert severity="success">
                Всі {result.created} записів успішно імпортовано
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid #30363d", px: 2, py: 1.5 }}>
        {step === "result" && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setStep("select");
              setResult(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            sx={{ borderColor: "#30363d", color: "text.secondary", mr: "auto" }}
          >
            Імпортувати ще
          </Button>
        )}
        <Button
          onClick={handleClose}
          size="small"
          sx={{ color: "text.secondary" }}
        >
          {step === "result" ? "Закрити" : "Скасувати"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
