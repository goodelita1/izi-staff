import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "../api/inventory";
import type { InventoryItem } from "../types/inventory";

export function useCreateInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      force,
    }: {
      data: Partial<InventoryItem>;
      force?: boolean;
    }) => inventoryApi.create(data, force),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useUpdateInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      force,
    }: {
      id: number;
      data: Partial<InventoryItem>;
      force?: boolean;
    }) => inventoryApi.update(id, data, force),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}
