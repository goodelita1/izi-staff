export type InventoryStatus =
  "Warehouse" | "Issued" | "Returned" | "Written Off";
export type OwnershipType = "Own" | "State";

export interface InventoryItem {
  id: number;
  inventory_number: string;
  invoice_number: string;
  invoice_date: string;
  item_name: string;
  nomenclature_code: string | null;
  serial_number: string | null;
  unit: string;
  category: string;
  quantity: number;
  price: number;
  total_price: number;
  issued_to: string | null;
  location: string | null;
  issued_date: string | null;
  ownership: string | null;
  department: string | null;
  invoice_receiver: string | null;
  status: InventoryStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
  days_issued: number | null;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface Statistics {
  total_items: number;
  warehouse_items: number;
  issued_items: number;
  returned_items: number;
  written_off_items: number;
  total_value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface InventoryFilters {
  page: number;
  limit: number;
  search: string;
  status: string;
  category: string;
  department: string;
  ownership: string;
  sort: string;
  order: "asc" | "desc";
}
