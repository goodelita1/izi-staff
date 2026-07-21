from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from io import BytesIO
from sqlalchemy.orm import Session
from app.database.engine import get_db
from app.services.inventory_service import InventoryService
from app.services.excel_service import ExcelService
from app.schemas.common import Response

router = APIRouter(tags=["excel"])


@router.get("/export")
def export_excel(
    search: str = Query(default=""),
    status: str = Query(default=""),
    category: str = Query(default=""),
    department: str = Query(default=""),
    ownership: str = Query(default=""),
    db: Session = Depends(get_db),
):
    svc = InventoryService(db)
    items, _ = svc.get_list(
        page=1,
        limit=100_000,
        search=search,
        status=status,
        category=category,
        department=department,
        ownership=ownership,
    )
    data = ExcelService().export(items)
    return StreamingResponse(
        BytesIO(data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=inventory.xlsx"},
    )


@router.post("/import", response_model=Response)
async def import_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")

    content = await file.read()
    records, errors = ExcelService().import_file(content)

    svc = InventoryService(db)
    created = 0
    for record in records:
        svc.create(record)
        created += 1

    return Response(
        success=True,
        message=f"Imported {created} records, {len(errors)} errors",
        data={"created": created, "errors": errors},
    )
