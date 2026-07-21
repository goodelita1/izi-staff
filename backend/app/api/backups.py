from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.backup_service import BackupService
from app.schemas.common import Response

router = APIRouter(prefix="/backups", tags=["backups"])


class RestoreRequest(BaseModel):
    filename: str


class DeleteRequest(BaseModel):
    filename: str


@router.get("", response_model=Response)
def list_backups():
    return Response(success=True, message="OK", data=BackupService().list())


@router.post("/create", response_model=Response)
def create_backup():
    info = BackupService().create()
    return Response(success=True, message="Backup created", data=info)


@router.post("/restore", response_model=Response)
def restore_backup(body: RestoreRequest):
    ok = BackupService().restore(body.filename)
    if not ok:
        raise HTTPException(status_code=404, detail="Backup file not found")
    return Response(success=True, message="Restored successfully")


@router.delete("/{filename}", response_model=Response)
def delete_backup(filename: str):
    ok = BackupService().delete(filename)
    if not ok:
        raise HTTPException(status_code=404, detail="Backup file not found")
    return Response(success=True, message="Deleted")
