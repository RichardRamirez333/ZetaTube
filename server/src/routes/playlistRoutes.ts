import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  createPlaylist,
  getMyPlaylists,
  getPlaylist,
  addToPlaylist,
  deletePlaylist,
  toggleWatchLater,
  getWatchLater,
} from '../controllers/playlistController';

const router = Router();

router.get('/watch-later', protect, getWatchLater);
router.post('/watch-later/:videoId', protect, toggleWatchLater);
router.get('/my', protect, getMyPlaylists);
router.get('/:id', getPlaylist);
router.post('/', protect, createPlaylist);
router.post('/:id/add', protect, addToPlaylist);
router.delete('/:id', protect, deletePlaylist);

export default router;
