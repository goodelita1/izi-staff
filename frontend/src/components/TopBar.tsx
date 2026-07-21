import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import StorageIcon from "@mui/icons-material/Storage";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { useNavigate } from "react-router-dom";
import type { DatabaseInfo } from "../api/databases";

interface Props {
  currentDb: DatabaseInfo;
  onSwitchDb: () => void;
}

export default function TopBar({ currentDb, onSwitchDb }: Props) {
  const navigate = useNavigate();

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
      <Toolbar sx={{ minHeight: 48, px: 2 }}>
        <StorageIcon sx={{ mr: 1, color: "primary.main", fontSize: 20 }} />
        <Typography
          variant="subtitle1"
          sx={{ cursor: "pointer", letterSpacing: 0.3, fontWeight: 600 }}
          onClick={() => navigate("/")}
        >
          Система управління інвентарем
        </Typography>

        {/* Поточна база */}
        <Tooltip title="Змінити базу даних">
          <Button
            size="small"
            onClick={onSwitchDb}
            startIcon={<SwapHorizIcon sx={{ fontSize: 15 }} />}
            sx={{
              ml: 2,
              px: 1.5,
              py: 0.25,
              fontSize: 12,
              color: "#f0883e",
              bgcolor: "#f0883e15",
              border: "1px solid #f0883e33",
              borderRadius: 1,
              textTransform: "none",
              "&:hover": { bgcolor: "#f0883e25" },
            }}
          >
            {currentDb.name}
          </Button>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

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
      </Toolbar>
    </AppBar>
  );
}
