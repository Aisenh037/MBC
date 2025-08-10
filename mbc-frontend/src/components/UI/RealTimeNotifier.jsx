// src/components/UI/RealTimeNotifier.jsx
import { useEffect } from "react";
import { useNotify } from "./NotificationProvider";
import { io } from "socket.io-client";
import { useAuthStore } from "../../stores/authStore";

export default function RealTimeNotifier() {
  const notify = useNotify();
  const { user } = useAuthStore();

  useEffect(() => {
    // Only connect if the user is logged in
    if (!user) return;

    // Connect to the Socket.IO server using the VITE variable
    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    });
    
    // Listen for general notices
    socket.on("notice", (notice) => {
      notify(`New Notice: ${notice.title}`, "info");
    });
    
    // Listen for user-specific notifications
    socket.on(`notification:${user.id}`, (notification) => {
        notify(notification.message, 'success');
    });

    return () => {
      socket.disconnect();
    };
  }, [notify, user]);

  return null; // This component does not render anything
}