# DATABASE

Version: 1.0.0

Status: APPROVED

---

# Database

Engine

SQLite

Single database

inventory.db

---

# Tables

inventory

application_settings

application_logs

deleted_inventory

---

==================================================
TABLE
inventory
==================================================

Primary Key

id INTEGER

AUTOINCREMENT

NOT NULL

UNIQUE

--------------------------------------------

inventory_number

TEXT

UNIQUE

NOT NULL

Example

INV-2026-000001

--------------------------------------------

invoice_number

TEXT

NOT NULL

--------------------------------------------

invoice_date

DATE

NOT NULL

--------------------------------------------

item_name

TEXT

NOT NULL

--------------------------------------------

nomenclature_code

TEXT

--------------------------------------------

serial_number

TEXT

UNIQUE

NULLABLE

--------------------------------------------

unit

TEXT

NOT NULL

--------------------------------------------

category

TEXT

NOT NULL

--------------------------------------------

quantity

INTEGER

DEFAULT 1

--------------------------------------------

price

REAL

DEFAULT 0

--------------------------------------------

total_price

REAL

DEFAULT 0

Manual input

--------------------------------------------

issued_to

TEXT

--------------------------------------------

location

TEXT

--------------------------------------------

issued_date

DATE

NULLABLE

--------------------------------------------

ownership

TEXT

Allowed

Own

State

--------------------------------------------

department

TEXT

--------------------------------------------

invoice_receiver

TEXT

--------------------------------------------

status

TEXT

Allowed

Warehouse

Issued

Returned

Written Off

--------------------------------------------

note

TEXT

--------------------------------------------

created_at

DATETIME

Automatic

--------------------------------------------

updated_at

DATETIME

Automatic

---

Virtual Field

days_issued

Calculated

CurrentDate - issued_date

Never stored inside database.

---

Indexes

inventory_number

invoice_number

serial_number

status

department

item_name

category

---

==================================================
TABLE
application_settings
==================================================

id

backup_path

database_path

rows_per_page

theme

created_at

updated_at

---

==================================================
TABLE
application_logs
==================================================

id

timestamp

level

module

message

---

==================================================
TABLE
deleted_inventory
==================================================

Same schema as inventory.

Used as Trash.

No permanent delete without confirmation.

---

Validation

inventory_number

Required

Unique

Automatically generated.

---

serial_number

Unique

Nullable

---

invoice_number

Required

Duplicates allowed after confirmation.

---

quantity

Minimum

1

---

price

Minimum

0

---

total_price

Minimum

0

Manual input

---

Search

Global search

All columns

Case insensitive

Partial match

---

Sorting

Every column

Ascending

Descending

---

Filtering

Status

Category

Department

Ownership

---

Pagination

Default

100 rows

Configurable

---

Backups

Automatic

At startup

Every 24 hours

Manual backup supported

---

Import

Excel only

.xlsx

---

Export

Excel only

.xlsx

---

Soft Delete

Move record to

deleted_inventory

Restore supported

Permanent delete supported

---

Generated Values

inventory_number

Automatic

INV-YYYY-XXXXXX

Example

INV-2026-000001

---

QR

Generated automatically

Contains

inventory_number

---

End of document.
