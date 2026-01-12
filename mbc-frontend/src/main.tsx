import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import App from "./App";
import ThemeProvider from "./theme/ThemeProvider";
import NotificationProvider from "./components/UI/NotificationProvider";
import { queryClient } from "./queryClient";
import "./index.css";

// Auth state initialization is handled by useAuthStore and persist middleware

// Create a custom BrowserRouter with future flags enabled
interface CustomBrowserRouterProps {
  children: React.ReactNode;
}

const CustomBrowserRouter: React.FC<CustomBrowserRouterProps> = ({ children }) => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {children}
    </BrowserRouter>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CustomBrowserRouter>
        <ThemeProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </ThemeProvider>
      </CustomBrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);