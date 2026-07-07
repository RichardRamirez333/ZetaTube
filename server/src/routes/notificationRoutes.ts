import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
} from '../controllers/notificationController';

const router = Router();

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/mark-read', protect, markRead);
router.put('/mark-all-read', protect, markAllRead);

export default router;
