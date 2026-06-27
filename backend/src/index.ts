import app from './app';
import { PackageExpiryScheduler } from './schedulers/packageExpiryScheduler';

const PORT = process.env.PORT || 5000;

// Only start the server and scheduler if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  // Initialize package expiry scheduler
  const scheduler = PackageExpiryScheduler.getInstance();
  scheduler.start();

  app.listen(PORT, () => {
    console.log(`AURA Studio API server running on port ${PORT}`);
    console.log('Package expiry scheduler initialized');
    console.log(`📡 Health check available at http://localhost:${PORT}/health`);
  });
}

export default app;
