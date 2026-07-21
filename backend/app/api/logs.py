from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.engine import get_db
from app.repositories.logs import LogsRepository
from app.schemas.logs import LogOut
from app.schemas.common import Response

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("", response_model=Response)
def get_logs(
    limit: int = Query(default=500, ge=1, le=5000), db: Session = Depends(get_db)
):
    logs = LogsRepository(db).get_list(limit=limit)
    return Response(
        success=True,
        message="OK",
        data=[LogOut.model_validate(log).model_dump() for log in logs],
    )
