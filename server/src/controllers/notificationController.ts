import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const notifications = await Notification.find({ recipient: req.user!.id })
      .populate('sender', 'username avatar')
      .populate('video', 'title')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { recipient: req.user!.id, _id: { $in: req.body.ids } },
      { read: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ recipient: req.user!.id }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user!.id, read: false });
    res.json({ count });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
