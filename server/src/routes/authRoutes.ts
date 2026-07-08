import { Router } from 'express';
import multer from 'multer';
import { signup, login, getMe, updateProfile } from '../controllers/authController';
import { protect } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpg|jpeg|png|gif|webp/;
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    cb(null, allowed.test(ext));
  },
});

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('avatar'), updateProfile);

export default router;