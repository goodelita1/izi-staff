from sqlalchemy.orm import Session
from app.models.inventory import Inventory
from app.models.deleted_inventory import DeletedInventory
from app.repositories.inventory import InventoryRepository
from app.repositories.trash import TrashRepository
from app.services.qr_service import QRService


class InventoryService:
    def __init__(self, db: Session) -> None:
        self.repo = InventoryRepository(db)
        self.trash_repo = TrashRepository(db)
        self.qr_service = QRService()

    def get_list(self, **kwargs) -> tuple[list[Inventory], int]:
        return self.repo.get_list(**kwargs)

    def get_by_id(self, item_id: int) -> Inventory | None:
        return self.repo.get_by_id(item_id)

    def check_invoice_duplicate(self, invoice_number: str) -> bool:
        return self.repo.invoice_number_exists(invoice_number)

    def check_serial_duplicate(
        self, serial_number: str, exclude_id: int | None = None
    ) -> bool:
        if not serial_number:
            return False
        return self.repo.serial_number_exists(serial_number, exclude_id)

    def create(self, data: dict) -> Inventory:
        data["inventory_number"] = self.repo.generate_inventory_number()
        item = self.repo.create(data)
        self.qr_service.generate(item.inventory_number)
        return item

    def update(self, item_id: int, data: dict) -> Inventory | None:
        item = self.repo.get_by_id(item_id)
        if not item:
            return None
        return self.repo.update(item, data)

    def soft_delete(self, item_id: int) -> DeletedInventory | None:
        item = self.repo.get_by_id(item_id)
        if not item:
            return None
        return self.repo.soft_delete(item)

    def restore(self, item_id: int) -> Inventory | None:
        item = self.trash_repo.get_by_id(item_id)
        if not item:
            return None
        return self.trash_repo.restore(item)

    def permanent_delete(self, item_id: int) -> bool:
        item = self.trash_repo.get_by_id(item_id)
        if not item:
            return False
        self.trash_repo.permanent_delete(item)
        return True

    def get_trash(self) -> list[DeletedInventory]:
        return self.trash_repo.get_list()

    def empty_trash(self) -> int:
        return self.trash_repo.empty_trash()

    def get_statistics(self) -> dict:
        return self.repo.get_statistics()
