import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "../api/inventory";
import type { InventoryFilters } from "../types/inventory";

export function useInventoryList(filters: Partial<InventoryFilters>) {
  return useQuery({
    queryKey: ["inventory", filters],
    queryFn: () => inventoryApi.getList(filters).then((r) => r.data.data),
    staleTime: 0,
  });
}

export function useStatistics() {
  return useQuery({
    queryKey: ["statistics"],
    queryFn: () => inventoryApi.getStatistics().then((r) => r.data.data),
    refetchInterval: 30_000,
  });
}

export function useDeleteInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => inventoryApi.softDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}
