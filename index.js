const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
app.use(cors());

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    }
});

io.on("connection", (socket) => {
    socket.on("join_room", (room) => {
        socket.join(room);
        console.log(`User: ${socket.id} joined room: ${room}`);
    });

    socket.on("send_message", (data) => {
        console.log("Message received:", data); // Log the message data
        socket.to(data.room).emit("receive_message", data);
    });

    socket.on("disconnect", () => {
        console.log(`User: ${socket.id} disconnected`);
    });
});

server.listen(3001, () => {
    console.log("Server listening on port 3001");
});
