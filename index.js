
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import router from './database.js';

const app = express();
app.use(cors());

app.use(express.json());
app.use(router);


app.use(express.json()); // Use express built-in JSON middleware
app.use(router);

// 

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://messenger-teal-chi.vercel.app", // Make sure to use the correct protocol
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

    // socket.on("send_private_message", (data) => {
    //     console.log("Attempting to send private message to:", data.recipient);
    //     const recipientSocketId = users[data.recipient];
    //     if (recipientSocketId) {
    //         io.to(recipientSocketId).emit("receive_private_message", data);
    //         console.log("Message sent to:", data.recipient);
    //     } else {
    //         console.log(`User ${data.recipient} not found. Current users:`, users);
    //     }
    // });
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
// // import express from 'express';
// // import http from 'http';
// // import { Server } from 'socket.io';
// // import cors from 'cors';
// // import pg from 'pg';
// // import bcrypt from 'bcrypt';
// // import dotenv from 'dotenv';

// // dotenv.config(); // Load environment variables

// // const app = express();
// // const db = new pg.Client({
// //     connectionString: process.env.DATABASE_URL,
// // });

// // // Connect to the database
// // db.connect()
// //     .then(() => console.log("Connected to the database!"))
// //     .catch(err => console.error('Database connection error:', err));

// // app.use(cors());
// // app.use(express.json()); // Use express built-in JSON middleware

// // // Login route
// // app.post('/login', async (req, res) => {
// //     const { username, password } = req.body;

// //     try {
// //         const result = await db.query("SELECT * FROM clients WHERE username=$1", [username]);

// //         if (result.rows.length > 0) {
// //             const user = result.rows[0];
// //             const match = await bcrypt.compare(password, user.password);
// //             if (match) {
// //                 res.json(user);
// //             } else {
// //                 res.status(401).json({ message: "Invalid credentials" });
// //             }
// //         } else {
// //             res.status(404).json({ message: "User not found" });
// //         }
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({ message: "Server error" });
// //     }
// // });

// // // Signup route
// // app.post('/signup', async (req, res) => {
// //     const { username, password } = req.body;

// //     try {
// //         const existingUser = await db.query("SELECT * FROM clients WHERE username=$1", [username]);
// //         if (existingUser.rows.length > 0) {
// //             return res.status(409).json({ message: "User already exists" });
// //         }

// //         const hashedPassword = await bcrypt.hash(password, 10);
// //         const result = await db.query("INSERT INTO clients (username, password) VALUES ($1, $2) RETURNING *", [username, hashedPassword]);
// //         res.status(201).json(result.rows[0]);
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({ message: "Server error" });
// //     }
// // });

// // // Socket.IO setup

