import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback') as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch {
    res.status(401).json({ message: 'Token failed or expired' });
  }
};
