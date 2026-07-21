from sqlalchemy.orm import Session
from app.models.application_logs import ApplicationLog


class LogsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_list(self, limit: int = 500) -> list[ApplicationLog]:
        return (
            self.db.query(ApplicationLog)
            .order_by(ApplicationLog.timestamp.desc())
            .limit(limit)
            .all()
        )

    def create(self, level: str, message: str, module: str = "") -> ApplicationLog:
        log = ApplicationLog(level=level, message=message, module=module)
        self.db.add(log)
        self.db.commit()
        return log
