import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import { PackageExpiryScheduler } from './schedulers/packageExpiryScheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'AURA Yoga API Server is running!' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize package expiry scheduler
const scheduler = PackageExpiryScheduler.getInstance();
scheduler.start();

app.listen(PORT, () => {
  console.log(`🧘‍♀️ AURA Yoga API server running on port ${PORT}`);
  console.log('Package expiry scheduler initialized');
  console.log(`📡 Health check available at http://localhost:${PORT}/health`);
});

export default app;
