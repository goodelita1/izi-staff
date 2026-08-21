#!/usr/bin/env bash
# IZI Staff — скрипт запуску

set -euo pipefail
# Увімкнути job control навіть у неінтерактивному скрипті: тоді кожен
# фоновий процес (backend/frontend) отримує СВОЮ групу процесів, окрему
# від групи самого start.sh. Якщо зовнішній інструмент (наприклад,
# агентський Bash-таймаут) вб'є лише групу самого start.sh — backend і
# frontend це не зачепить.
set -m

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

# Значення HOST_IP з кореневого .env (як запасний варіант, якщо автовизначення не спрацює)
ENV_HOST_IP=""
if [ -f "$SCRIPT_DIR/.env" ]; then
  ENV_HOST_IP=$(grep -E "^HOST_IP=" "$SCRIPT_DIR/.env" | cut -d= -f2 | tr -d '[:space:]')
fi

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

# ── визначення поточної IP-адреси пристрою в локальній мережі ────────────────
detect_ip() {
  local ip=""

  # 1) Інтерфейс дефолтного маршруту — та мережа, яка справді активна зараз
  #    (Wi-Fi чи Ethernet, без прив'язки до конкретної назви en0/en1)
  local iface
  iface=$(route -n get default 2>/dev/null | awk '/interface: /{print $2}') || true
  if [ -n "$iface" ]; then
    ip=$(ipconfig getifaddr "$iface" 2>/dev/null || true)
  fi

  # 2) Фолбек: перебрати типові macOS-інтерфейси
  if [ -z "$ip" ]; then
    local i
    for i in en0 en1 en2 en3 en4; do
      ip=$(ipconfig getifaddr "$i" 2>/dev/null || true)
      [ -n "$ip" ] && break
    done
  fi

  # 3) Фолбек: перша не-loopback IPv4-адреса з ifconfig (на випадок Linux/інших систем)
  if [ -z "$ip" ] && command -v ifconfig &>/dev/null; then
    ip=$(ifconfig 2>/dev/null | awk '/inet /{print $2}' | grep -v '^127\.' | head -1) || true
  fi

  echo "$ip"
}

# Оновити (або додати) значення ключа в .env, зберігаючи решту файлу
update_env_var() {
  local key="$1" value="$2" file="$3"
  if [ -f "$file" ] && grep -qE "^${key}=" "$file"; then
    sed -i '' -E "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

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

# ── зупинити backend/frontend (використовується і в cleanup(), і в --stop) ───
stop_services() {
  local pid

  if [ -f "$BACKEND_PID_FILE" ]; then
    pid=$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$BACKEND_PID_FILE"
  fi

  if [ -f "$FRONTEND_PID_FILE" ]; then
    pid=$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$FRONTEND_PID_FILE"
  fi

  # Дати процесам шанс завершитись штатно (зловити SIGTERM, залогувати
  # "Shutting down" і вийти самим), перш ніж форсувати -9 через kill_port.
  # Без цієї паузи kill -9 міг прилітати в процес, який ще завершувався
  # штатно, обриваючи його на середині — саме це й малось у лозі, де
  # останній рядок був "Shutting down" без нічого після нього.
  local waited=0
  while { port_in_use $BACKEND_PORT || port_in_use $FRONTEND_PORT; } && [ $waited -lt 10 ]; do
    sleep 0.5
    waited=$((waited + 1))
  done

  kill_port $BACKEND_PORT
  kill_port $FRONTEND_PORT
}

# ── зупинити всі процеси при виході ──────────────────────────────────────────
cleanup() {
  echo -e "\n${YELLOW}  Зупинка сервісів...${RESET}"
  stop_services
  echo -e "${GREEN}  ✓ Зупинено.${RESET}\n"
}

# ── розбір аргументів командного рядка ────────────────────────────────────────
BACKGROUND_MODE=0
case "${1:-}" in
  --stop)
    echo -e "${YELLOW}  Зупинка сервісів IZI Staff...${RESET}"
    stop_services
    echo -e "${GREEN}  ✓ Зупинено.${RESET}"
    exit 0
    ;;
  --background|-d)
    BACKGROUND_MODE=1
    ;;
  --help|-h)
    echo "Використання: ./start.sh [опція]"
    echo ""
    echo "  (без опцій)       запустити та стежити за сервісами в цьому терміналі"
    echo "                    (Ctrl+C зупиняє backend і frontend)"
    echo "  --background, -d  запустити у фоні й одразу повернути керування"
    echo "                    термінал/агентський інструмент не блокується і не"
    echo "                    вб'є сервіси через таймаут на виконання команди"
    echo "  --stop            зупинити сервіси, запущені раніше через --background"
    echo "  --help, -h        показати цю довідку"
    exit 0
    ;;
  "")
    ;;
  *)
    log_error "Невідома опція: ${1}. Використайте --help."
    exit 1
    ;;
esac

trap cleanup EXIT INT TERM

# ══════════════════════════════════════════════════════════════════════════════
#  BOOT ANIMATION
# ══════════════════════════════════════════════════════════════════════════════
PYTHON3_BIN_QUICK=""
for _b in python3.13 python3.12 python3.11 python3; do
  if command -v "$_b" &>/dev/null; then PYTHON3_BIN_QUICK="$_b"; break; fi
done

if [ -n "$PYTHON3_BIN_QUICK" ] && [ -f "$SCRIPT_DIR/boot_animation.py" ]; then
  "$PYTHON3_BIN_QUICK" "$SCRIPT_DIR/boot_animation.py"
fi

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
#  0. ВИЗНАЧЕННЯ IP-АДРЕСИ ПРИСТРОЮ
# ══════════════════════════════════════════════════════════════════════════════
log_section "Визначення IP-адреси"

DETECTED_IP="$(detect_ip)"

if [ -n "$DETECTED_IP" ]; then
  if [ -n "$ENV_HOST_IP" ] && [ "$DETECTED_IP" != "$ENV_HOST_IP" ]; then
    log_warn "IP змінився: $ENV_HOST_IP → $DETECTED_IP"
  fi
  HOST_IP="$DETECTED_IP"

  # Записуємо актуальний IP у .env, щоб backend (pydantic-settings) і
  # frontend (Vite, envDir) підхопили його при старті нижче
  if [ ! -f "$SCRIPT_DIR/.env" ]; then
    touch "$SCRIPT_DIR/.env"
  fi
  update_env_var "HOST_IP" "$HOST_IP" "$SCRIPT_DIR/.env"
  update_env_var "VITE_HOST_IP" "$HOST_IP" "$SCRIPT_DIR/.env"

  log_ok "IP визначено автоматично: $HOST_IP"
else
  HOST_IP="${ENV_HOST_IP:-127.0.0.1}"
  log_warn "Не вдалося автоматично визначити IP — використовую $HOST_IP"
  if [ "$HOST_IP" = "127.0.0.1" ]; then
    log_warn "Застосунок буде доступний лише на цьому комп'ютері (localhost)"
  fi
fi

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
# Примітка: перевіряємо через 127.0.0.1, а не через HOST_IP з .env —
# якщо IP комп'ютера в мережі зміниться (нова Wi-Fi мережа тощо) і HOST_IP
# застаріє, curl на неіснуючу в поточній мережі адресу може довго висіти
# в очікуванні з'єднання (немає маршруту), і скрипт виглядатиме "завислим",
# хоча backend насправді вже запущений і слухає 0.0.0.0.
MAX_WAIT=30
WAITED=0
while ! curl -s --max-time 2 "http://127.0.0.1:$BACKEND_PORT/api/health" > /dev/null 2>&1; do
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

# Чекати поки frontend відповідає (теж через 127.0.0.1, з тієї ж причини)
WAITED=0
while ! curl -s --max-time 2 "http://127.0.0.1:$FRONTEND_PORT" > /dev/null 2>&1; do
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
if [ "$BACKGROUND_MODE" = "1" ]; then
  echo -e "  ${BOLD}Режим:${RESET}         фоновий (сервіси працюють після виходу зі скрипта)"
  echo -e "  ${BOLD}Зупинити:${RESET}      ./start.sh --stop"
  echo ""
  # Зняти trap, щоб вихід зі скрипта зараз НЕ викликав cleanup() і не вбив
  # щойно запущені backend/frontend.
  trap - EXIT INT TERM
  exit 0
fi

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
