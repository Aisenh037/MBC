// src/components/UI/NotificationProvider.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

type NotifyFunction = (msg: string, type?: AlertColor) => void;

interface NotificationProviderProps {
  children: React.ReactNode;
}

interface SnackbarState {
  open: boolean;
  msg: string;
  type: AlertColor;
}

const NotificationContext = createContext<NotifyFunction | null>(null);

export const useNotify = (): NotifyFunction => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotify must be used within a NotificationProvider');
  }
  return context;
};

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({ 
    open: false, 
    msg: "", 
    type: "info" 
  });

  const notify = useCallback<NotifyFunction>((msg: string, type: AlertColor = "info") => {
    setSnackbar({ open: true, msg, type });
  }, []);
  
  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string): void => {
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
        <Alert 
          onClose={handleClose} 
          severity={snackbar.type} 
          sx={{ width: "100%" }} 
          variant="filled"
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;