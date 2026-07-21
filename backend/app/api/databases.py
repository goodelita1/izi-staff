import json
import re
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config.settings import settings
from app.database.multi import get_engine_for, db_path_for
from app.schemas.common import Response

router = APIRouter(prefix="/databases", tags=["databases"])

REGISTRY = Path(settings.databases_dir) / "registry.json"


def _read() -> list[dict]:
    if not REGISTRY.exists():
        return []
    return json.loads(REGISTRY.read_text(encoding="utf-8"))


def _write(data: list[dict]) -> None:
    REGISTRY.parent.mkdir(parents=True, exist_ok=True)
    REGISTRY.write_text(
        json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def _size(db_id: str) -> int:
    path = db_path_for(db_id)
    return path.stat().st_size if path.exists() else 0


def ensure_default() -> None:
    """Якщо реєстр порожній — додаємо дефолтну базу."""
    data = _read()
    if not any(d["id"] == "default" for d in data):
        data.insert(
            0,
            {
                "id": "default",
                "name": "Основна база",
                "created_at": datetime.now().isoformat(),
            },
        )
        _write(data)


class CreateRequest(BaseModel):
    name: str


@router.get("")
def list_databases():
    ensure_default()
    data = _read()
    result = [{**d, "size_bytes": _size(d["id"])} for d in data]
    return Response(success=True, message="OK", data=result)


@router.post("")
def create_database(body: CreateRequest):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    slug = re.sub(r"[^a-zA-Z0-9_]", "_", name).strip("_").lower()[:40]
    db_id = f"{slug}_{int(datetime.now().timestamp())}"

    get_engine_for(db_id)

    data = _read()
    entry = {"id": db_id, "name": name, "created_at": datetime.now().isoformat()}
    data.append(entry)
    _write(data)

    return Response(success=True, message="Created", data=entry)


@router.delete("/{db_id}")
def delete_database(db_id: str):
    if db_id == "default":
        raise HTTPException(status_code=400, detail="Cannot delete default database")

    data = _read()
    if not any(d["id"] == db_id for d in data):
        raise HTTPException(status_code=404, detail="Database not found")

    data = [d for d in data if d["id"] != db_id]
    _write(data)

    path = db_path_for(db_id)
    if path.exists():
        path.unlink()

    return Response(success=True, message="Deleted")
