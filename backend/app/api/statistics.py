from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.engine import get_db
from app.services.inventory_service import InventoryService
from app.schemas.common import Response

router = APIRouter(prefix="/statistics", tags=["statistics"])


@router.get("", response_model=Response)
def get_statistics(db: Session = Depends(get_db)):
    stats = InventoryService(db).get_statistics()
    return Response(success=True, message="OK", data=stats)
