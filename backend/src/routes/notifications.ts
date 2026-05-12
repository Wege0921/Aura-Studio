import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Store push notification subscriptions
const subscriptions: Map<string, any> = new Map();

// Subscribe to push notifications
router.post('/subscribe', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subscription } = req.body;
    const userId = req.user?.id;

    if (!userId || !subscription) {
      return res.status(400).json({ error: 'User ID and subscription are required' });
    }

    // Store subscription (in production, store in database)
    subscriptions.set(userId, subscription);

    res.json({ message: 'Successfully subscribed to notifications' });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    res.status(500).json({ error: 'Failed to subscribe to notifications' });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    subscriptions.delete(userId);

    res.json({ message: 'Successfully unsubscribed from notifications' });
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from notifications' });
  }
});

// Send push notification to a specific user
router.post('/send', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'User ID, title, and body are required' });
    }

    const subscription = subscriptions.get(userId);
    if (!subscription) {
      return res.status(404).json({ error: 'User not subscribed to notifications' });
    }

    // In production, use a proper push service like Firebase Cloud Messaging
    // For now, we'll just simulate the notification
    console.log(`Push notification sent to user ${userId}:`, { title, body, data });

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send broadcast notification to all users
router.post('/broadcast', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Send to all subscribed users
    let sentCount = 0;
    for (const [userId, subscription] of subscriptions) {
      console.log(`Broadcast notification sent to user ${userId}:`, { title, body, data });
      sentCount++;
    }

    res.json({ 
      message: 'Broadcast notification sent successfully',
      sentCount 
    });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({ error: 'Failed to send broadcast notification' });
  }
});

// Get notification preferences for a user
router.get('/preferences', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // In production, store preferences in database
    const preferences = {
      bookingReminders: true,
      classReminders: true,
      paymentConfirmations: true,
      promotionalOffers: false,
      newsletter: false
    };

    res.json(preferences);
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

// Update notification preferences for a user
router.put('/preferences', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const preferences = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // In production, store preferences in database
    console.log(`Updated notification preferences for user ${userId}:`, preferences);

    res.json({ message: 'Notification preferences updated successfully' });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

export default router;
