import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import QrCodeIcon from "@mui/icons-material/QrCode";
import BackupIcon from "@mui/icons-material/Backup";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
  onQR: () => void;
  onRefresh: () => void;
}

export default function InventoryToolbar({
  search,
  onSearchChange,
  onAdd,
  onImport,
  onExport,
  onQR,
  onRefresh,
}: Props) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const searchField = (
    <TextField
      size="small"
      fullWidth
      placeholder="Пошук по всіх полях..."
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "text.secondary", fontSize: 18 }} />
            </InputAdornment>
          ),
          endAdornment: search ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onSearchChange("")}>
                <ClearIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: "#30363d" },
          "&:hover fieldset": { borderColor: "#58a6ff" },
        },
      }}
    />
  );

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", gap: 1, mb: 1.5, alignItems: "center" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>{searchField}</Box>

        <Tooltip title="Оновити">
          <IconButton
            size="small"
            onClick={onRefresh}
            sx={{ color: "text.secondary", border: "1px solid #30363d" }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <IconButton
          size="small"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          sx={{ color: "text.secondary", border: "1px solid #30363d" }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>

        <Menu
          anchorEl={menuAnchor}
          open={!!menuAnchor}
          onClose={() => setMenuAnchor(null)}
          slotProps={{
            paper: { sx: { bgcolor: "#161b22", border: "1px solid #30363d" } },
          }}
        >
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onImport();
            }}
          >
            <ListItemIcon>
              <FileUploadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Імпорт Excel</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onExport();
            }}
          >
            <ListItemIcon>
              <FileDownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Експорт Excel</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onQR();
            }}
          >
            <ListItemIcon>
              <QrCodeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>QR-коди</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              navigate("/backups");
            }}
          >
            <ListItemIcon>
              <BackupIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Резервна копія</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              navigate("/trash");
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: "#f85149" }} />
            </ListItemIcon>
            <ListItemText sx={{ color: "#f85149" }}>Кошик</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        mb: 1.5,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon />}
        onClick={onAdd}
        sx={{ bgcolor: "#238636", "&:hover": { bgcolor: "#2ea043" } }}
      >
        Додати
      </Button>

      <Button
        variant="outlined"
        size="small"
        startIcon={<FileUploadIcon />}
        onClick={onImport}
        sx={{
          borderColor: "#30363d",
          color: "text.secondary",
          "&:hover": { borderColor: "#58a6ff", color: "#58a6ff" },
        }}
      >
        Імпорт Excel
      </Button>

      <Button
        variant="outlined"
        size="small"
        startIcon={<FileDownloadIcon />}
        onClick={onExport}
        sx={{
          borderColor: "#30363d",
          color: "text.secondary",
          "&:hover": { borderColor: "#58a6ff", color: "#58a6ff" },
        }}
      >
        Експорт Excel
      </Button>

      <Button
        variant="outlined"
        size="small"
        startIcon={<QrCodeIcon />}
        onClick={onQR}
        sx={{
          borderColor: "#30363d",
          color: "text.secondary",
          "&:hover": { borderColor: "#58a6ff", color: "#58a6ff" },
        }}
      >
        QR
      </Button>

      <Button
        variant="outlined"
        size="small"
        startIcon={<BackupIcon />}
        onClick={() => navigate("/backups")}
        sx={{
          borderColor: "#30363d",
          color: "text.secondary",
          "&:hover": { borderColor: "#58a6ff", color: "#58a6ff" },
        }}
      >
        Резервна копія
      </Button>

      <Button
        variant="outlined"
        size="small"
        startIcon={<DeleteIcon />}
        onClick={() => navigate("/trash")}
        sx={{
          borderColor: "#30363d",
          color: "text.secondary",
          "&:hover": { borderColor: "#f85149", color: "#f85149" },
        }}
      >
        Кошик
      </Button>

      <Tooltip title="Оновити (F5)">
        <IconButton
          size="small"
          onClick={onRefresh}
          sx={{ color: "text.secondary" }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Box sx={{ flex: 1, minWidth: 200, maxWidth: 360, ml: "auto" }}>
        {searchField}
      </Box>
    </Box>
  );
}
