import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box } from "@mui/material";
import StatisticsCards from "../components/StatisticsCards";
import InventoryToolbar from "../components/InventoryToolbar";
import InventoryTable from "../components/InventoryTable";
import DetailsPanel from "../components/DetailsPanel";
import InventoryFormDialog from "../components/InventoryFormDialog";
import QRDialog from "../components/QRDialog";
import ImportDialog from "../components/ImportDialog";
import {
  useInventoryList,
  useStatistics,
  useDeleteInventory,
} from "../hooks/useInventory";
import { useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "../api/inventory";
import type { InventoryItem } from "../types/inventory";

export default function InventoryPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<InventoryItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qc = useQueryClient();

  const { data } = useInventoryList({ page, limit, search });
  const { data: stats, isLoading: statsLoading } = useStatistics();
  const deleteMutation = useDeleteInventory();

  const handleSearchChange = useCallback((v: string) => {
    setSearchInput(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(v);
      setPage(1);
    }, 300);
  }, []);

  const handleExport = useCallback(async () => {
    const resp = await inventoryApi.exportExcel({ search });
    const url = URL.createObjectURL(new Blob([resp.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }, [search]);

  const handleDelete = useCallback(
    (item: InventoryItem) => {
      if (confirm(`Перемістити "${item.item_name}" до кошика?`)) {
        deleteMutation.mutate(item.id);
        if (selectedItem?.id === item.id) setSelectedItem(null);
      }
    },
    [deleteMutation, selectedItem],
  );

  const handleAdd = useCallback(() => {
    setEditItem(null);
    setDialogOpen(true);
  }, []);
  const handleEdit = useCallback((item: InventoryItem) => {
    setEditItem(item);
    setDialogOpen(true);
  }, []);
  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditItem(null);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        handleAdd();
      }
      if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        handleExport();
      }
      if (e.key === "F5") {
        e.preventDefault();
        qc.invalidateQueries({ queryKey: ["inventory"] });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleAdd, handleExport, qc]);

  return (
    <Box
      sx={{ display: "flex", height: "calc(100vh - 52px)", overflow: "hidden" }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <StatisticsCards stats={stats} loading={statsLoading} />

        <InventoryToolbar
          search={searchInput}
          onSearchChange={handleSearchChange}
          onAdd={handleAdd}
          onImport={() => setImportOpen(true)}
          onExport={handleExport}
          onQR={() => setQrOpen(true)}
          onRefresh={() => qc.invalidateQueries({ queryKey: ["inventory"] })}
        />

        <InventoryTable
          rows={data?.items ?? []}
          total={data?.total ?? 0}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onRowClick={setSelectedItem}
          onRowDoubleClick={handleEdit}
          onDelete={handleDelete}
          onSelectionChange={setSelectedRows}
          selectedId={selectedItem?.id}
        />
      </Box>

      <DetailsPanel
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrintQR={(item) => {
          setSelectedRows([item]);
          setQrOpen(true);
        }}
      />

      <InventoryFormDialog
        open={dialogOpen}
        item={editItem}
        onClose={handleDialogClose}
      />

      <QRDialog
        open={qrOpen}
        items={selectedRows}
        onClose={() => setQrOpen(false)}
      />

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </Box>
  );
}
