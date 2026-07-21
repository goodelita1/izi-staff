from datetime import datetime
from pydantic import BaseModel


class LogOut(BaseModel):
    id: int
    timestamp: datetime
    level: str
    module: str | None
    message: str

    model_config = {"from_attributes": True}
