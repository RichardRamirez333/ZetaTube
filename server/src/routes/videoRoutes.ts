import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import {
  uploadVideo,
  updateVideo,
  deleteVideo,
  getVideos,
  getTrending,
  getVideo,
  likeVideo,
  dislikeVideo,
  searchVideos,
  subscribe,
  updateSubscription,
  getSubscribedVideos,
  addWatchHistory,
  getWatchHistory,
  getChannel,
  getSuggestedVideos,
  getLikedVideos,
  clearAllData,
} from '../controllers/videoController';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const videoExt = /mp4|webm|ogg|mkv|avi|mov/;
    const imgExt = /jpg|jpeg|png|gif|webp/;
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    if (file.fieldname === 'video' && videoExt.test(ext)) cb(null, true);
    else if (file.fieldname === 'thumbnail' && imgExt.test(ext)) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

const uploadFields = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

const uploadThumb = upload.fields([{ name: 'thumbnail', maxCount: 1 }]);

const router = Router();

router.get('/trending', getTrending);
router.get('/search', searchVideos);
router.get('/subscriptions/list', protect, getSubscribedVideos);
router.get('/history/me', protect, getWatchHistory);
router.get('/channel/:channelId', getChannel);
router.get('/suggested/:id', getSuggestedVideos);
router.get('/liked/me', protect, getLikedVideos);
router.get('/', getVideos);
router.get('/:id', getVideo);
router.post('/', protect, uploadFields, uploadVideo);
router.put('/:id', protect, uploadThumb, updateVideo);
router.delete('/:id', protect, deleteVideo);
router.post('/subscribe/:channelId', protect, subscribe);
router.put('/subscription/notifications', protect, updateSubscription);
router.post('/:id/like', protect, likeVideo);
router.post('/:id/dislike', protect, dislikeVideo);
router.post('/:id/watch-history', protect, addWatchHistory);
router.post('/admin/clear-all', clearAllData);

export default router;