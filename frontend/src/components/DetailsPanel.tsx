import {
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import QrCodeIcon from "@mui/icons-material/QrCode";
import type { InventoryItem } from "../types/inventory";
import { QR_BASE } from "../config";
import { STATUS_COLORS, DAYS_COLORS } from "../utils/theme";

const PANEL_WIDTH = 360;

interface Props {
  item: InventoryItem | null;
  onClose: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onPrintQR: (item: InventoryItem) => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <Box
      sx={{ display: "flex", justifyContent: "space-between", gap: 1, py: 0.4 }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ minWidth: 120 }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{ textAlign: "right", wordBreak: "break-word" }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function DetailsPanel({
  item,
  onClose,
  onEdit,
  onDelete,
  onPrintQR,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Drawer
      anchor={isMobile ? "bottom" : "right"}
      open={!!item}
      onClose={onClose}
      variant={isMobile ? "temporary" : "persistent"}
      sx={
        isMobile
          ? {}
          : {
              width: item ? PANEL_WIDTH : 0,
              flexShrink: 0,
            }
      }
      slotProps={{
        paper: {
          sx: isMobile
            ? {
                bgcolor: "#161b22",
                borderTop: "1px solid #30363d",
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
                maxHeight: "88vh",
                p: 2,
                pt: 1,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
              }
            : {
                width: PANEL_WIDTH,
                bgcolor: "#161b22",
                borderLeft: "1px solid #30363d",
                top: 48,
                height: "calc(100% - 48px)",
                p: 2,
                boxSizing: "border-box",
              },
        },
      }}
    >
      {item && (
        <>
          {isMobile && (
            <Box
              sx={{
                width: 36,
                height: 4,
                borderRadius: 2,
                bgcolor: "#30363d",
                mx: "auto",
                mb: 1,
              }}
            />
          )}

          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1, flexShrink: 0 }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block" }}
              >
                {item.inventory_number}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, lineHeight: 1.3 }}
              >
                {item.item_name}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ ml: 1, color: "text.secondary" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Chip
            label={item.status}
            size="small"
            sx={{
              bgcolor: STATUS_COLORS[item.status] + "22",
              color: STATUS_COLORS[item.status],
              border: `1px solid ${STATUS_COLORS[item.status]}44`,
              mb: 1.5,
              height: 22,
              fontSize: 11,
              flexShrink: 0,
              alignSelf: "flex-start",
            }}
          />

          <Box
            component="img"
            src={`${QR_BASE}/${item.inventory_number}`}
            alt="QR"
            sx={{
              width: 120,
              height: 120,
              display: "block",
              mx: "auto",
              mb: 1.5,
              borderRadius: 1,
              flexShrink: 0,
            }}
          />

          <Divider sx={{ borderColor: "#30363d", mb: 1, flexShrink: 0 }} />

          <Box sx={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
            <Row label="Номер накладної" value={item.invoice_number} />
            <Row label="Дата накладної" value={item.invoice_date} />
            <Row label="Код номенклатури" value={item.nomenclature_code} />
            <Row label="Серійний номер" value={item.serial_number} />
            <Row label="Одиниця" value={item.unit} />
            <Row label="Категорія" value={item.category} />
            <Row label="Кількість" value={item.quantity} />
            <Row
              label="Вартість"
              value={
                item.price ? `${item.price.toLocaleString("uk-UA")} ₴` : null
              }
            />
            <Row
              label="Сума"
              value={
                item.total_price
                  ? `${item.total_price.toLocaleString("uk-UA")} ₴`
                  : null
              }
            />
            <Divider sx={{ borderColor: "#30363d", my: 0.5 }} />
            <Row label="Кому видано" value={item.issued_to} />
            <Row label="Місце" value={item.location} />
            <Row label="Дата видачі" value={item.issued_date} />
            <Row
              label="Днів"
              value={
                item.days_issued !== null && item.days_issued !== undefined ? (
                  <Typography
                    variant="caption"
                    sx={{
                      color: DAYS_COLORS(item.days_issued),
                      fontWeight: 600,
                    }}
                  >
                    {item.days_issued}
                  </Typography>
                ) : null
              }
            />
            <Divider sx={{ borderColor: "#30363d", my: 0.5 }} />
            <Row label="Тип власності" value={item.ownership} />
            <Row label="Служба" value={item.department} />
            <Row label="Отримувач" value={item.invoice_receiver} />
            <Row label="Примітка" value={item.note} />
          </Box>

          <Divider sx={{ borderColor: "#30363d", mt: 1, mb: 1, flexShrink: 0 }} />

          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Tooltip title="Редагувати">
              <IconButton
                size="small"
                onClick={() => onEdit(item)}
                sx={{ color: "#58a6ff", border: "1px solid #30363d" }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Видалити">
              <IconButton
                size="small"
                onClick={() => onDelete(item)}
                sx={{ color: "#f85149", border: "1px solid #30363d" }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Друк QR">
              <IconButton
                size="small"
                onClick={() => onPrintQR(item)}
                sx={{ color: "#8b949e", border: "1px solid #30363d" }}
              >
                <QrCodeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </>
      )}
    </Drawer>
  );
}
