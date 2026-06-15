import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';

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
    // Verify token with Supabase
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Look up app profile in Prisma
    const select = { id: true, email: true, role: true };
    let user = await prisma.user.findUnique({
      where: { id: authData.user.id },
      select,
    });

    // Fall back to email lookup (handles seeded profiles with hardcoded ids)
    if (!user) {
      const email = authData.user.email || '';
      if (email) {
        const byEmail = await prisma.user.findUnique({ where: { email }, select });
        if (byEmail) {
          user = await prisma.user.update({
            where: { email },
            data: { id: authData.user.id },
            select,
          });
        }
      }
    }

    // If still not found, create a new profile from Supabase metadata
    if (!user) {
      const metadata = authData.user.user_metadata || {};
      user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email: authData.user.email || metadata.email || '',
          name: metadata.name || metadata.full_name || 'User',
          phone: metadata.phone || null,
          role: metadata.role || 'USER',
        },
        select,
      });
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

// Token generation is now handled by Supabase Auth.
// These exports are kept for compatibility with any existing imports,
// but they should not be used. Use Supabase sessions instead.
export const generateAccessToken = (_userId: string) => {
  throw new Error('generateAccessToken is deprecated. Use Supabase Auth instead.');
};

export const generateRefreshToken = (_userId: string) => {
  throw new Error('generateRefreshToken is deprecated. Use Supabase Auth instead.');
};

export const generateToken = (_userId: string) => {
  throw new Error('generateToken is deprecated. Use Supabase Auth instead.');
};
