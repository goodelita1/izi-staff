import axios from "axios";
import { API_BASE } from "../config";

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const raw = localStorage.getItem("izi_selected_db");
  if (raw) {
    try {
      const { id } = JSON.parse(raw) as { id: string };
      config.headers["X-DB-Name"] = id;
    } catch {
      // ignore malformed value
    }
  }
  return config;
});

export default client;
