import shutil
from datetime import datetime
from pathlib import Path
from app.config.settings import settings


class BackupService:
    def __init__(self) -> None:
        self.db_path = Path(settings.database_path)
        self.backup_dir = Path(settings.backup_path)
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def create(self) -> dict:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"inventory_backup_{timestamp}.db"
        dest = self.backup_dir / filename
        shutil.copy2(self.db_path, dest)
        return self._backup_info(dest)

    def list(self) -> list[dict]:
        files = sorted(self.backup_dir.glob("inventory_backup_*.db"), reverse=True)
        return [self._backup_info(f) for f in files]

    def restore(self, filename: str) -> bool:
        src = self.backup_dir / filename
        if not src.exists():
            return False
        shutil.copy2(src, self.db_path)
        return True

    def delete(self, filename: str) -> bool:
        path = self.backup_dir / filename
        if not path.exists():
            return False
        path.unlink()
        return True

    def _backup_info(self, path: Path) -> dict:
        stat = path.stat()
        return {
            "filename": path.name,
            "size_bytes": stat.st_size,
            "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        }
