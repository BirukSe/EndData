import express from 'express';
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const router = express.Router();
const db = new pg.Client({
    connectionString: process.env.DATABASE_URL, // Use the DATABASE_URL from .env
});

// Connect to the database
db.connect()
    .then(() => console.log("Connected to the database!"))
    .catch(err => console.error('Database connection error:', err));

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await db.query("SELECT * FROM clients WHERE username=$1", [username]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                res.json(user);
            } else {
                res.status(401).json({ message: "Invalid credentials" });
            }
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
router.post('/messages', async (req, res) => {
    const { room, author, message, time, recipient } = req.body;

    try {
        const query = `
            INSERT INTO messages (room, author, message, time, recipient) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        const result = await db.query(query, [room, author, message, time, recipient]);
        res.status(201).json(result.rows[0]); // Return the saved message
    } catch (error) {
        console.error("Error saving message:", error);
        res.status(500).json({ message: "Failed to save message" });
    }
});
router.get('/messages/:room', async (req, res) => {
    const { room } = req.params;

    try {
        const query = 'SELECT * FROM messages WHERE room = $1 ORDER BY time ASC';
        const result = await db.query(query, [room]);
        res.json(result.rows); // Return the list of messages
    } catch (error) {
        console.error("Error retrieving messages:", error);
        res.status(500).json({ message: "Failed to retrieve messages" });
    }
});
// Users endpoint to fetch all users
router.get('/users', async (req, res) => {
    try {
        const result = await db.query("SELECT username FROM clients"); // Only select the username
        res.json(result.rows); // This will return an array of objects with usernames
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: "Server error" });
    }
});



// Signup route
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await db.query("SELECT * FROM clients WHERE username=$1", [username]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query("INSERT INTO clients (username, password) VALUES ($1, $2) RETURNING *", [username, hashedPassword]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
