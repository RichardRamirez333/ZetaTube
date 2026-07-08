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

const app = express();

// Track DB connection status
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

// Middleware to block requests if DB is down
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

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDistPath));
  
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

console.log('Environment:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '[set]' : '[not set]');
console.log('B2_KEY_ID:', process.env.B2_KEY_ID ? '[set]' : '[not set]');
console.log('B2_BUCKET_NAME:', process.env.B2_BUCKET_NAME || 'zetatube (default)');

// Start server immediately, then connect to DB
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});

async function connectDB(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube-clone');
      dbConnected = true;
      console.log('MongoDB connected');
      return;
    } catch (err: any) {
      console.error(`MongoDB connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error('All MongoDB connection attempts failed. Server running without DB.');
        console.error('Set MONGODB_URI environment variable and restart.');
      }
    }
  }
}