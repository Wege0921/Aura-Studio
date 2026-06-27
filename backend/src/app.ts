import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import classesRoutes from './routes/classes';
import bookingsRoutes from './routes/bookings';
import packagesRoutes from './routes/packages';
import paymentsRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import usersRoutes from './routes/users';
import notificationsRoutes from './routes/notifications';
import waitlistRoutes from './routes/waitlist';
import contactRoutes from './routes/contact';
import reviewsRoutes from './routes/reviews';

dotenv.config();

const app = express();

// Ensure uploads directory exists (skip on read-only filesystems like Vercel)
const uploadsDir = path.join(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('Could not create uploads directory:', err);
}

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS - restrict to frontend origin in production
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'AURA Studio API Server is running!' });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const { prisma } = await import('./lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', timestamp: new Date().toISOString(), database: 'connected' });
  } catch {
    res.status(503).json({ status: 'DEGRADED', timestamp: new Date().toISOString(), database: 'disconnected' });
  }
});

// Serve React build static files in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../../build');
  app.use(express.static(buildPath));

  // SPA catch-all: serve index.html for non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(buildPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
} else {
  // 404 handler for dev
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}

export default app;
