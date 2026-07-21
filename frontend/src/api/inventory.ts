import client from "./client";
import type {
  ApiResponse,
  InventoryFilters,
  InventoryItem,
  InventoryListResponse,
  Statistics,
} from "../types/inventory";

export const inventoryApi = {
  getList: (filters: Partial<InventoryFilters>) =>
    client.get<ApiResponse<InventoryListResponse>>("/inventory", {
      params: filters,
    }),

  getById: (id: number) =>
    client.get<ApiResponse<InventoryItem>>(`/inventory/${id}`),

  create: (data: Partial<InventoryItem>, force = false) =>
    client.post<ApiResponse<InventoryItem>>(
      `/inventory${force ? "?force=true" : ""}`,
      data,
    ),

  update: (id: number, data: Partial<InventoryItem>, force = false) =>
    client.put<ApiResponse<InventoryItem>>(
      `/inventory/${id}${force ? "?force=true" : ""}`,
      data,
    ),

  softDelete: (id: number) =>
    client.delete<ApiResponse<null>>(`/inventory/${id}`),

  restore: (id: number) =>
    client.post<ApiResponse<InventoryItem>>(`/inventory/${id}/restore`),

  permanentDelete: (id: number) =>
    client.delete<ApiResponse<null>>(`/inventory/${id}/permanent`),

  getStatistics: () => client.get<ApiResponse<Statistics>>("/statistics"),

  getTrash: () => client.get<ApiResponse<InventoryItem[]>>("/trash"),

  emptyTrash: () => client.delete<ApiResponse<null>>("/trash/empty"),

  exportExcel: (filters: Partial<InventoryFilters>) =>
    client.get("/export", { params: filters, responseType: "blob" }),

  importExcel: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return client.post<ApiResponse<{ created: number; errors: unknown[] }>>(
      "/import",
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  },
};
