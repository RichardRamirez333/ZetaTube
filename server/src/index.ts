import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import videoRoutes from './routes/videoRoutes';
import commentRoutes from './routes/commentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import playlistRoutes from './routes/playlistRoutes';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const app = express();

let dbConnected = false;

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.use(rateLimit({ windowMs: 60 * 1000, max: 150, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many requests' } }));
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const requireDB = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!dbConnected) {
    res.status(503).json({ message: 'Database connecting...' });
    return;
  }
  next();
};

app.use('/api/auth', requireDB, authRoutes);
app.use('/api/videos', requireDB, videoRoutes);
app.use('/api/comments', requireDB, commentRoutes);
app.use('/api/notifications', requireDB, notificationRoutes);
app.use('/api/playlists', requireDB, playlistRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: dbConnected ? 'ok' : 'connecting' });
});

// Production static file serving
if (process.env.NODE_ENV === 'production') {
  const cp = path.join(__dirname, '..', '..', 'client', 'dist');
  const indexPath = path.join(cp, 'index.html');
  console.log('Static path:', cp);
  console.log('index.html exists:', fs.existsSync(indexPath));
  app.use(express.static(cp));
  app.get('*', (_req, res) => {
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send('<html><body><h1>ZETAtube</h1><p>App is running</p></body></html>');
    }
  });
}

const PORT = process.env.PORT || 5000;
console.log('Starting on port', PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '[set]' : '[not set]');

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
  connectDB();
});

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); return; }
  for (let i = 0; i < 10; i++) {
    try {
      await mongoose.connect(uri);
      dbConnected = true;
      console.log('MongoDB connected');
      return;
    } catch (err: any) {
      console.error(`DB attempt ${i + 1}/10:`, err.message);
      if (i < 9) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  console.error('All DB attempts failed');
}