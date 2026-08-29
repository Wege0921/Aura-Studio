import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { supabase, supabaseAuth } from '../lib/supabase';
import { authenticateToken } from '../middleware/auth';
import { ensureUserProfile } from '../lib/userProfile';
import { getFrontendUrl } from '../lib/frontendUrl';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register
router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 2 }),
  body('password').isLength({ min: 6 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, name, password, phone } = req.body;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone },
    });

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Registration failed' });
    }

    // Create Prisma profile
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        name,
        phone: phone || null,
        role: 'USER',
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    // Sign in to get session tokens
    const { data: sessionData, error: sessionError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError || !sessionData.session) {
      return res.status(201).json({
        message: 'User created successfully. Please sign in.',
        user,
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      user,
      token: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user || !authData.session) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Ensure Prisma profile exists
    const user = await ensureUserProfile(authData.user);

    res.json({
      message: 'Login successful',
      user,
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user (uses authenticateToken middleware with token cache)
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // The middleware already verified the token and loaded the user profile.
    // Fetch the full profile to include all fields the frontend expects.
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user profile
router.patch('/me', authenticateToken, [
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Valid phone number required'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.id;
    const { name, email, phone } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Email is already taken' });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });

    res.json({ user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', async (_req: Request, res: Response) => {
  // Supabase sessions are invalidated client-side; backend just acknowledges.
  res.json({ message: 'Logged out successfully' });
});

// Refresh access token using Supabase refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const { data, error } = await supabaseAuth.auth.refreshSession(refreshToken);

    if (error || !data.session) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// Forgot password — delegate to Supabase
router.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // In a real app, set the redirect URL to your frontend reset-password page
    const redirectUrl = `${getFrontendUrl()}/reset-password`;

    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Supabase forgot password error:', error);
    }

    // Always return success to avoid email enumeration
    res.json({ message: 'If an account exists, a reset email has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
