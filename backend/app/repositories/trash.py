from sqlalchemy.orm import Session
from app.models.deleted_inventory import DeletedInventory
from app.models.inventory import Inventory


class TrashRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_list(self) -> list[DeletedInventory]:
        return (
            self.db.query(DeletedInventory)
            .order_by(DeletedInventory.deleted_at.desc())
            .all()
        )

    def get_by_id(self, item_id: int) -> DeletedInventory | None:
        return (
            self.db.query(DeletedInventory)
            .filter(DeletedInventory.id == item_id)
            .first()
        )

    def restore(self, item: DeletedInventory) -> Inventory:
        columns = {
            c.name: getattr(item, c.name)
            for c in DeletedInventory.__table__.columns
            if c.name not in ("id", "deleted_at")
        }
        restored = Inventory(**columns)
        self.db.add(restored)
        self.db.delete(item)
        self.db.commit()
        self.db.refresh(restored)
        return restored

    def permanent_delete(self, item: DeletedInventory) -> None:
        self.db.delete(item)
        self.db.commit()

    def empty_trash(self) -> int:
        count = self.db.query(DeletedInventory).count()
        self.db.query(DeletedInventory).delete()
        self.db.commit()
        return count
