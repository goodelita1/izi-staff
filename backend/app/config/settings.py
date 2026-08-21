from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    database_path: str = str(BASE_DIR / "database" / "inventory.db")
    backup_path: str = str(BASE_DIR / "backups")
    databases_dir: str = str(BASE_DIR / "databases")
    rows_per_page: int = 100
    host_ip: str = "192.168.3.144"
    # Порт, на якому реально роздається фронтенд (для CORS і посилань у QR-кодах).
    # У dev-режимі (vite dev) — 5173. У production за nginx — 80.
    frontend_port: int = 5173

    class Config:
        env_file = str(BASE_DIR / ".env")
        extra = "ignore"

    @property
    def frontend_url(self) -> str:
        if self.frontend_port == 80:
            return f"http://{self.host_ip}"
        return f"http://{self.host_ip}:{self.frontend_port}"


settings = Settings()
