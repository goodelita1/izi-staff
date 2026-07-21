import client from "./client";
import type { ApiResponse } from "../types/inventory";

export interface AppSettings {
  id: number;
  database_path: string | null;
  backup_path: string | null;
  rows_per_page: number;
  theme: string;
  created_at: string;
  updated_at: string;
}

export const settingsApi = {
  get: () => client.get<ApiResponse<AppSettings>>("/settings"),
  update: (data: Partial<AppSettings>) =>
    client.put<ApiResponse<AppSettings>>("/settings", data),
};
