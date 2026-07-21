import client from "./client";
import type { ApiResponse } from "../types/inventory";

export interface BackupInfo {
  filename: string;
  size_bytes: number;
  created_at: string;
}

export const backupsApi = {
  list: () => client.get<ApiResponse<BackupInfo[]>>("/backups"),
  create: () => client.post<ApiResponse<BackupInfo>>("/backups/create"),
  restore: (filename: string) =>
    client.post<ApiResponse<null>>("/backups/restore", { filename }),
  delete: (filename: string) =>
    client.delete<ApiResponse<null>>(
      `/backups/${encodeURIComponent(filename)}`,
    ),
};
