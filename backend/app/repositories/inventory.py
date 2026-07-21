from datetime import date
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.models.inventory import Inventory
from app.models.deleted_inventory import DeletedInventory


class InventoryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _search_filter(self, query, search: str):
        term = f"%{search}%"
        return query.filter(
            or_(
                Inventory.inventory_number.ilike(term),
                Inventory.invoice_number.ilike(term),
                Inventory.item_name.ilike(term),
                Inventory.nomenclature_code.ilike(term),
                Inventory.serial_number.ilike(term),
                Inventory.unit.ilike(term),
                Inventory.category.ilike(term),
                Inventory.issued_to.ilike(term),
                Inventory.location.ilike(term),
                Inventory.ownership.ilike(term),
                Inventory.department.ilike(term),
                Inventory.invoice_receiver.ilike(term),
                Inventory.status.ilike(term),
                Inventory.note.ilike(term),
            )
        )

    def get_list(
        self,
        page: int = 1,
        limit: int = 100,
        search: str = "",
        status: str = "",
        category: str = "",
        department: str = "",
        ownership: str = "",
        sort: str = "id",
        order: str = "asc",
    ) -> tuple[list[Inventory], int]:
        query = self.db.query(Inventory)

        if search:
            query = self._search_filter(query, search)
        if status:
            query = query.filter(Inventory.status == status)
        if category:
            query = query.filter(Inventory.category == category)
        if department:
            query = query.filter(Inventory.department == department)
        if ownership:
            query = query.filter(Inventory.ownership == ownership)

        total = query.count()

        col = getattr(Inventory, sort, Inventory.id)
        query = query.order_by(col.desc() if order == "desc" else col.asc())
        items = query.offset((page - 1) * limit).limit(limit).all()

        return items, total

    def get_by_id(self, item_id: int) -> Inventory | None:
        return self.db.query(Inventory).filter(Inventory.id == item_id).first()

    def get_by_inventory_number(self, inventory_number: str) -> Inventory | None:
        return (
            self.db.query(Inventory)
            .filter(Inventory.inventory_number == inventory_number)
            .first()
        )

    def invoice_number_exists(self, invoice_number: str) -> bool:
        return (
            self.db.query(Inventory)
            .filter(Inventory.invoice_number == invoice_number)
            .first()
            is not None
        )

    def serial_number_exists(
        self, serial_number: str, exclude_id: int | None = None
    ) -> bool:
        q = self.db.query(Inventory).filter(Inventory.serial_number == serial_number)
        if exclude_id:
            q = q.filter(Inventory.id != exclude_id)
        return q.first() is not None

    def generate_inventory_number(self) -> str:
        year = date.today().year
        count = (
            self.db.query(func.count(Inventory.id))
            .filter(Inventory.inventory_number.like(f"INV-{year}-%"))
            .scalar()
            or 0
        )
        deleted_count = (
            self.db.query(func.count(DeletedInventory.id))
            .filter(DeletedInventory.inventory_number.like(f"INV-{year}-%"))
            .scalar()
            or 0
        )
        next_num = count + deleted_count + 1
        return f"INV-{year}-{next_num:06d}"

    def create(self, data: dict) -> Inventory:
        item = Inventory(**data)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update(self, item: Inventory, data: dict) -> Inventory:
        for key, value in data.items():
            setattr(item, key, value)
        self.db.commit()
        self.db.refresh(item)
        return item

    def soft_delete(self, item: Inventory) -> DeletedInventory:
        columns = {
            c.name: getattr(item, c.name)
            for c in Inventory.__table__.columns
            if c.name != "id"
        }
        deleted = DeletedInventory(**columns)
        self.db.add(deleted)
        self.db.delete(item)
        self.db.commit()
        return deleted

    def get_statistics(self) -> dict:
        total = self.db.query(func.count(Inventory.id)).scalar() or 0
        warehouse = (
            self.db.query(func.count(Inventory.id))
            .filter(Inventory.status == "Warehouse")
            .scalar()
            or 0
        )
        issued = (
            self.db.query(func.count(Inventory.id))
            .filter(Inventory.status == "Issued")
            .scalar()
            or 0
        )
        returned = (
            self.db.query(func.count(Inventory.id))
            .filter(Inventory.status == "Returned")
            .scalar()
            or 0
        )
        written_off = (
            self.db.query(func.count(Inventory.id))
            .filter(Inventory.status == "Written Off")
            .scalar()
            or 0
        )
        total_value = self.db.query(func.sum(Inventory.total_price)).scalar() or 0.0
        return {
            "total_items": total,
            "warehouse_items": warehouse,
            "issued_items": issued,
            "returned_items": returned,
            "written_off_items": written_off,
            "total_value": total_value,
        }
