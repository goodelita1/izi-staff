from sqlalchemy.orm import Session
from app.models.application_settings import ApplicationSettings


class SettingsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self) -> ApplicationSettings:
        settings = self.db.query(ApplicationSettings).first()
        if not settings:
            settings = ApplicationSettings()
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)
        return settings

    def update(self, data: dict) -> ApplicationSettings:
        settings = self.get()
        for key, value in data.items():
            setattr(settings, key, value)
        self.db.commit()
        self.db.refresh(settings)
        return settings
