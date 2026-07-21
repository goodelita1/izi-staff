from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.engine import get_db
from app.services.inventory_service import InventoryService
from app.schemas.inventory import (
    InventoryCreate,
    InventoryListOut,
    InventoryOut,
    InventoryUpdate,
)
from app.schemas.common import Response
from app.utils.days import calc_days_issued

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _to_out(item) -> InventoryOut:
    out = InventoryOut.model_validate(item)
    out.days_issued = calc_days_issued(item)
    return out


@router.get("", response_model=Response)
def list_inventory(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=1000),
    search: str = Query(default=""),
    status: str = Query(default=""),
    category: str = Query(default=""),
    department: str = Query(default=""),
    ownership: str = Query(default=""),
    sort: str = Query(default="id"),
    order: str = Query(default="asc"),
    db: Session = Depends(get_db),
):
    svc = InventoryService(db)
    items, total = svc.get_list(
        page=page,
        limit=limit,
        search=search,
        status=status,
        category=category,
        department=department,
        ownership=ownership,
        sort=sort,
        order=order,
    )
    data = InventoryListOut(
        items=[_to_out(i) for i in items],
        total=total,
        page=page,
        limit=limit,
    )
    return Response(success=True, message="OK", data=data.model_dump())


@router.get("/{item_id}", response_model=Response)
def get_inventory(item_id: int, db: Session = Depends(get_db)):
    item = InventoryService(db).get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(success=True, message="OK", data=_to_out(item).model_dump())


@router.post("", response_model=Response, status_code=201)
def create_inventory(
    body: InventoryCreate,
    force: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    svc = InventoryService(db)
    if not force:
        if svc.check_invoice_duplicate(body.invoice_number):
            return Response(
                success=False,
                message="DUPLICATE_INVOICE",
                data={"invoice_number": body.invoice_number},
            )
        if body.serial_number and svc.check_serial_duplicate(body.serial_number):
            return Response(
                success=False,
                message="DUPLICATE_SERIAL",
                data={"serial_number": body.serial_number},
            )
    item = svc.create(body.model_dump())
    return Response(success=True, message="Created", data=_to_out(item).model_dump())


@router.put("/{item_id}", response_model=Response)
def update_inventory(
    item_id: int,
    body: InventoryUpdate,
    force: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    svc = InventoryService(db)
    if not force and body.serial_number:
        if svc.check_serial_duplicate(body.serial_number, exclude_id=item_id):
            return Response(
                success=False,
                message="DUPLICATE_SERIAL",
                data={"serial_number": body.serial_number},
            )
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    item = svc.update(item_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(success=True, message="Updated", data=_to_out(item).model_dump())


@router.delete("/{item_id}", response_model=Response)
def soft_delete_inventory(item_id: int, db: Session = Depends(get_db)):
    deleted = InventoryService(db).soft_delete(item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(success=True, message="Moved to trash")


@router.post("/{item_id}/restore", response_model=Response)
def restore_inventory(item_id: int, db: Session = Depends(get_db)):
    item = InventoryService(db).restore(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found in trash")
    return Response(success=True, message="Restored", data=_to_out(item).model_dump())


@router.delete("/{item_id}/permanent", response_model=Response)
def permanent_delete(item_id: int, db: Session = Depends(get_db)):
    ok = InventoryService(db).permanent_delete(item_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found in trash")
    return Response(success=True, message="Permanently deleted")
