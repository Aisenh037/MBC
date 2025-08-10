// src/components/UI/NotificationProvider.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";

const NotificationContext = createContext(null);
export const useNotify = () => useContext(NotificationContext);

export default function NotificationProvider({ children }) {
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", type: "info" });

  const notify = useCallback((msg, type = "info") => {
    setSnackbar({ open: true, msg, type });
  }, []);
  
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleClose} 
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleClose} severity={snackbar.type} sx={{ width: "100%" }} variant="filled">
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}