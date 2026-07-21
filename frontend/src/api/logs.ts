import client from "./client";
import type { ApiResponse } from "../types/inventory";

export interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  module: string | null;
  message: string;
}

export const logsApi = {
  list: (limit = 500) =>
    client.get<ApiResponse<LogEntry[]>>("/logs", { params: { limit } }),
};
