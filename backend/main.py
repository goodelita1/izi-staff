import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import inventory, statistics, trash, excel, qr, backups, settings, logs, databases
from app.services.backup_service import BackupService
from app.services import scheduler_service
from app.config.settings import settings as app_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting up")
    try:
        info = BackupService().create()
        logger.info("Startup backup created: %s", info["filename"])
    except Exception as exc:
        logger.warning("Startup backup failed: %s", exc)

    databases.ensure_default()
    scheduler_service.start()

    yield

    scheduler_service.stop()
    logger.info("Application shut down")


app = FastAPI(title="Inventory Management System", version="1.0.0", lifespan=lifespan)

# У production фронтенд і backend віддаються одним nginx на одному origin,
# тож CORS фактично не задіюється — але лишаємо явний список адрес на
# випадок прямих звернень (docs, інший порт, тощо).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        app_settings.frontend_url,
        f"http://{app_settings.host_ip}:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api"
app.include_router(inventory.router, prefix=PREFIX)
app.include_router(statistics.router, prefix=PREFIX)
app.include_router(trash.router, prefix=PREFIX)
app.include_router(excel.router, prefix=PREFIX)
app.include_router(qr.router, prefix=PREFIX)
app.include_router(backups.router, prefix=PREFIX)
app.include_router(settings.router, prefix=PREFIX)
app.include_router(logs.router, prefix=PREFIX)
app.include_router(databases.router, prefix=PREFIX)


@app.get("/api/health")
def health() -> dict:
    return {"success": True, "message": "OK", "data": None}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
