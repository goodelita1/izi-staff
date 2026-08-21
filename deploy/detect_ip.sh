#!/usr/bin/env bash
# Автоматично визначає поточну IP-адресу сервера в локальній мережі та
# записує її в кореневий .env (HOST_IP). Викликається перед стартом backend
# (systemd ExecStartPre), щоб QR-коди та CORS завжди вказували на актуальну
# адресу, навіть якщо DHCP видав інший IP після перезавантаження сервера.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

detect_ip() {
  local ip=""

  # IP інтерфейсу, через який іде маршрут за замовчуванням.
  # "ip route get" не надсилає жодних пакетів — просто дивиться в таблицю
  # маршрутизації ядра, тож працює навіть без інтернету, лише з локальною мережею.
  ip=$(ip route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") print $(i+1)}') || true

  # Фолбек: перша IP-адреса з hostname -I
  if [ -z "$ip" ]; then
    ip=$(hostname -I 2>/dev/null | awk '{print $1}') || true
  fi

  echo "$ip"
}

update_env_var() {
  local key="$1" value="$2" file="$3"
  if [ -f "$file" ] && grep -qE "^${key}=" "$file"; then
    sed -i -E "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

IP="$(detect_ip)"
if [ -z "$IP" ]; then
  echo "detect_ip.sh: не вдалося визначити IP — .env лишається без змін" >&2
  exit 0
fi

[ -f "$ENV_FILE" ] || touch "$ENV_FILE"
update_env_var "HOST_IP" "$IP" "$ENV_FILE"
grep -qE "^FRONTEND_PORT=" "$ENV_FILE" || echo "FRONTEND_PORT=80" >> "$ENV_FILE"

echo "detect_ip.sh: HOST_IP=$IP"
