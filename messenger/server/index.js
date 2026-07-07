const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./db');
const { auth, JWT_SECRET } = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (!db.ready) return res.status(503).json({ error: 'Database initializing' });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api', messageRoutes);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.username}`);

  socket.on('join', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('leave', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('message:send', (data) => {
    const { conversationId, content, replyTo } = data;
    const result = db.prepare('INSERT INTO messages (conversation_id, sender_id, content, reply_to) VALUES (?, ?, ?, ?)').run(conversationId, socket.userId, content, replyTo || null);
    const message = db.prepare(`
      SELECT m.*, u.username, u.avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    if (message.reply_to) {
      message.reply_to_message = db.prepare(`
        SELECT m.id, m.content, u.username
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `).get(message.reply_to);
    }

    io.to(`conversation:${conversationId}`).emit('message:new', message);
  });

  socket.on('typing:start', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      conversationId,
      userId: socket.userId,
      username: socket.username
    });
  });

  socket.on('typing:stop', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId: socket.userId
    });
  });

  socket.on('reaction:update', (data) => {
    const { conversationId, messageId, emoji, action, userId, username } = data;
    socket.to(`conversation:${conversationId}`).emit('reaction:update', {
      messageId, emoji, action, userId, username
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Zeta server running on port ${PORT}`);
});
