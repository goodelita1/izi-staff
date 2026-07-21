#!/usr/bin/env bash
# IZI Staff — скрипт запуску

set -euo pipefail

# ── кольори ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── шляхи ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/.venv"
PYTHON="$VENV_DIR/bin/python"
PIP="$VENV_DIR/bin/pip"
UVICORN="$VENV_DIR/bin/uvicorn"
ALEMBIC="$VENV_DIR/bin/alembic"

# Читаємо HOST_IP з кореневого .env
if [ -f "$SCRIPT_DIR/.env" ]; then
  HOST_IP=$(grep -E "^HOST_IP=" "$SCRIPT_DIR/.env" | cut -d= -f2 | tr -d '[:space:]')
fi
HOST_IP="${HOST_IP:-192.168.3.144}"

BACKEND_PORT=8000
FRONTEND_PORT=5173

BACKEND_PID_FILE="/tmp/izi_backend.pid"
FRONTEND_PID_FILE="/tmp/izi_frontend.pid"
BACKEND_LOG="/tmp/izi_backend.log"
FRONTEND_LOG="/tmp/izi_frontend.log"

# ── утиліти ──────────────────────────────────────────────────────────────────
log_info()    { echo -e "${CYAN}  ▸${RESET} $1"; }
log_ok()      { echo -e "${GREEN}  ✓${RESET} $1"; }
log_warn()    { echo -e "${YELLOW}  ⚠${RESET} $1"; }
log_error()   { echo -e "${RED}  ✗${RESET} $1"; }
log_section() { echo -e "\n${BOLD}${BLUE}▶ $1${RESET}"; }

# ── перевірка порту ───────────────────────────────────────────────────────────
port_in_use() {
  lsof -ti tcp:"$1" > /dev/null 2>&1
}

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 0.5
  fi
}

# ── зупинити всі процеси при виході ──────────────────────────────────────────
cleanup() {
  echo -e "\n${YELLOW}  Зупинка сервісів...${RESET}"

  if [ -f "$BACKEND_PID_FILE" ]; then
    local pid
    pid=$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$BACKEND_PID_FILE"
  fi

  if [ -f "$FRONTEND_PID_FILE" ]; then
    local pid
    pid=$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$FRONTEND_PID_FILE"
  fi

  kill_port $BACKEND_PORT
  kill_port $FRONTEND_PORT

  echo -e "${GREEN}  ✓ Зупинено.${RESET}\n"
}

trap cleanup EXIT INT TERM

# ══════════════════════════════════════════════════════════════════════════════
#  ЗАГОЛОВОК
# ══════════════════════════════════════════════════════════════════════════════
clear
echo -e "${BOLD}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║         IZI Staff — Облік майна          ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${RESET}"

# ══════════════════════════════════════════════════════════════════════════════
#  1. ПЕРЕВІРКА ЗАЛЕЖНОСТЕЙ
# ══════════════════════════════════════════════════════════════════════════════
log_section "Перевірка системи"

# Python
PYTHON3_BIN=""
for bin in python3.13 python3.12 python3.11 python3; do
  if command -v "$bin" &> /dev/null; then
    PYTHON3_BIN="$bin"
    break
  fi
done

if [ -z "$PYTHON3_BIN" ]; then
  log_error "Python 3.11+ не знайдено. Встановіть з https://python.org"
  exit 1
fi
PYVER=$($PYTHON3_BIN --version 2>&1)
log_ok "Python: $PYVER"

# Node.js
if ! command -v node &> /dev/null; then
  log_error "Node.js не знайдено. Встановіть з https://nodejs.org"
  exit 1
fi
log_ok "Node.js: $(node --version)"

# npm
if ! command -v npm &> /dev/null; then
  log_error "npm не знайдено."
  exit 1
fi
log_ok "npm: $(npm --version)"

# ══════════════════════════════════════════════════════════════════════════════
#  2. BACKEND — НАЛАШТУВАННЯ
# ══════════════════════════════════════════════════════════════════════════════
log_section "Backend — налаштування"

cd "$BACKEND_DIR"

# Створити venv якщо немає
if [ ! -d "$VENV_DIR" ]; then
  log_info "Створення віртуального середовища Python..."
  $PYTHON3_BIN -m venv "$VENV_DIR"
  log_ok "Віртуальне середовище створено: $VENV_DIR"
else
  log_ok "Віртуальне середовище: вже існує"
fi

# Встановити залежності якщо потрібно
if [ ! -f "$VENV_DIR/lib/python"*/site-packages/fastapi/__init__.py ] 2>/dev/null; then
  log_info "Встановлення Python залежностей (може зайняти хвилину)..."
  $PIP install -r requirements.txt --quiet
  log_ok "Python залежності встановлено"
else
  log_ok "Python залежності: вже встановлено"
fi

# Створити директорії якщо немає
mkdir -p "$SCRIPT_DIR/database"
mkdir -p "$SCRIPT_DIR/backups"

# Виконати міграції
log_info "Перевірка/застосування міграцій бази даних..."
$ALEMBIC upgrade head 2>&1 | tail -3
log_ok "База даних готова"

# ══════════════════════════════════════════════════════════════════════════════
#  3. FRONTEND — НАЛАШТУВАННЯ
# ══════════════════════════════════════════════════════════════════════════════
log_section "Frontend — налаштування"

cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  log_info "Встановлення npm залежностей (може зайняти кілька хвилин)..."
  npm install --silent
  log_ok "npm залежності встановлено"
else
  log_ok "npm залежності: вже встановлено"
fi

# ══════════════════════════════════════════════════════════════════════════════
#  4. ЗУПИНИТИ СТАРІ ПРОЦЕСИ
# ══════════════════════════════════════════════════════════════════════════════
log_section "Підготовка портів"

if port_in_use $BACKEND_PORT; then
  log_warn "Порт $BACKEND_PORT зайнятий — зупиняю старий процес..."
  kill_port $BACKEND_PORT
  log_ok "Порт $BACKEND_PORT звільнено"
else
  log_ok "Порт $BACKEND_PORT вільний"
fi

if port_in_use $FRONTEND_PORT; then
  log_warn "Порт $FRONTEND_PORT зайнятий — зупиняю старий процес..."
  kill_port $FRONTEND_PORT
  log_ok "Порт $FRONTEND_PORT звільнено"
else
  log_ok "Порт $FRONTEND_PORT вільний"
fi

# ══════════════════════════════════════════════════════════════════════════════
#  5. ЗАПУСК BACKEND
# ══════════════════════════════════════════════════════════════════════════════
log_section "Запуск Backend"

cd "$BACKEND_DIR"
$UVICORN main:app \
  --host 0.0.0.0 \
  --port $BACKEND_PORT \
  --reload \
  --log-level info \
  > "$BACKEND_LOG" 2>&1 &

BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_PID_FILE"
log_info "Backend запускається (PID: $BACKEND_PID)..."

# Чекати поки backend відповідає
MAX_WAIT=30
WAITED=0
while ! curl -s "http://$HOST_IP:$BACKEND_PORT/api/health" > /dev/null 2>&1; do
  sleep 1
  WAITED=$((WAITED + 1))
  if [ $WAITED -ge $MAX_WAIT ]; then
    log_error "Backend не відповів за ${MAX_WAIT} секунд."
    echo -e "${RED}  Лог backend:${RESET}"
    tail -20 "$BACKEND_LOG"
    exit 1
  fi
  echo -ne "\r${CYAN}  ▸${RESET} Очікування backend... ${WAITED}s"
done
echo -e "\r${GREEN}  ✓${RESET} Backend готовий за ${WAITED}s            "
log_ok "API: http://$HOST_IP:$BACKEND_PORT/api"
log_ok "Документація: http://$HOST_IP:$BACKEND_PORT/docs"

# ══════════════════════════════════════════════════════════════════════════════
#  6. ЗАПУСК FRONTEND
# ══════════════════════════════════════════════════════════════════════════════
log_section "Запуск Frontend"

cd "$FRONTEND_DIR"
npm run dev \
  > "$FRONTEND_LOG" 2>&1 &

FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
log_info "Frontend запускається (PID: $FRONTEND_PID)..."

# Чекати поки frontend відповідає
WAITED=0
while ! curl -s "http://$HOST_IP:$FRONTEND_PORT" > /dev/null 2>&1; do
  sleep 1
  WAITED=$((WAITED + 1))
  if [ $WAITED -ge $MAX_WAIT ]; then
    log_error "Frontend не відповів за ${MAX_WAIT} секунд."
    echo -e "${RED}  Лог frontend:${RESET}"
    tail -20 "$FRONTEND_LOG"
    exit 1
  fi
  echo -ne "\r${CYAN}  ▸${RESET} Очікування frontend... ${WAITED}s"
done
echo -e "\r${GREEN}  ✓${RESET} Frontend готовий за ${WAITED}s            "
log_ok "Застосунок: http://$HOST_IP:$FRONTEND_PORT"

# ══════════════════════════════════════════════════════════════════════════════
#  7. ФІНАЛЬНИЙ СТАТУС
# ══════════════════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}${GREEN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║           ✓  СИСТЕМА ЗАПУЩЕНА           ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${RESET}"
echo -e "  ${BOLD}Застосунок:${RESET}    ${CYAN}http://${HOST_IP}:${FRONTEND_PORT}${RESET}"
echo -e "  ${BOLD}API:${RESET}           ${CYAN}http://${HOST_IP}:${BACKEND_PORT}/api${RESET}"
echo -e "  ${BOLD}Документація:${RESET}  ${CYAN}http://${HOST_IP}:${BACKEND_PORT}/docs${RESET}"
echo ""
echo -e "  ${BOLD}Логи:${RESET}"
echo -e "    Backend:   $BACKEND_LOG"
echo -e "    Frontend:  $FRONTEND_LOG"
echo ""
echo -e "  ${YELLOW}Натисніть Ctrl+C для зупинки${RESET}"
echo ""

# Відкрити браузер (macOS)
if command -v open &> /dev/null; then
  sleep 1
  open "http://$HOST_IP:$FRONTEND_PORT" 2>/dev/null || true
fi

# ══════════════════════════════════════════════════════════════════════════════
#  8. ОЧІКУВАННЯ / МОНІТОРИНГ
# ══════════════════════════════════════════════════════════════════════════════
# Показувати статус кожні 30 секунд, перевіряти чи процеси живі
while true; do
  sleep 30

  # Перевірити backend
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    log_error "Backend несподівано завершився! Перевірте лог: $BACKEND_LOG"
    exit 1
  fi

  # Перевірити frontend
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    log_error "Frontend несподівано завершився! Перевірте лог: $FRONTEND_LOG"
    exit 1
  fi
done
