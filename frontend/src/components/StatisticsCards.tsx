import { Box, Card, CardContent, Skeleton, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import type { Statistics } from "../types/inventory";

interface StatCard {
  label: string;
  value: number | string;
  color: string;
  mobile: boolean;
}

function StatCard({ label, value, color, mobile }: StatCard) {
  return (
    <Card
      sx={
        mobile
          ? { flex: "0 0 auto", minWidth: 122, scrollSnapAlign: "start" }
          : { flex: 1, minWidth: 130 }
      }
    >
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const rowSx: SxProps<Theme> = isMobile
    ? {
        display: "flex",
        gap: 1,
        mb: 1.5,
        overflowX: "auto",
        scrollSnapType: "x proximity",
        pb: 0.5,
        mx: -1,
        px: 1,
        "&::-webkit-scrollbar": { height: 3 },
      }
    : { display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap" };

  if (loading || !stats) {
    return (
      <Box sx={rowSx}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            width={isMobile ? 122 : 150}
            height={60}
            sx={isMobile ? { flex: "0 0 auto" } : { flex: 1, minWidth: 130 }}
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
    <Box sx={rowSx}>
      <StatCard
        mobile={isMobile}
        label="Загальна кількість"
        value={fmt(stats.total_items)}
        color="#e6edf3"
      />
      <StatCard
        mobile={isMobile}
        label="Загальна сума"
        value={`${fmtMoney(stats.total_value)} ₴`}
        color="#58a6ff"
      />
      <StatCard
        mobile={isMobile}
        label="На складі"
        value={fmt(stats.warehouse_items)}
        color="#3fb950"
      />
      <StatCard
        mobile={isMobile}
        label="Видано"
        value={fmt(stats.issued_items)}
        color="#58a6ff"
      />
      <StatCard
        mobile={isMobile}
        label="Повернуто"
        value={fmt(stats.returned_items)}
        color="#d29922"
      />
      <StatCard
        mobile={isMobile}
        label="Списано"
        value={fmt(stats.written_off_items)}
        color="#8b949e"
      />
    </Box>
  );
}
