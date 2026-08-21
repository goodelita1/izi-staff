import { Box, Checkbox, Chip, Typography } from "@mui/material";
import type { InventoryItem } from "../types/inventory";
import { STATUS_COLORS, STATUS_UA, DAYS_COLORS } from "../utils/theme";

interface Props {
  rows: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRowClick: (item: InventoryItem) => void;
  selectedIds: Set<number>;
  onToggleSelect: (item: InventoryItem) => void;
  activeId?: number | null;
}

function Card({
  item,
  active,
  checked,
  onOpen,
  onToggle,
}: {
  item: InventoryItem;
  active: boolean;
  checked: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const statusColor = STATUS_COLORS[item.status] ?? "#8b949e";

  return (
    <Box
      onClick={onOpen}
      sx={{
        display: "flex",
        gap: 1,
        p: 1.25,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: active ? "#58a6ff" : "#30363d",
        bgcolor: active ? "#132030" : "#161b22",
        cursor: "pointer",
        "&:active": { bgcolor: "#1f2d3d" },
      }}
    >
      <Checkbox
        size="small"
        checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        sx={{ p: 0.5, mt: -0.25, alignSelf: "flex-start" }}
      />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
            }}
          >
            {item.inventory_number}
          </Typography>
          <Chip
            label={STATUS_UA[item.status] ?? item.status}
            size="small"
            sx={{
              height: 19,
              fontSize: 10.5,
              bgcolor: statusColor + "22",
              color: statusColor,
              border: `1px solid ${statusColor}44`,
              flexShrink: 0,
            }}
          />
        </Box>

        <Typography
          variant="body2"
          sx={{ fontWeight: 600, mt: 0.25, lineHeight: 1.3 }}
        >
          {item.item_name}
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.6 }}>
          {item.category && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {item.category}
            </Typography>
          )}
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontFamily: '"JetBrains Mono", monospace' }}
          >
            {item.quantity} {item.unit}
          </Typography>
          {!!item.total_price && (
            <Typography
              variant="caption"
              sx={{ color: "text.primary", fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}
            >
              {item.total_price.toLocaleString("uk-UA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ₴
            </Typography>
          )}
        </Box>

        {item.issued_to && (
          <Typography
            variant="caption"
            sx={{ display: "block", color: "text.secondary", mt: 0.4 }}
          >
            → {item.issued_to}
            {item.days_issued !== null && item.days_issued !== undefined && (
              <Box
                component="span"
                sx={{ color: DAYS_COLORS(item.days_issued), fontWeight: 600, ml: 0.75 }}
              >
                {item.days_issued} дн.
              </Box>
            )}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function InventoryCardList({
  rows,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onRowClick,
  selectedIds,
  onToggleSelect,
  activeId,
}: Props) {
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
          Нічого не знайдено
        </Typography>
      ) : (
        rows.map((item) => (
          <Card
            key={item.id}
            item={item}
            active={item.id === activeId}
            checked={selectedIds.has(item.id)}
            onOpen={() => onRowClick(item)}
            onToggle={() => onToggleSelect(item)}
          />
        ))
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          alignItems: "center",
          mt: 1,
          py: 1.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Всього: {total.toLocaleString("uk-UA")} записів
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            component="span"
            onClick={() => page > 1 && onPageChange(page - 1)}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              border: "1px solid #30363d",
              cursor: page > 1 ? "pointer" : "default",
              fontSize: 13,
              color: page > 1 ? "text.primary" : "text.disabled",
            }}
          >
            ‹ Назад
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, textAlign: "center" }}>
            {page} / {totalPages}
          </Typography>
          <Box
            component="span"
            onClick={() => page < totalPages && onPageChange(page + 1)}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              border: "1px solid #30363d",
              cursor: page < totalPages ? "pointer" : "default",
              fontSize: 13,
              color: page < totalPages ? "text.primary" : "text.disabled",
            }}
          >
            Далі ›
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            Рядків:
          </Typography>
          {[50, 100, 200, 500].map((n) => (
            <Box
              key={n}
              component="span"
              onClick={() => {
                onLimitChange(n);
                onPageChange(1);
              }}
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                cursor: "pointer",
                fontSize: 12,
                bgcolor: limit === n ? "#1f2d3d" : "transparent",
                color: limit === n ? "#58a6ff" : "text.secondary",
              }}
            >
              {n}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
