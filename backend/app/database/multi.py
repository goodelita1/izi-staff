import re
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config.settings import settings

_engines: dict = {}
_session_factories: dict = {}


def sanitize_id(raw: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9_-]", "_", raw).strip("_")
    return clean[:60] or "default"


def db_path_for(db_id: str) -> Path:
    if db_id == "default":
        return Path(settings.database_path)
    return Path(settings.databases_dir) / f"{db_id}.db"


def get_engine_for(db_id: str):
    if db_id not in _engines:
        path = db_path_for(db_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        engine = create_engine(
            f"sqlite:///{path}",
            connect_args={"check_same_thread": False},
        )
        # import here to avoid circular imports
        from app.database.engine import Base
        Base.metadata.create_all(engine)
        _engines[db_id] = engine
    return _engines[db_id]


def get_session_factory(db_id: str):
    if db_id not in _session_factories:
        engine = get_engine_for(db_id)
        _session_factories[db_id] = sessionmaker(
            autocommit=False, autoflush=False, bind=engine
        )
    return _session_factories[db_id]
