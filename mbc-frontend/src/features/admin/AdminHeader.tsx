import React from "react";
import { Box, Typography, Avatar } from "@mui/material";
import { useAuthStore } from "@/stores/authStore";

export default function AdminHeader() {
    const user = useAuthStore((state) => state.user);

    const displayName = user?.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
        : (user?.email || "Admin");

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 4,
            }}
        >
            <Avatar sx={{ bgcolor: "primary.main" }}>
                {(displayName ? displayName[0] : "A").toUpperCase()}
            </Avatar>
            <Typography variant="h6">Welcome, {displayName}</Typography>
        </Box>
    );
}
