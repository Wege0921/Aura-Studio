import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { findUserByEmail } from '../mocks/mockAuth';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Try database first
    let user = null;
    
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true }
      });
    } catch (dbError) {
      console.error('Database error in auth middleware:', dbError);
    }

    // If database user not found, fall back to mock authentication
    if (!user) {
      console.log('Database user not found, checking mock users for:', decoded.userId);
      // For mock users, we need to find by ID, but our mock only has email lookup
      // So we'll check if it's one of our known mock users by ID
      const mockUsers = [
        { id: 'admin-1', email: 'admin@aura-yoga.com', role: 'ADMIN' },
        { id: 'user-1', email: 'user@aura-yoga.com', role: 'USER' },
        { id: 'instructor-1', email: 'instructor@aura-yoga.com', role: 'USER' }
      ];
      
      user = mockUsers.find(u => u.id === decoded.userId);
      
      if (user) {
        console.log('Using mock user:', user);
      }
    }

    if (!user) {
      console.log('No user found for ID:', decoded.userId);
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};
