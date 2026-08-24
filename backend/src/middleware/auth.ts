import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { ensureUserProfile } from '../lib/userProfile';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

// Short-TTL in-memory cache of token -> resolved app user.
// Avoids hitting Supabase Auth (network) + Prisma on every single request.
// On warm serverless instances this turns repeated calls (e.g. the 3 parallel
// admin-dashboard requests) into instant cache hits.
const TOKEN_CACHE_TTL_MS = 60 * 1000; // 60 seconds
const tokenCache = new Map<string, { user: AuthUser; expiresAt: number }>();

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Fast path: serve from cache if the token was recently verified
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    req.user = cached.user;
    return next();
  }

  try {
    // Verify token with Supabase
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Use shared utility to find or create the Prisma user profile
    const user = await ensureUserProfile(authData.user);

    // Return only the fields needed for auth (id, email, role)
    req.user = { id: user.id, email: user.email, role: user.role };

    // Cache the verified user for subsequent requests with the same token
    tokenCache.set(token, { user, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS });
    // Bound the cache: drop expired entries when it grows large
    if (tokenCache.size > 1000) {
      const now = Date.now();
      for (const [key, val] of tokenCache) {
        if (val.expiresAt <= now) tokenCache.delete(key);
      }
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Optional auth: populates req.user when a valid Bearer token is present,
// but continues unauthenticated (req.user === undefined) when absent or invalid.
// Used for endpoints that serve both guest and authenticated users (e.g. shop checkout).
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  // Fast path: serve from cache if the token was recently verified
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    req.user = cached.user;
    return next();
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      // Invalid token on an optional route: continue as guest rather than 403
      return next();
    }

    const user = await ensureUserProfile(authData.user);
    req.user = { id: user.id, email: user.email, role: user.role };

    tokenCache.set(token, { user, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS });
    if (tokenCache.size > 1000) {
      const now = Date.now();
      for (const [key, val] of tokenCache) {
        if (val.expiresAt <= now) tokenCache.delete(key);
      }
    }

    next();
  } catch (error) {
    // Never block an optional-auth route on verification failure
    next();
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
