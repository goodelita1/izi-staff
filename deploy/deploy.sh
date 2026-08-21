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
apt-get install -y -qq git nginx curl ca-certificates software-properties-common

# Підібрати версію Python, сумісну з pydantic-core (він містить Rust-код,
# що збирається через maturin/pyo3; на дуже свіжих системних Python —
# наприклад Python 3.14 за замовчуванням в Ubuntu 26.04 — поточна версія
# pyo3 ще не вміє збирати pydantic-core з вихідників, і встановлення падає
# з помилкою "the configured Python interpreter version is newer than
# PyO3's maximum supported version". Тому явно шукаємо 3.13/3.12/3.11 —
# ті самі версії, під які орієнтований застосунок (див. start.sh).
PYTHON3_BIN=""
for bin in python3.13 python3.12 python3.11; do
  command -v "$bin" &>/dev/null && { PYTHON3_BIN="$bin"; break; }
done

if [ -z "$PYTHON3_BIN" ]; then
  log "Сумісної версії Python (3.11–3.13) не знайдено — додаю офіційний backports PPA Canonical..."
  add-apt-repository -y ppa:canonical-python-maintainers/python-backports >/dev/null
  apt-get update -qq
  apt-get install -y -qq python3.12 python3.12-venv
  PYTHON3_BIN="python3.12"
else
  apt-get install -y -qq "${PYTHON3_BIN}-venv" 2>/dev/null || true
fi
ok "Обрано інтерпретатор для backend: $PYTHON3_BIN ($($PYTHON3_BIN --version))"

if ! command -v node &>/dev/null; then
  log "Встановлення Node.js 20.x (NodeSource)..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
ok "Системні залежності готові: node $(node --version)"

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

VENV_DIR="$APP_DIR/backend/.venv"

# Якщо venv вже існує, але створений під іншу версію Python (наприклад,
# з попередньої невдалої спроби на системному python3.14) — перестворити.
NEED_RECREATE=0
if [ -x "$VENV_DIR/bin/python3" ]; then
  CURRENT_VENV_PY=$("$VENV_DIR/bin/python3" -c 'import sys; print("%d.%d" % sys.version_info[:2])' 2>/dev/null || echo "")
  WANTED_PY=$($PYTHON3_BIN -c 'import sys; print("%d.%d" % sys.version_info[:2])')
  [ "$CURRENT_VENV_PY" != "$WANTED_PY" ] && NEED_RECREATE=1
else
  [ -d "$VENV_DIR" ] && NEED_RECREATE=1
fi

if [ "$NEED_RECREATE" = "1" ] && [ -d "$VENV_DIR" ]; then
  warn "Перестворюю venv під $PYTHON3_BIN (був створений під іншу версію Python)..."
  rm -rf "$VENV_DIR"
fi
[ -d "$VENV_DIR" ] || sudo -u "$APP_USER" "$PYTHON3_BIN" -m venv "$VENV_DIR"

sudo -u "$APP_USER" "$VENV_DIR/bin/pip" install --quiet --upgrade pip
sudo -u "$APP_USER" "$VENV_DIR/bin/pip" install --quiet -r "$APP_DIR/backend/requirements.txt"
sudo -u "$APP_USER" mkdir -p "$APP_DIR/database" "$APP_DIR/backups" "$APP_DIR/databases" "$APP_DIR/qr"

log "Backend: застосування міграцій бази даних..."
(cd "$APP_DIR/backend" && sudo -u "$APP_USER" "$VENV_DIR/bin/alembic" upgrade head)
ok "Backend готовий"

# ── 6. Frontend (production-збірка) ──────────────────────────────────────────
log "Frontend: встановлення залежностей і збірка (npm run build)..."
# Без --silent і з логуванням у файл: --silent приховує навіть повідомлення
# про помилку, тож при падінні (напр. нестача RAM під час vite build) в
# консолі не було видно жодної причини. Тепер повний вивід завжди в
# /tmp/izi_deploy_frontend.log, і при падінні друкуються останні рядки.
FRONTEND_BUILD_LOG="/tmp/izi_deploy_frontend.log"
if ! (cd "$APP_DIR/frontend" && sudo -u "$APP_USER" npm ci && sudo -u "$APP_USER" npm run build) > "$FRONTEND_BUILD_LOG" 2>&1; then
  warn "Збірка frontend впала. Останні рядки логу ($FRONTEND_BUILD_LOG):"
  tail -40 "$FRONTEND_BUILD_LOG"
  echo ""
  echo "Якщо серед причин 'JavaScript heap out of memory' або процес просто зникає"
  echo "без явної помилки — перевірте: free -h  та  dmesg | tail -30 (можлива нестача RAM, OOM-kill)."
  exit 1
fi
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
