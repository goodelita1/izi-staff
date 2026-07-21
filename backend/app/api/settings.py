from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.engine import get_db
from app.repositories.settings import SettingsRepository
from app.schemas.settings import SettingsOut, SettingsUpdate
from app.schemas.common import Response

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=Response)
def get_settings(db: Session = Depends(get_db)):
    s = SettingsRepository(db).get()
    return Response(
        success=True, message="OK", data=SettingsOut.model_validate(s).model_dump()
    )


@router.put("", response_model=Response)
def update_settings(body: SettingsUpdate, db: Session = Depends(get_db)):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    s = SettingsRepository(db).update(data)
    return Response(
        success=True, message="Updated", data=SettingsOut.model_validate(s).model_dump()
    )
