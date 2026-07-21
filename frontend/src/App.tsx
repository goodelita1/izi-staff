import { useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import { theme } from "./utils/theme";
import AppLayout from "./layouts/AppLayout";
import InventoryPage from "./pages/InventoryPage";
import TrashPage from "./pages/TrashPage";
import BackupsPage from "./pages/BackupsPage";
import SettingsPage from "./pages/SettingsPage";
import LogsPage from "./pages/LogsPage";
import DatabaseSelectPage from "./pages/DatabaseSelectPage";
import type { DatabaseInfo } from "./api/databases";

const DB_KEY = "izi_selected_db";

function loadSelected(): DatabaseInfo | null {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? (JSON.parse(raw) as DatabaseInfo) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [selectedDb, setSelectedDb] = useState<DatabaseInfo | null>(loadSelected);

  const handleSelect = (db: DatabaseInfo) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    setSelectedDb(db);
  };

  const handleSwitch = () => {
    localStorage.removeItem(DB_KEY);
    setSelectedDb(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!selectedDb ? (
        <DatabaseSelectPage onSelect={handleSelect} />
      ) : (
        <Routes>
          <Route element={<AppLayout currentDb={selectedDb} onSwitchDb={handleSwitch} />}>
            <Route path="/" element={<InventoryPage />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="/backups" element={<BackupsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/logs" element={<LogsPage />} />
          </Route>
        </Routes>
      )}
    </ThemeProvider>
  );
}
