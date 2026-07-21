from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    database_path: str = str(BASE_DIR / "database" / "inventory.db")
    backup_path: str = str(BASE_DIR / "backups")
    databases_dir: str = str(BASE_DIR / "databases")
    rows_per_page: int = 100
    host_ip: str = "192.168.3.144"

    class Config:
        env_file = str(BASE_DIR / ".env")
        extra = "ignore"


settings = Settings()
