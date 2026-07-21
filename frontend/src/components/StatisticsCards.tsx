import { Box, Card, CardContent, Skeleton, Typography } from "@mui/material";
import type { Statistics } from "../types/inventory";

interface StatCard {
  label: string;
  value: number | string;
  color: string;
}

function StatCard({ label, value, color }: StatCard) {
  return (
    <Card sx={{ flex: 1, minWidth: 130 }}>
      <CardContent sx={{ p: "10px 14px !important" }}>
        <Typography
          variant="caption"
          noWrap
          sx={{ color: "text.secondary", display: "block" }}
        >
          {label}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color,
            fontWeight: 700,
            lineHeight: 1.4,
            fontFamily: '"JetBrains Mono", monospace',
            display: "block",
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

interface Props {
  stats: Statistics | undefined;
  loading?: boolean;
}

export default function StatisticsCards({ stats, loading }: Props) {
  if (loading || !stats) {
    return (
      <Box sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            width={150}
            height={60}
            sx={{ flex: 1, minWidth: 130 }}
          />
        ))}
      </Box>
    );
  }

  const fmt = (n: number) => n.toLocaleString("uk-UA");
  const fmtMoney = (n: number) =>
    n.toLocaleString("uk-UA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
      <StatCard
        label="Загальна кількість"
        value={fmt(stats.total_items)}
        color="#e6edf3"
      />
      <StatCard
        label="Загальна сума"
        value={`${fmtMoney(stats.total_value)} ₴`}
        color="#58a6ff"
      />
      <StatCard
        label="На складі"
        value={fmt(stats.warehouse_items)}
        color="#3fb950"
      />
      <StatCard
        label="Видано"
        value={fmt(stats.issued_items)}
        color="#58a6ff"
      />
      <StatCard
        label="Повернуто"
        value={fmt(stats.returned_items)}
        color="#d29922"
      />
      <StatCard
        label="Списано"
        value={fmt(stats.written_off_items)}
        color="#8b949e"
      />
    </Box>
  );
}
