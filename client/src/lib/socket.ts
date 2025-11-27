import { io } from "socket.io-client";

// In a real app, this would point to your actual backend URL
// For this mockup, we'll just point to the current origin
export const socket = io(window.location.origin, {
  path: "/api/socket.io",
  autoConnect: true,
  reconnection: true,
});

// Helper to log events for demonstration
socket.on("connect", () => {
  console.log("Socket connected (mock)");
});

socket.on("connect_error", (err) => {
  console.log("Socket connection error (expected in mockup mode):", err.message);
});
