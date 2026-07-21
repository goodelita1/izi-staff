from datetime import date
from app.models.inventory import Inventory


def calc_days_issued(item: Inventory) -> int | None:
    if item.issued_date and item.status == "Issued":
        return (date.today() - item.issued_date).days
    return None
