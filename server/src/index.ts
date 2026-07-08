import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import videoRoutes from './routes/videoRoutes';
import commentRoutes from './routes/commentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import playlistRoutes from './routes/playlistRoutes';

dotenv.config();

// Global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const app = express();

let dbConnected = false;

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, try again later' },
});

app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const requireDB = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!dbConnected) {
    res.status(503).json({ message: 'Database not connected. Please wait for server to start.' });
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

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
  console.log('Serving static files from:', clientDistPath);
  app.use(express.static(clientDistPath));
  
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).json({ message: 'Static files not found' });
      }
    });
  });
}

const PORT = process.env.PORT || 5000;

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '[set]' : '[not set]');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB().catch((err) => console.error('connectDB error:', err));
});

async function connectDB(retries = 10, delay = 3000) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set — server running without database');
    return;
  }
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(uri);
      dbConnected = true;
      console.log('MongoDB connected');
      return;
    } catch (err: any) {
      console.error(`MongoDB attempt ${i + 1}/${retries}:`, err.message);
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error('All MongoDB attempts failed. Server running without DB.');
      }
    }
  }
}