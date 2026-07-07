import { Response } from 'express';
import Comment from '../models/Comment';
import Video from '../models/Video';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { text, parentComment } = req.body;
    const comment = await Comment.create({
      userId: req.user!.id,
      videoId: req.params.videoId,
      text,
      parentComment: parentComment || null,
    });
    const video = await Video.findById(req.params.videoId);
    if (video && video.userId.toString() !== req.user!.id) {
      const user = await User.findById(req.user!.id);
      await Notification.create({
        recipient: video.userId,
        sender: req.user!.id,
        type: 'comment',
        video: video._id,
        message: `${user!.username} commented on your video "${video.title}"`,
      });
    }
    const populated = await comment.populate('userId', 'username avatar');
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const sortOption: Record<string, 1 | -1> = req.query.sort === 'newest' ? { createdAt: -1 } : { likes: -1, createdAt: -1 };
    const comments = await Comment.find({ videoId: req.params.videoId, parentComment: null })
      .populate('userId', 'username avatar')
      .sort(sortOption);
    const commentIds = comments.map((c) => c._id);
    const replies = await Comment.find({ parentComment: { $in: commentIds } })
      .populate('userId', 'username avatar')
      .sort({ createdAt: 1 });
    res.json({ comments, replies });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const editComment = async (req: AuthRequest, res: Response) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) { res.status(404).json({ message: 'Comment not found' }); return; }
    if (comment.userId.toString() !== req.user!.id) {
      res.status(403).json({ message: 'Not authorized' }); return;
    }
    comment.text = req.body.text;
    await comment.save();
    const populated = await comment.populate('userId', 'username avatar');
    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) { res.status(404).json({ message: 'Comment not found' }); return; }
    if (comment.userId.toString() !== req.user!.id) {
      res.status(403).json({ message: 'Not authorized' }); return;
    }
    await Comment.deleteMany({ parentComment: comment._id });
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const likeComment = async (req: AuthRequest, res: Response) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) { res.status(404).json({ message: 'Comment not found' }); return; }
    const userId = req.user!.id;
    const liked = comment.likes.find((id) => id.toString() === userId);
    if (liked) {
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
    } else {
      comment.likes.push(userId as any);
      comment.dislikes = comment.dislikes.filter((id) => id.toString() !== userId);
    }
    await comment.save();
    res.json({ likes: comment.likes.length, dislikes: comment.dislikes.length, liked: !liked });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
