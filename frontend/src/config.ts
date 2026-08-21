// У production (npm run build) фронтенд і backend віддаються одним nginx
// на одному origin — достатньо відносних шляхів "/api", вони працюють
// з будь-якою IP-адресою сервера без перезбирання фронтенду.
//
// У dev-режимі (vite dev, окремий порт 5173) backend слухає окремо на
// порту 8000, тож потрібна повна адреса — вона береться з кореневого
// .env (VITE_HOST_IP), який start.sh оновлює автоматично при кожному запуску.
const HOST_IP = import.meta.env.VITE_HOST_IP ?? "127.0.0.1";
const DEV_BACKEND = `http://${HOST_IP}:8000`;

export const BACKEND_URL = import.meta.env.PROD ? "" : DEV_BACKEND;
export const FRONTEND_URL = import.meta.env.PROD
  ? window.location.origin
  : `http://${HOST_IP}:5173`;
export const API_BASE = import.meta.env.PROD ? "/api" : `${DEV_BACKEND}/api`;
export const QR_BASE = import.meta.env.PROD ? "/api/qr" : `${DEV_BACKEND}/api/qr`;
