#!/usr/bin/env bash
# IZI Staff — встановлення / оновлення на Ubuntu-сервері (production)
#
# Перший запуск і всі наступні оновлення — одна й та сама команда:
#   sudo ./deploy/deploy.sh
#
# Скрипт ідемпотентний: клонує репозиторій, якщо його ще немає, або
# підтягує зміни (git pull), якщо вже розгорнутий; накатує залежності,
# міграції, збирає фронтенд і перезапускає сервіси.

set -euo pipefail

APP_DIR="/opt/izi-staff"
APP_USER="izi"
REPO_URL="https://github.com/goodelita1/izi-staff.git"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
log()  { echo -e "${CYAN}▸${RESET} $1"; }
ok()   { echo -e "${GREEN}✓${RESET} $1"; }
warn() { echo -e "${YELLOW}⚠${RESET} $1"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Запустіть через sudo: sudo $0"
  exit 1
fi

# ── 1. Системний користувач ──────────────────────────────────────────────────
if ! id -u "$APP_USER" &>/dev/null; then
  log "Створення системного користувача $APP_USER..."
  useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
  ok "Користувача створено"
fi

# ── 2. Системні пакети ────────────────────────────────────────────────────────
log "Встановлення системних залежностей (apt)..."
apt-get update -qq
apt-get install -y -qq git python3 python3-venv python3-pip nginx curl ca-certificates

if ! command -v node &>/dev/null; then
  log "Встановлення Node.js 20.x (NodeSource)..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
ok "Системні залежності готові: $(python3 --version), node $(node --version)"

# ── 3. Код проєкту ────────────────────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  log "Репозиторій вже є — оновлення (git pull)..."
  sudo -u "$APP_USER" git -C "$APP_DIR" pull --ff-only
else
  log "Клонування репозиторію в $APP_DIR..."
  mkdir -p "$APP_DIR"
  chown "$APP_USER:$APP_USER" "$APP_DIR"
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
fi
ok "Код актуальний"

# ── 4. .env ───────────────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
fi
grep -qE "^FRONTEND_PORT=" "$APP_DIR/.env" || echo "FRONTEND_PORT=80" >> "$APP_DIR/.env"
chmod +x "$APP_DIR/deploy/detect_ip.sh"
sudo -u "$APP_USER" "$APP_DIR/deploy/detect_ip.sh"
ok ".env готовий"

# ── 5. Backend ────────────────────────────────────────────────────────────────
log "Backend: віртуальне середовище та Python-залежності..."
[ -d "$APP_DIR/backend/.venv" ] || sudo -u "$APP_USER" python3 -m venv "$APP_DIR/backend/.venv"
sudo -u "$APP_USER" "$APP_DIR/backend/.venv/bin/pip" install --quiet --upgrade pip
sudo -u "$APP_USER" "$APP_DIR/backend/.venv/bin/pip" install --quiet -r "$APP_DIR/backend/requirements.txt"
sudo -u "$APP_USER" mkdir -p "$APP_DIR/database" "$APP_DIR/backups" "$APP_DIR/databases" "$APP_DIR/qr"

log "Backend: застосування міграцій бази даних..."
(cd "$APP_DIR/backend" && sudo -u "$APP_USER" "$APP_DIR/backend/.venv/bin/alembic" upgrade head)
ok "Backend готовий"

# ── 6. Frontend (production-збірка) ──────────────────────────────────────────
log "Frontend: встановлення залежностей і збірка (npm run build)..."
(cd "$APP_DIR/frontend" && sudo -u "$APP_USER" npm ci --silent && sudo -u "$APP_USER" npm run build --silent)
ok "Frontend зібрано → $APP_DIR/frontend/dist"

# ── 7. systemd ────────────────────────────────────────────────────────────────
log "Налаштування systemd-сервісу izi-backend..."
cp "$APP_DIR/deploy/systemd/izi-backend.service" /etc/systemd/system/izi-backend.service
systemctl daemon-reload
systemctl enable izi-backend >/dev/null
systemctl restart izi-backend
sleep 1
if ! systemctl is-active --quiet izi-backend; then
  warn "Backend не запустився. Лог: journalctl -u izi-backend -n 50 --no-pager"
  exit 1
fi
ok "Сервіс izi-backend запущено"

# ── 8. nginx ──────────────────────────────────────────────────────────────────
log "Налаштування nginx..."
cp "$APP_DIR/deploy/nginx/izi-staff.conf" /etc/nginx/sites-available/izi-staff
ln -sf /etc/nginx/sites-available/izi-staff /etc/nginx/sites-enabled/izi-staff
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
ok "nginx налаштовано"

# ── 9. Фаєрвол (якщо є ufw) ───────────────────────────────────────────────────
if command -v ufw &>/dev/null; then
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow OpenSSH >/dev/null 2>&1 || true
fi

HOST_IP=$(grep -E "^HOST_IP=" "$APP_DIR/.env" | cut -d= -f2 | tr -d '[:space:]')
echo ""
echo -e "${BOLD}${GREEN}✓ Готово${RESET}"
echo -e "  Застосунок:    ${CYAN}http://${HOST_IP}${RESET}"
echo -e "  API:           ${CYAN}http://${HOST_IP}/api${RESET}"
echo -e "  Документація:  ${CYAN}http://${HOST_IP}/docs${RESET}"
echo -e "  Логи backend:  journalctl -u izi-backend -f"
echo ""
