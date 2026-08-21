import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import StorageIcon from "@mui/icons-material/Storage";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import InventoryIcon from "@mui/icons-material/Inventory2";
import DeleteIcon from "@mui/icons-material/Delete";
import BackupIcon from "@mui/icons-material/Backup";
import ArticleIcon from "@mui/icons-material/Article";
import { useLocation, useNavigate } from "react-router-dom";
import type { DatabaseInfo } from "../api/databases";

interface Props {
  currentDb: DatabaseInfo;
  onSwitchDb: () => void;
}

const NAV_ITEMS = [
  { to: "/", label: "Інвентар", icon: InventoryIcon },
  { to: "/trash", label: "Кошик", icon: DeleteIcon },
  { to: "/backups", label: "Резервні копії", icon: BackupIcon },
  { to: "/logs", label: "Журнал подій", icon: ArticleIcon },
  { to: "/settings", label: "Налаштування", icon: SettingsIcon },
];

export default function TopBar({ currentDb, onSwitchDb }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [navOpen, setNavOpen] = useState(false);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "#161b22",
        borderBottom: "1px solid #30363d",
        zIndex: 1200,
      }}
    >
      <Toolbar sx={{ minHeight: 48, px: { xs: 1, sm: 2 }, gap: { xs: 0.5, sm: 0 } }}>
        {isMobile && (
          <IconButton
            size="small"
            onClick={() => setNavOpen(true)}
            sx={{ color: "text.secondary", mr: 0.5 }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        )}

        <StorageIcon sx={{ mr: 1, color: "primary.main", fontSize: 20 }} />
        <Typography
          variant="subtitle1"
          sx={{
            cursor: "pointer",
            letterSpacing: 0.3,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
          onClick={() => navigate("/")}
        >
          {isMobile ? "IZI Staff" : "Система управління інвентарем"}
        </Typography>

        {/* Поточна база */}
        <Tooltip title="Змінити базу даних">
          <Button
            size="small"
            onClick={onSwitchDb}
            startIcon={<SwapHorizIcon sx={{ fontSize: 15 }} />}
            sx={{
              ml: { xs: 1, sm: 2 },
              px: 1.5,
              py: 0.25,
              fontSize: 12,
              color: "#f0883e",
              bgcolor: "#f0883e15",
              border: "1px solid #f0883e33",
              borderRadius: 1,
              textTransform: "none",
              maxWidth: { xs: 96, sm: 220 },
              minWidth: 0,
              "&:hover": { bgcolor: "#f0883e25" },
              "& .MuiButton-startIcon": { mr: { xs: 0.5, sm: 1 } },
            }}
          >
            <Box
              component="span"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentDb.name}
            </Box>
          </Button>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        {!isMobile && (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Налаштування">
              <IconButton
                size="small"
                onClick={() => navigate("/settings")}
                sx={{ color: "text.secondary" }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Toolbar>

      <Drawer anchor="left" open={navOpen} onClose={() => setNavOpen(false)}>
        <Box
          sx={{
            width: 260,
            height: "100%",
            bgcolor: "#161b22",
            display: "flex",
            flexDirection: "column",
          }}
          role="presentation"
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 2 }}>
            <StorageIcon sx={{ color: "primary.main", fontSize: 22 }} />
            <Typography sx={{ fontWeight: 700 }}>IZI Staff</Typography>
          </Box>
          <Divider sx={{ borderColor: "#30363d" }} />
          <List sx={{ py: 1 }}>
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <ListItemButton
                  key={to}
                  selected={active}
                  onClick={() => {
                    navigate(to);
                    setNavOpen(false);
                  }}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    "&.Mui-selected": {
                      bgcolor: "#1f2d3d",
                      color: "#58a6ff",
                      "& .MuiListItemIcon-root": { color: "#58a6ff" },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    slotProps={{ primary: { sx: { fontSize: 14 } } }}
                  />
                </ListItemButton>
              );
            })}
          </List>
          <Box sx={{ mt: "auto", p: 2 }}>
            <Divider sx={{ borderColor: "#30363d", mb: 1.5 }} />
            <Button
              fullWidth
              size="small"
              onClick={() => {
                setNavOpen(false);
                onSwitchDb();
              }}
              startIcon={<SwapHorizIcon sx={{ fontSize: 15 }} />}
              sx={{
                color: "#f0883e",
                bgcolor: "#f0883e15",
                border: "1px solid #f0883e33",
                textTransform: "none",
                justifyContent: "flex-start",
                "&:hover": { bgcolor: "#f0883e25" },
              }}
            >
              База: {currentDb.name}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}
