import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import TopBar from "../components/TopBar";
import type { DatabaseInfo } from "../api/databases";

interface Props {
  currentDb: DatabaseInfo;
  onSwitchDb: () => void;
}

export default function AppLayout({ currentDb, onSwitchDb }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <TopBar currentDb={currentDb} onSwitchDb={onSwitchDb} />
      <Box component="main" sx={{ flex: 1, p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
