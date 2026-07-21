// IP береться з кореневого .env (VITE_HOST_IP)
const HOST_IP = import.meta.env.VITE_HOST_IP ?? "192.168.3.144";

export const BACKEND_URL = `http://${HOST_IP}:8000`;
export const FRONTEND_URL = `http://${HOST_IP}:5173`;
export const API_BASE = `${BACKEND_URL}/api`;
export const QR_BASE = `${BACKEND_URL}/api/qr`;
