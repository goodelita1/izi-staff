from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.engine import get_db
from app.services.inventory_service import InventoryService
from app.schemas.inventory import InventoryOut
from app.schemas.common import Response

router = APIRouter(prefix="/trash", tags=["trash"])


@router.get("", response_model=Response)
def list_trash(db: Session = Depends(get_db)):
    items = InventoryService(db).get_trash()
    data = [InventoryOut.model_validate(i).model_dump() for i in items]
    return Response(success=True, message="OK", data=data)


@router.delete("/empty", response_model=Response)
def empty_trash(db: Session = Depends(get_db)):
    count = InventoryService(db).empty_trash()
    return Response(success=True, message=f"Deleted {count} records")
