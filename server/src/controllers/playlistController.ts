import { Response } from 'express';
import Playlist from '../models/Playlist';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const createPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, isPublic } = req.body;
    const playlist = await Playlist.create({
      userId: req.user!.id,
      name,
      description: description || '',
      isPublic: isPublic !== undefined ? isPublic : true,
    });
    await User.findByIdAndUpdate(req.user!.id, { $push: { playlists: playlist._id } });
    res.status(201).json(playlist);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyPlaylists = async (req: AuthRequest, res: Response) => {
  try {
    const playlists = await Playlist.find({ userId: req.user!.id })
      .populate({ path: 'videos', select: 'title thumbnailUrl views duration', perDocumentLimit: 4 })
      .sort({ updatedAt: -1 });
    res.json(playlists);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate({ path: 'videos', populate: { path: 'userId', select: 'username avatar subscribers' } })
      .populate('userId', 'username avatar');
    if (!playlist) { res.status(404).json({ message: 'Playlist not found' }); return; }
    if (!playlist.isPublic && playlist.userId.toString() !== req.user?.id) {
      res.status(403).json({ message: 'Private playlist' }); return;
    }
    res.json(playlist);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const addToPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) { res.status(404).json({ message: 'Playlist not found' }); return; }
    if (playlist.userId.toString() !== req.user!.id) {
      res.status(403).json({ message: 'Not authorized' }); return;
    }
    const videoId = req.body.videoId;
    if (playlist.videos.find((v) => v.toString() === videoId)) {
      playlist.videos = playlist.videos.filter((v) => v.toString() !== videoId);
    } else {
      playlist.videos.push(videoId);
    }
    await playlist.save();
    res.json(playlist);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) { res.status(404).json({ message: 'Playlist not found' }); return; }
    if (playlist.userId.toString() !== req.user!.id) {
      res.status(403).json({ message: 'Not authorized' }); return;
    }
    await User.findByIdAndUpdate(req.user!.id, { $pull: { playlists: playlist._id } });
    await playlist.deleteOne();
    res.json({ message: 'Playlist deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleWatchLater = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    const videoId = req.params.videoId;
    const exists = user!.watchLater.find((v) => v.toString() === videoId);
    if (exists) {
      user!.watchLater = user!.watchLater.filter((v) => v.toString() !== videoId);
    } else {
      user!.watchLater.push(videoId as any);
    }
    await user!.save();
    res.json({ watchLater: user!.watchLater, saved: !exists });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getWatchLater = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).populate({
      path: 'watchLater',
      populate: { path: 'userId', select: 'username avatar subscribers' },
    });
    res.json(user!.watchLater);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
