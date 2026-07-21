# API

Version: 1.0.0

Status: APPROVED

---

# Base URL

http://localhost:8000/api

---

# Inventory

GET

/inventory

Return inventory list.

Supports

page

limit

search

status

sort

order

---

GET

/inventory/{id}

Return single inventory item.

---

POST

/inventory

Create inventory item.

Generate

inventory_number

QR

created_at

updated_at

---

PUT

/inventory/{id}

Update inventory item.

Update

updated_at

---

DELETE

/inventory/{id}

Soft delete.

Move record to Trash.

---

POST

/inventory/{id}/restore

Restore record.

---

DELETE

/inventory/{id}/permanent

Permanent delete.

---

# Statistics

GET

/statistics

Return

total_items

warehouse_items

issued_items

returned_items

written_off_items

total_value

---

# Trash

GET

/trash

Return deleted records.

---

DELETE

/trash/empty

Empty Trash.

---

# Excel

POST

/import

Upload

xlsx

---

GET

/export

Download

xlsx

Current filters only.

---

# QR

GET

/qr/{inventory_number}

Return QR image.

---

GET

/qr/print

Print selected QR.

---

# Backups

GET

/backups

List backups.

---

POST

/backups/create

Create backup.

---

POST

/backups/restore

Restore backup.

---

# Settings

GET

/settings

---

PUT

/settings

Update settings.

---

# Logs

GET

/logs

Return application logs.

---

# Responses

Success

200

201

---

Validation Error

400

---

Not Found

404

---

Internal Error

500

---

Response Format

success

message

data

---

End of document.
