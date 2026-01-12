// src/components/UI/RealTimeNotifier.tsx
import { useEffect } from "react";
import { useNotify } from "./NotificationProvider";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../../stores/authStore";

interface NoticeData {
  title: string;
  message?: string;
}

interface NotificationData {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

const RealTimeNotifier: React.FC = () => {
  const notify = useNotify();
  const { user } = useAuthStore();

  useEffect(() => {
    // Only connect if the user is logged in
    if (!user) return;

    // Connect to the Socket.IO server using the VITE variable
    const socket: Socket = io(import.meta.env.VITE_API_URL || '', {
      withCredentials: true,
    });
    
    // Listen for general notices
    socket.on("notice", (notice: NoticeData) => {
      notify(`New Notice: ${notice.title}`, "info");
    });
    
    // Listen for user-specific notifications
    socket.on(`notification:${user.id}`, (notification: NotificationData) => {
      notify(notification.message, notification.type || 'success');
    });

    return () => {
      socket.disconnect();
    };
  }, [notify, user]);

  return null; // This component does not render anything
};

export default RealTimeNotifier;