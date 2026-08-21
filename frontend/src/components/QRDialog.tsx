import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import type { InventoryItem } from "../types/inventory";
import { QR_BASE } from "../config";

interface Props {
  open: boolean;
  items: InventoryItem[];
  onClose: () => void;
}

function QRPreviewCard({ item }: { item: InventoryItem }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 1.5,
        border: "1px solid #30363d",
        borderRadius: 1,
        bgcolor: "#0d1117",
      }}
    >
      <Box
        component="img"
        src={`${QR_BASE}/${item.inventory_number}`}
        alt={item.inventory_number}
        sx={{ width: 140, height: 140, display: "block" }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          color: "text.secondary",
          fontSize: 10,
          textAlign: "center",
        }}
      >
        {item.item_name}
      </Typography>
    </Box>
  );
}

export default function QRDialog({ open, items, onClose }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handlePrint = () => {
    if (!items.length) return;
    const numbers = items.map((i) => i.inventory_number).join(",");
    const printUrl = `${QR_BASE}/print?numbers=${encodeURIComponent(numbers)}`;

    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>Друк QR</title>
      <style>body{margin:0;background:#fff} img{max-width:100%}</style></head>
      <body>
        <img src="${printUrl}" onload="window.print();window.close()" />
      </body></html>
    `);
    win.document.close();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
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
        QR-коди ({items.length})
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {items.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ py: 4, textAlign: "center" }}
          >
            Оберіть записи в таблиці для перегляду QR-кодів
          </Typography>
        ) : (
          <Grid container spacing={1.5}>
            {items.map((item) => (
              <Grid key={item.id} size={{ xs: 6, sm: 4, md: 3 }}>
                <QRPreviewCard item={item} />
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid #30363d", px: 2, py: 1.5 }}>
        <Button onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
          Закрити
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={items.length === 0}
          sx={{ bgcolor: "#238636", "&:hover": { bgcolor: "#2ea043" } }}
        >
          Друкувати ({items.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
