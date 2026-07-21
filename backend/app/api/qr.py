from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response as FastAPIResponse
from app.services.qr_service import QRService
from app.config.settings import settings

router = APIRouter(prefix="/qr", tags=["qr"])

FRONTEND_BASE = f"http://{settings.host_ip}:5173"


@router.get("/print")
def print_qr(numbers: str = Query(..., description="Comma-separated inventory numbers")):
    nums = [n.strip() for n in numbers.split(",") if n.strip()]
    if not nums:
        raise HTTPException(status_code=400, detail="No inventory numbers provided")
    data = QRService().get_bulk_bytes(nums, FRONTEND_BASE)
    return FastAPIResponse(content=data, media_type="image/png")


@router.get("/{inventory_number}")
def get_qr(inventory_number: str):
    try:
        data = QRService().get_bytes(inventory_number, FRONTEND_BASE)
    except Exception:
        raise HTTPException(status_code=404, detail="QR not found")
    return FastAPIResponse(content=data, media_type="image/png")
