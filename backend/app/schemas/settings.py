from datetime import datetime
from pydantic import BaseModel


class SettingsUpdate(BaseModel):
    database_path: str | None = None
    backup_path: str | None = None
    rows_per_page: int | None = None
    theme: str | None = None


class SettingsOut(BaseModel):
    id: int
    database_path: str | None
    backup_path: str | None
    rows_per_page: int
    theme: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
