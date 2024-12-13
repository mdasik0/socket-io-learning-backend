const express = require('express');
const http = require('http');
const { Server } = require('socket.io'); // Import Socket.IO properly
const cors = require('cors'); // Import CORS middleware

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {       // Correct Socket.IO initialization
    cors: {
      origin: 'http://localhost:5173', // Allowing requests from this origin
      methods: ['GET', 'POST'],        // Allowed HTTP methods
      credentials: true                 // Allow credentials (like cookies)
    }
  });

app.use(cors()); // Use CORS middleware

const users = {}; // Store connected users

// Middleware for serving the frontend (optional for testing)
app.get('/', (req, res) => {
  res.send('Socket.IO Chat Server Running');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user login or registration
  socket.on('register', (userId) => {
    users[userId] = socket.id;
    console.log(`User registered: ${userId}, Socket: ${socket.id}`);
  });

  // Handle private messages
  socket.on('private_message', ({ senderId, recipientId, message }) => {
    const recipientSocketId = users[recipientId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive_message', {
        senderId,
        message,
      });
      console.log(`Message from ${senderId} to ${recipientId}: ${message}`);
    } else {
      io.to(socket.id).emit('user_not_found', { // Emit user_not_found from io
        recipientId,
        message: 'Recipient is not online.',
      });
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    const userId = Object.keys(users).find((key) => users[key] === socket.id);
    if (userId) {
      delete users[userId];
      console.log(`User disconnected: ${userId}`);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
