import { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  GridReadyEvent,
  RowClickedEvent,
  RowDoubleClickedEvent,
  SelectionChangedEvent,
} from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Box, Chip, Typography } from "@mui/material";
import type { InventoryItem } from "../types/inventory";
import { STATUS_COLORS, DAYS_COLORS } from "../utils/theme";

ModuleRegistry.registerModules([AllCommunityModule]);

const STATUS_UA: Record<string, string> = {
  Warehouse: "Склад",
  Issued: "Видано",
  Returned: "Повернуто",
  "Written Off": "Списано",
};

function StatusCell({ value }: { value: string }) {
  const color = STATUS_COLORS[value] ?? "#8b949e";
  return (
    <Chip
      label={STATUS_UA[value] ?? value}
      size="small"
      sx={{
        height: 20,
        fontSize: 11,
        bgcolor: color + "22",
        color,
        border: `1px solid ${color}44`,
      }}
    />
  );
}

function DaysCell({ value }: { value: number | null }) {
  if (value === null || value === undefined) return null;
  return (
    <Typography
      variant="caption"
      sx={{
        color: DAYS_COLORS(value),
        fontWeight: 600,
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {value}
    </Typography>
  );
}

function MoneyCell({ value }: { value: number | null }) {
  if (value === null || value === undefined) return null;
  return (
    <Typography
      variant="caption"
      sx={{ fontFamily: '"JetBrains Mono", monospace' }}
    >
      {value.toLocaleString("uk-UA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </Typography>
  );
}

const COL_DEFAULTS: ColDef = {
  resizable: true,
  sortable: true,
  filter: false,
  minWidth: 80,
  suppressMovable: false,
};

function buildColumns(): ColDef<InventoryItem>[] {
  return [
    {
      field: "inventory_number",
      headerName: "Інвент. №",
      width: 150,
      pinned: "left",
    },
    { field: "invoice_number", headerName: "Накладна", width: 140 },
    { field: "invoice_date", headerName: "Дата накл.", width: 110 },
    { field: "item_name", headerName: "Назва майна", width: 220, flex: 1 },
    { field: "nomenclature_code", headerName: "Код номенкл.", width: 130 },
    { field: "serial_number", headerName: "Серійний №", width: 140 },
    { field: "unit", headerName: "Од.", width: 60 },
    { field: "category", headerName: "Категорія", width: 120 },
    { field: "quantity", headerName: "Кіл.", width: 65, type: "numericColumn" },
    {
      field: "price",
      headerName: "Вартість",
      width: 110,
      type: "numericColumn",
      cellRenderer: MoneyCell,
    },
    {
      field: "total_price",
      headerName: "Сума",
      width: 110,
      type: "numericColumn",
      cellRenderer: MoneyCell,
    },
    { field: "issued_to", headerName: "Кому видано", width: 150 },
    { field: "location", headerName: "Місце", width: 120 },
    { field: "issued_date", headerName: "Дата видачі", width: 110 },
    {
      field: "days_issued",
      headerName: "Днів",
      width: 70,
      type: "numericColumn",
      cellRenderer: DaysCell,
    },
    { field: "department", headerName: "Служба", width: 120 },
    { field: "invoice_receiver", headerName: "Отримувач", width: 140 },
    { field: "ownership", headerName: "Власність", width: 100 },
    {
      field: "status",
      headerName: "Статус",
      width: 110,
      cellRenderer: StatusCell,
    },
    { field: "note", headerName: "Примітка", width: 160 },
  ];
}

interface Props {
  rows: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRowClick: (item: InventoryItem) => void;
  onRowDoubleClick: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onSelectionChange?: (items: InventoryItem[]) => void;
  selectedId?: number | null;
}

export default function InventoryTable({
  rows,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onRowClick,
  onRowDoubleClick,
  onSelectionChange,
  selectedId,
}: Props) {
  const gridRef = useRef<AgGridReact>(null);
  const columns = useMemo(() => buildColumns(), []);

  const defaultColDef = useMemo<ColDef>(() => COL_DEFAULTS, []);

  const onGridReady = useCallback((_e: GridReadyEvent) => {}, []);

  const onRowClicked = useCallback(
    (e: RowClickedEvent<InventoryItem>) => {
      if (e.data) onRowClick(e.data);
    },
    [onRowClick],
  );

  const onRowDoubleClicked = useCallback(
    (e: RowDoubleClickedEvent<InventoryItem>) => {
      if (e.data) onRowDoubleClick(e.data);
    },
    [onRowDoubleClick],
  );

  const onSelectionChanged = useCallback(
    (e: SelectionChangedEvent<InventoryItem>) => {
      const selected = e.api.getSelectedRows();
      onSelectionChange?.(selected);
    },
    [onSelectionChange],
  );

  const getRowStyle = useCallback(
    (params: { data?: InventoryItem }) => {
      if (params.data?.id === selectedId) {
        return { background: "#1f2d3d" };
      }
      return undefined;
    },
    [selectedId],
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <Box
      sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <Box
        className="ag-theme-quartz-dark"
        sx={
          {
            flex: 1,
            minHeight: 0,
            "--ag-background-color": "#0d1117",
            "--ag-odd-row-background-color": "#0d1117",
            "--ag-header-background-color": "#161b22",
            "--ag-border-color": "#30363d",
            "--ag-row-hover-color": "#161b22",
            "--ag-selected-row-background-color": "#1f2d3d",
            "--ag-foreground-color": "#f0883e",
            "--ag-header-foreground-color": "#f0883e",
            "--ag-font-family": '"Inter", monospace',
            "--ag-font-size": "12px",
          } as React.CSSProperties
        }
      >
        <AgGridReact<InventoryItem>
          ref={gridRef}
          rowData={rows}
          columnDefs={columns}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onRowClicked={onRowClicked}
          onRowDoubleClicked={onRowDoubleClicked}
          onSelectionChanged={onSelectionChanged}
          getRowStyle={getRowStyle}
          rowSelection="multiple"
          suppressRowClickSelection
          animateRows={false}
          domLayout="normal"
          suppressPaginationPanel
          suppressScrollOnNewData
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          py: 0.5,
          borderTop: "1px solid #30363d",
          bgcolor: "#161b22",
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Всього: {total.toLocaleString("uk-UA")} записів
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                fontSize: 11,
                bgcolor: limit === n ? "#1f2d3d" : "transparent",
                color: limit === n ? "#58a6ff" : "text.secondary",
                "&:hover": { bgcolor: "#1f2d3d" },
              }}
            >
              {n}
            </Box>
          ))}

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
            <Box
              component="span"
              onClick={() => page > 1 && onPageChange(page - 1)}
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                cursor: page > 1 ? "pointer" : "default",
                fontSize: 12,
                color: page > 1 ? "text.primary" : "text.disabled",
                "&:hover": page > 1 ? { bgcolor: "#1f2d3d" } : {},
              }}
            >
              ‹
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ minWidth: 70, textAlign: "center" }}
            >
              {page} / {totalPages || 1}
            </Typography>
            <Box
              component="span"
              onClick={() => page < totalPages && onPageChange(page + 1)}
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                cursor: page < totalPages ? "pointer" : "default",
                fontSize: 12,
                color: page < totalPages ? "text.primary" : "text.disabled",
                "&:hover": page < totalPages ? { bgcolor: "#1f2d3d" } : {},
              }}
            >
              ›
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
