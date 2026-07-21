# IZI Staff — Система обліку майна

Локальна система управління інвентарем для відділів та підрозділів.  
Працює повністю офлайн — без хмари, без авторизації, без інтернету.

**FastAPI · React · SQLite · AG Grid**

---

## Що вміє

- **Інвентар** — повний облік майна: накладні, статуси, категорії, кількість, вартість
- **Мульти-база** — кожен відділ має окрему ізольовану базу даних
- **Пошук** — миттєвий пошук по всіх полях таблиці
- **QR-коди** — генерація та пакетний друк QR для будь-яких позицій
- **Excel** — імпорт із `.xlsx` з валідацією рядків + експорт з фільтрами
- **Кошик** — м'яке видалення з можливістю відновлення
- **Резервні копії** — автоматично при запуску і кожні 24 год, або вручну
- **Журнал подій** — повний лог дій із фільтрами по рівню
- **Телефон** — доступ з будь-якого пристрою в локальній мережі

---

## Стек

| | |
|---|---|
| **Backend** | Python 3.13 · FastAPI · SQLAlchemy 2 · Alembic · Pydantic v2 |
| **Frontend** | React 19 · TypeScript · Vite · MUI v9 · AG Grid · React Query |
| **База даних** | SQLite (окремий файл на кожен відділ) |
| **Інше** | openpyxl · qrcode · APScheduler |

---

## Швидкий старт

### Вимоги

- Python 3.11+
- Node.js 18+

### 1. Клонувати та налаштувати

```bash
git clone https://github.com/goodelita1/izi-staff.git
cd izi-staff

cp .env.example .env
```

Відкрити `.env` і вказати IP свого комп'ютера:

```bash
# Дізнатись IP:
ipconfig getifaddr en0      # macOS
hostname -I                  # Linux
```

```env
HOST_IP=192.168.1.100
VITE_HOST_IP=192.168.1.100
```

### 2. Запустити одною командою

```bash
chmod +x start.sh
./start.sh
```

Скрипт автоматично встановить залежності, виконає міграції і запустить обидва сервери.

| | URL |
|---|---|
| Застосунок | `http://<HOST_IP>:5173` |
| API | `http://<HOST_IP>:8000/api` |
| Документація | `http://<HOST_IP>:8000/docs` |

---

## Ручний запуск

**Backend** (термінал 1):
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend** (термінал 2):
```bash
cd frontend
npm install
npm run dev
```

---

## Структура проєкту

```
db_izi_staff/
├── backend/
│   ├── main.py                  # Точка входу FastAPI
│   ├── requirements.txt
│   ├── alembic/                 # Міграції БД
│   └── app/
│       ├── api/                 # Роутери (inventory, qr, excel, backups …)
│       ├── models/              # SQLAlchemy моделі
│       ├── repositories/        # Шар доступу до даних
│       ├── services/            # Бізнес-логіка
│       ├── schemas/             # Pydantic схеми
│       ├── database/            # Engine, сесії, мульти-БД
│       └── config/              # Налаштування (pydantic-settings)
│
├── frontend/
│   └── src/
│       ├── api/                 # Axios клієнт + функції запитів
│       ├── components/          # UI компоненти
│       ├── pages/               # Сторінки (Inventory, Trash, Backups …)
│       ├── hooks/               # React Query хуки
│       └── config.ts            # HOST_IP та URL константи
│
├── .env.example                 # Шаблон конфігурації
├── start.sh                     # Запуск одною командою
└── README.md
```

---

## Імпорт Excel

Перший рядок файлу `.xlsx` повинен містити заголовки.

Підтримувані формати дат: `2024-03-15` · `15.03.2024` · `15/03/2024`

Обов'язкові поля: `invoice_number`, `invoice_date`, `item_name`, `quantity`

Після імпорту відображається звіт: кількість успішних записів + таблиця помилок по рядках.

---

## Гарячі клавіші

| | |
|---|---|
| `Ctrl + N` | Додати новий запис |
| `Ctrl + E` | Експорт в Excel |
| `F5` | Оновити таблицю |

---

## Зміна IP

Якщо IP комп'ютера змінився — достатньо оновити `.env`:

```env
HOST_IP=192.168.1.XXX
VITE_HOST_IP=192.168.1.XXX
```

І перезапустити `./start.sh`.
