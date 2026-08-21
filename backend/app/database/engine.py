from fastapi import Request
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config.settings import settings

engine = create_engine(
    f"sqlite:///{settings.database_path}",
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db(request: Request):
    from app.database.multi import get_session_factory, sanitize_id
    raw = request.headers.get("X-DB-Name", "default")
    db_id = "default" if raw == "default" else sanitize_id(raw)
    factory = get_session_factory(db_id)
    db = factory()
    try:
        yield db
    finally:
        db.close()
