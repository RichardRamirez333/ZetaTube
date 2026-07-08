import { Response } from 'express';
import mongoose from 'mongoose';
import Video from '../models/Video';
import User from '../models/User';
import Comment from '../models/Comment';
import Notification from '../models/Notification';
import Playlist from '../models/Playlist';
import { AuthRequest } from '../middleware/auth';
import { uploadToB2 } from '../utils/b2';

export const uploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, tags, category, privacy } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const videoFile = files?.video?.[0];
    const thumbFile = files?.thumbnail?.[0];
    
    let videoUrl = '';
    let thumbnailUrl = '';
    
    if (videoFile) {
      const ext = videoFile.originalname.split('.').pop();
      const name = `videos/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
      videoUrl = await uploadToB2(videoFile.buffer, name, videoFile.mimetype);
    }
    if (thumbFile) {
      const ext = thumbFile.originalname.split('.').pop();
      const name = `thumbnails/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
      thumbnailUrl = await uploadToB2(thumbFile.buffer, name, thumbFile.mimetype);
    }
    
    const video = await Video.create({
      userId: req.user!.id,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      category,
      privacy: privacy || 'public',
    });
    const user = await User.findById(req.user!.id);
    for (const sub of user!.subscriptions) {
      if (sub.notifications !== 'none') {
        await Notification.create({
          recipient: sub.channel,
          sender: req.user!.id,
          type: 'upload',
          video: video._id,
          message: `${user!.username} uploaded "${title}"`,
        });
      }
    }
    res.status(201).json(video);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateVideo = async (req: AuthRequest, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) { res.status(404).json({ message: 'Video not found' }); return; }
    if (video.userId.toString() !== req.user!.id) {
      res.status(403).json({ message: 'Not authorized' }); return;
    }
    const { title, description, tags, category, privacy } = req.body;
    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (tags) video.tags = tags.split(',').map((t: string) => t.trim());
    if (category) video.category = category;
    if (privacy) video.privacy = privacy;
    const thumbFile = (req.files as any)?.thumbnail?.[0];
    if (thumbFile) {
      const ext = thumbFile.originalname.split('.').pop();
      const name = `thumbnails/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
      video.thumbnailUrl = await uploadToB2(thumbFile.buffer, name, thumbFile.mimetype);
    }
    await video.save();
    res.json(video);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteVideo = async (req: AuthRequest, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) { res.status(404).json({ message: 'Video not found' }); return; }
    if (video.userId.toString() !== req.user!.id) {
      res.status(403).json({ message: 'Not authorized' }); return;
    }
    await Comment.deleteMany({ videoId: video._id });
    await Notification.deleteMany({ video: video._id });
    await User.updateMany({}, { $pull: { watchLater: video._id, 'watchHistory': { video: video._id } } });
    await Playlist.updateMany({}, { $pull: { videos: video._id } });
    await video.deleteOne();
    res.json({ message: 'Video deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getVideos = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const category = req.query.category as string;
    const query: any = { privacy: 'public' };
    if (category && category !== 'All') query.category = category;
    const total = await Video.countDocuments(query);
    const videos = await Video.find(query)
      .populate('userId', 'username avatar subscribers')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ videos, total, page, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getTrending = async (_req: AuthRequest, res: Response) => {
  try {
    const videos = await Video.find({ privacy: 'public' })
      .populate('userId', 'username avatar subscribers')
      .sort({ views: -1, likes: -1 })
      .limit(20);
    res.json(videos);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getVideo = async (req: AuthRequest, res: Response) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('userId', 'username avatar subscribers bio');
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }
    res.json(video);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const likeVideo = async (req: AuthRequest, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) { res.status(404).json({ message: 'Video not found' }); return; }
    const userId = req.user!.id;
    const liked = video.likes.find((id) => id.toString() === userId);
    const disliked = video.dislikes.find((id) => id.toString() === userId);
    if (liked) {
      video.likes = video.likes.filter((id) => id.toString() !== userId);
    } else {
      video.likes.push(userId as any);
      if (disliked) video.dislikes = video.dislikes.filter((id) => id.toString() !== userId);
      const user = await User.findById(userId);
      if (video.userId.toString() !== userId) {
        await Notification.create({
          recipient: video.userId,
          sender: userId,
          type: 'like',
          video: video._id,
          message: `${user!.username} liked your video "${video.title}"`,
        });
      }
    }
    await video.save();
    res.json({ likes: video.likes.length, dislikes: video.dislikes.length, liked: !liked });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const dislikeVideo = async (req: AuthRequest, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) { res.status(404).json({ message: 'Video not found' }); return; }
    const userId = req.user!.id;
    const liked = video.likes.find((id) => id.toString() === userId);
    const disliked = video.dislikes.find((id) => id.toString() === userId);
    if (disliked) {
      video.dislikes = video.dislikes.filter((id) => id.toString() !== userId);
    } else {
      video.dislikes.push(userId as any);
      if (liked) video.likes = video.likes.filter((id) => id.toString() !== userId);
    }
    await video.save();
    res.json({ likes: video.likes.length, dislikes: video.dislikes.length, disliked: !disliked });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getLikedVideos = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    const videos = await Video.find({ likes: user!._id, privacy: 'public' })
      .populate('userId', 'username avatar subscribers')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(videos);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const searchVideos = async (req: AuthRequest, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) { res.status(400).json({ message: 'Search query required' }); return; }
    const category = req.query.category as string;
    const duration = req.query.duration as string;
    const sort = req.query.sort as string || 'relevance';
    const query: any = {
      privacy: 'public',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ],
    };
    if (category && category !== 'All') query.category = category;
    if (duration === 'short') query.duration = { $lte: 240 };
    else if (duration === 'medium') query.duration = { $gt: 240, $lte: 1200 };
    else if (duration === 'long') query.duration = { $gt: 1200 };
    let sortOption: any = { views: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'popular') sortOption = { views: -1 };
    const videos = await Video.find(query)
      .populate('userId', 'username avatar subscribers')
      .sort(sortOption)
      .limit(20);
    res.json(videos);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const subscribe = async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.params.channelId;
    const user = await User.findById(req.user!.id);
    const channel = await User.findById(channelId);
    if (!channel) { res.status(404).json({ message: 'Channel not found' }); return; }
    const existing = user!.subscriptions.find((s) => s.channel.toString() === channelId);
    if (existing) {
      user!.subscriptions = user!.subscriptions.filter((s) => s.channel.toString() !== channelId);
      channel.subscribers = Math.max(0, channel.subscribers - 1);
    } else {
      user!.subscriptions.push({ channel: channelId as any, notifications: 'all' });
      channel.subscribers += 1;
      await Notification.create({
        recipient: channelId as any,
        sender: req.user!.id,
        type: 'subscribe',
        message: `${user!.username} subscribed to you`,
      });
    }
    await user!.save();
    await channel.save();
    res.json({ subscribed: !existing, subscribers: channel.subscribers, subscriptions: user!.subscriptions });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { channelId, notifications } = req.body;
    const user = await User.findById(req.user!.id);
    const sub = user!.subscriptions.find((s) => s.channel.toString() === channelId);
    if (sub) sub.notifications = notifications;
    await user!.save();
    res.json({ subscriptions: user!.subscriptions });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getSubscribedVideos = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    const channelIds = user!.subscriptions.map((s) => s.channel);
    const videos = await Video.find({ userId: { $in: channelIds }, privacy: 'public' })
      .populate('userId', 'username avatar subscribers')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(videos);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const addWatchHistory = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    const videoId = req.params.id;
    user!.watchHistory = user!.watchHistory.filter((w) => w.video.toString() !== videoId);
    user!.watchHistory.unshift({ video: videoId as any, watchedAt: new Date() });
    if (user!.watchHistory.length > 50) user!.watchHistory.pop();
    await user!.save();
    res.json({ message: 'Added to history' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getWatchHistory = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).populate({
      path: 'watchHistory.video',
      populate: { path: 'userId', select: 'username avatar subscribers' },
    });
    res.json(user!.watchHistory.slice(0, 20));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getChannel = async (req: AuthRequest, res: Response) => {
  try {
    const channel = await User.findById(req.params.channelId).select('-password -email -watchHistory');
    if (!channel) { res.status(404).json({ message: 'Channel not found' }); return; }
    const videos = await Video.find({ userId: channel._id, privacy: 'public' })
      .populate('userId', 'username avatar subscribers')
      .sort({ createdAt: -1 });
    const playlists = await Playlist.find({ userId: channel._id, isPublic: true });
    const subscriberCount = channel.subscribers;
    res.json({ channel: { ...channel.toObject(), subscriberCount }, videos, playlists });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getSuggestedVideos = async (req: AuthRequest, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) { res.status(404).json({ message: 'Video not found' }); return; }
    const suggestions = await Video.find({
      _id: { $ne: video._id },
      privacy: 'public',
      $or: [
        { category: video.category },
        { tags: { $in: video.tags } },
      ],
    })
      .populate('userId', 'username avatar subscribers')
      .sort({ views: -1 })
      .limit(10);
    res.json(suggestions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const clearAllData = async (_req: AuthRequest, res: Response) => {
  try {
    await mongoose.connection.dropDatabase();
    res.json({ message: 'All data cleared' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
