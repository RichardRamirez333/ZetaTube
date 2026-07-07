import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth';

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = await User.create({ username, email, password: hashed });
    const token = generateToken(String(user._id));
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      subscribers: user.subscribers,
      subscriptions: user.subscriptions,
      token,
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ message: err.message || 'Server error during signup' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const token = generateToken(String(user._id));
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      subscribers: user.subscribers,
      subscriptions: user.subscriptions,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Server error during login' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const { username, email, bio, currentPassword, newPassword } = req.body;

    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) { res.status(400).json({ message: 'Username taken' }); return; }
      user.username = username;
    }
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) { res.status(400).json({ message: 'Email taken' }); return; }
      user.email = email;
    }
    if (bio !== undefined) user.bio = bio;
    if (req.file) user.avatar = `/uploads/${req.file.filename}`;

    if (currentPassword && newPassword) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) { res.status(400).json({ message: 'Current password is wrong' }); return; }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      subscribers: user.subscribers,
      subscriptions: user.subscriptions,
      token: generateToken(String(user._id)),
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
