import client from "./client";
import type { ApiResponse } from "../types/inventory";

export interface DatabaseInfo {
  id: string;
  name: string;
  created_at: string;
  size_bytes: number;
}

export const databasesApi = {
  list: () => client.get<ApiResponse<DatabaseInfo[]>>("/databases"),
  create: (name: string) =>
    client.post<ApiResponse<DatabaseInfo>>("/databases", { name }),
  delete: (id: string) =>
    client.delete<ApiResponse<null>>(`/databases/${encodeURIComponent(id)}`),
};
