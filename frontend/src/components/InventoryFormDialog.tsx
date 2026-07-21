import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import type { InventoryItem } from "../types/inventory";
import {
  useCreateInventory,
  useUpdateInventory,
} from "../hooks/useInventoryMutations";

const STATUSES = ["Warehouse", "Issued", "Returned", "Written Off"];
const STATUS_UA: Record<string, string> = {
  Warehouse: "Склад",
  Issued: "Видано",
  Returned: "Повернуто",
  "Written Off": "Списано",
};
const OWNERSHIPS = ["Own", "State"];
const OWNERSHIP_UA: Record<string, string> = {
  Own: "Власне",
  State: "Державне",
};

type FormData = {
  invoice_number: string;
  invoice_date: string;
  invoice_receiver: string;
  department: string;
  item_name: string;
  nomenclature_code: string;
  serial_number: string;
  unit: string;
  category: string;
  quantity: string;
  price: string;
  total_price: string;
  issued_to: string;
  location: string;
  issued_date: string;
  ownership: string;
  status: string;
  note: string;
};

const EMPTY: FormData = {
  invoice_number: "",
  invoice_date: "",
  invoice_receiver: "",
  department: "",
  item_name: "",
  nomenclature_code: "",
  serial_number: "",
  unit: "шт",
  category: "",
  quantity: "1",
  price: "0",
  total_price: "0",
  issued_to: "",
  location: "",
  issued_date: "",
  ownership: "",
  status: "Warehouse",
  note: "",
};

function toForm(item: InventoryItem): FormData {
  return {
    invoice_number: item.invoice_number ?? "",
    invoice_date: item.invoice_date ?? "",
    invoice_receiver: item.invoice_receiver ?? "",
    department: item.department ?? "",
    item_name: item.item_name ?? "",
    nomenclature_code: item.nomenclature_code ?? "",
    serial_number: item.serial_number ?? "",
    unit: item.unit ?? "шт",
    category: item.category ?? "",
    quantity: String(item.quantity ?? 1),
    price: String(item.price ?? 0),
    total_price: String(item.total_price ?? 0),
    issued_to: item.issued_to ?? "",
    location: item.location ?? "",
    issued_date: item.issued_date ?? "",
    ownership: item.ownership ?? "",
    status: item.status ?? "Warehouse",
    note: item.note ?? "",
  };
}

function validate(f: FormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!f.invoice_number.trim()) errs.invoice_number = "Обов'язкове поле";
  if (!f.invoice_date) errs.invoice_date = "Обов'язкове поле";
  if (!f.item_name.trim()) errs.item_name = "Обов'язкове поле";
  if (!f.unit.trim()) errs.unit = "Обов'язкове поле";
  if (!f.category.trim()) errs.category = "Обов'язкове поле";
  const qty = Number(f.quantity);
  if (!Number.isInteger(qty) || qty < 1) errs.quantity = "Мінімум 1";
  if (Number(f.price) < 0) errs.price = "Не може бути від'ємним";
  if (Number(f.total_price) < 0) errs.total_price = "Не може бути від'ємним";
  return errs;
}

import type { InventoryStatus } from "../types/inventory";

function toPayload(f: FormData) {
  return {
    invoice_number: f.invoice_number.trim(),
    invoice_date: f.invoice_date,
    invoice_receiver: f.invoice_receiver.trim() || null,
    department: f.department.trim() || null,
    item_name: f.item_name.trim(),
    nomenclature_code: f.nomenclature_code.trim() || null,
    serial_number: f.serial_number.trim() || null,
    unit: f.unit.trim(),
    category: f.category.trim(),
    quantity: Number(f.quantity),
    price: Number(f.price),
    total_price: Number(f.total_price),
    issued_to: f.issued_to.trim() || null,
    location: f.location.trim() || null,
    issued_date: f.issued_date || null,
    ownership: f.ownership || null,
    status: f.status as InventoryStatus,
    note: f.note.trim() || null,
  };
}

interface Props {
  open: boolean;
  item?: InventoryItem | null;
  onClose: () => void;
}

export default function InventoryFormDialog({ open, item, onClose }: Props) {
  const isEdit = !!item;
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warning, setWarning] = useState<string | null>(null);
  const [pendingForce, setPendingForce] = useState(false);

  const createMutation = useCreateInventory();
  const updateMutation = useUpdateInventory();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setForm(item ? toForm(item) : EMPTY);
      setErrors({});
      setWarning(null);
      setPendingForce(false);
    }
  }, [open, item]);

  const set =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    };

  const handleSubmit = async (force = false) => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = toPayload(form);

    if (isEdit && item) {
      const res = await updateMutation.mutateAsync({
        id: item.id,
        data: payload,
        force,
      });
      if (res.data.message === "DUPLICATE_SERIAL") {
        setWarning(
          `Серійний номер "${form.serial_number}" вже існує. Продовжити?`,
        );
        setPendingForce(true);
        return;
      }
    } else {
      const res = await createMutation.mutateAsync({ data: payload, force });
      if (res.data.message === "DUPLICATE_INVOICE") {
        setWarning(`Накладна "${form.invoice_number}" вже існує. Продовжити?`);
        setPendingForce(true);
        return;
      }
      if (res.data.message === "DUPLICATE_SERIAL") {
        setWarning(
          `Серійний номер "${form.serial_number}" вже існує. Продовжити?`,
        );
        setPendingForce(true);
        return;
      }
    }

    onClose();
  };

  const Field = (
    field: keyof FormData,
    label: string,
    props: Partial<React.ComponentProps<typeof TextField>> = {},
  ) => (
    <TextField
      size="small"
      fullWidth
      label={label}
      value={form[field]}
      onChange={set(field)}
      error={!!errors[field]}
      helperText={errors[field]}
      sx={{ "& .MuiOutlinedInput-root fieldset": { borderColor: "#30363d" } }}
      {...props}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: { sx: { bgcolor: "#161b22", border: "1px solid #30363d" } },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: "1px solid #30363d",
          py: 1.5,
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {isEdit ? "Редагувати запис" : "Додати запис"}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {warning && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  color="warning"
                  onClick={() => {
                    setWarning(null);
                    handleSubmit(true);
                  }}
                >
                  Продовжити
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setWarning(null);
                    setPendingForce(false);
                  }}
                >
                  Скасувати
                </Button>
              </Box>
            }
          >
            {warning}
          </Alert>
        )}

        <Typography
          variant="caption"
          sx={{
            color: "primary.main",
            fontWeight: 600,
            display: "block",
            mb: 1,
          }}
        >
          НАКЛАДНА
        </Typography>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={3}>{Field("invoice_number", "Номер накладної *")}</Grid>
          <Grid size={3}>
            {Field("invoice_date", "Дата накладної *", {
              type: "date",
              slotProps: { inputLabel: { shrink: true } },
            })}
          </Grid>
          <Grid size={3}>{Field("invoice_receiver", "Отримувач")}</Grid>
          <Grid size={3}>{Field("department", "Служба")}</Grid>
        </Grid>

        <Divider sx={{ borderColor: "#30363d", mb: 2 }} />

        <Typography
          variant="caption"
          sx={{
            color: "primary.main",
            fontWeight: 600,
            display: "block",
            mb: 1,
          }}
        >
          МАЙНО
        </Typography>
        <Grid container spacing={1.5}>
          <Grid size={6}>{Field("item_name", "Назва майна *")}</Grid>
          <Grid size={3}>{Field("nomenclature_code", "Код номенклатури")}</Grid>
          <Grid size={3}>{Field("serial_number", "Серійний номер")}</Grid>

          <Grid size={2}>{Field("unit", "Одиниця *")}</Grid>
          <Grid size={3}>{Field("category", "Категорія *")}</Grid>
          <Grid size={2}>
            {Field("quantity", "Кількість *", { type: "number" })}
          </Grid>
          <Grid size={2.5}>
            {Field("price", "Вартість", { type: "number" })}
          </Grid>
          <Grid size={2.5}>
            {Field("total_price", "Сума", { type: "number" })}
          </Grid>

          <Grid size={4}>{Field("issued_to", "Кому видано")}</Grid>
          <Grid size={4}>{Field("location", "Місце")}</Grid>
          <Grid size={4}>
            {Field("issued_date", "Дата видачі", {
              type: "date",
              slotProps: { inputLabel: { shrink: true } },
            })}
          </Grid>

          <Grid size={3}>
            <TextField
              select
              size="small"
              fullWidth
              label="Тип власності"
              value={form.ownership}
              onChange={set("ownership")}
              sx={{
                "& .MuiOutlinedInput-root fieldset": { borderColor: "#30363d" },
              }}
            >
              <MenuItem value="">
                <em>—</em>
              </MenuItem>
              {OWNERSHIPS.map((o) => (
                <MenuItem key={o} value={o}>
                  {OWNERSHIP_UA[o]}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={3}>
            <TextField
              select
              size="small"
              fullWidth
              label="Статус"
              value={form.status}
              onChange={set("status")}
              sx={{
                "& .MuiOutlinedInput-root fieldset": { borderColor: "#30363d" },
              }}
            >
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {STATUS_UA[s]}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={6}>
            {Field("note", "Примітка", { multiline: true, rows: 2 })}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{ borderTop: "1px solid #30363d", px: 2, py: 1.5, gap: 1 }}
      >
        <Button onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
          Скасувати
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => !pendingForce && handleSubmit(false)}
          disabled={isPending || pendingForce}
          sx={{ bgcolor: "#238636", "&:hover": { bgcolor: "#2ea043" } }}
        >
          {isPending ? "Збереження..." : "Зберегти"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
