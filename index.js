import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import router from './database.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(router);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://messenger-jade-beta.vercel.app/", // Make sure to use the correct protocol
        methods: ["GET", "POST"],
    }
});

// Store connected users
const users = {};

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register a user with their username
    socket.on("register_user", (username) => {
        if (username) {
            users[username] = socket.id;
            console.log(`User registered: ${username} with socket ID: ${socket.id}`);
        } else {
            console.log("Username is undefined");
        }
        console.log("Current users:", users); // Log current users
    });

    socket.on("join_room", (room) => {
        socket.join(room);
        console.log(`User: ${socket.id} joined room: ${room}`);
    });

    // Handle sending messages
    socket.on("send_message", (data) => {
        console.log("Message received:", data);
        socket.to(data.room).emit("receive_message", data); // For group messages
    });

    socket.on("send_private_message", (data) => {
        console.log("Attempting to send private message to:", data.recipient);
        const recipientSocketId = users[data.recipient];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("receive_private_message", data);
            console.log("Message sent to:", data.recipient);
        } else {
            console.log(`User ${data.recipient} not found. Current users:`, users);
        }
    });

    socket.on("disconnect", () => {
        console.log(`User: ${socket.id} disconnected`);
        // Remove the user from the list on disconnect
        for (const username in users) {
            if (users[username] === socket.id) {
                delete users[username];
                console.log(`User ${username} disconnected`);
                break;
            }
        }
        console.log("Current users after disconnect:", users); // Log current users
    });
});

server.listen(3001, () => {
    console.log("Server listening on port 3001");
});
