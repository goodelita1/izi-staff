from datetime import date, datetime
from pydantic import BaseModel, Field


class InventoryCreate(BaseModel):
    invoice_number: str
    invoice_date: date
    item_name: str
    nomenclature_code: str | None = None
    serial_number: str | None = None
    unit: str
    category: str
    quantity: int = Field(default=1, ge=1)
    price: float = Field(default=0.0, ge=0)
    total_price: float = Field(default=0.0, ge=0)
    issued_to: str | None = None
    location: str | None = None
    issued_date: date | None = None
    ownership: str | None = None
    department: str | None = None
    invoice_receiver: str | None = None
    status: str = "Warehouse"
    note: str | None = None


class InventoryUpdate(BaseModel):
    invoice_number: str | None = None
    invoice_date: date | None = None
    item_name: str | None = None
    nomenclature_code: str | None = None
    serial_number: str | None = None
    unit: str | None = None
    category: str | None = None
    quantity: int | None = Field(default=None, ge=1)
    price: float | None = Field(default=None, ge=0)
    total_price: float | None = Field(default=None, ge=0)
    issued_to: str | None = None
    location: str | None = None
    issued_date: date | None = None
    ownership: str | None = None
    department: str | None = None
    invoice_receiver: str | None = None
    status: str | None = None
    note: str | None = None


class InventoryOut(BaseModel):
    id: int
    inventory_number: str
    invoice_number: str
    invoice_date: date
    item_name: str
    nomenclature_code: str | None
    serial_number: str | None
    unit: str
    category: str
    quantity: int
    price: float
    total_price: float
    issued_to: str | None
    location: str | None
    issued_date: date | None
    ownership: str | None
    department: str | None
    invoice_receiver: str | None
    status: str
    note: str | None
    created_at: datetime
    updated_at: datetime
    days_issued: int | None = None

    model_config = {"from_attributes": True}


class InventoryListOut(BaseModel):
    items: list[InventoryOut]
    total: int
    page: int
    limit: int
