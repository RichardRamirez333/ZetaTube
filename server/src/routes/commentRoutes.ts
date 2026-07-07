import { Router } from 'express';
import { protect } from '../middleware/auth';
import { addComment, getComments, editComment, deleteComment, likeComment } from '../controllers/commentController';

const router = Router();

router.get('/:videoId', getComments);
router.post('/:videoId', protect, addComment);
router.put('/:id', protect, editComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);

export default router;
