import express, { Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { uploadToSupabase } from '../lib/upload';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// ─── Public: get all sections ───
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.siteContent.findMany();
    const result: Record<string, any> = {};
    for (const row of rows) {
      result[row.section] = row.data;
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching site content:', error);
    res.status(500).json({ error: 'Failed to fetch site content' });
  }
});

// ─── Public: get single section ───
router.get('/:section', async (req: Request, res: Response) => {
  try {
    const row = await prisma.siteContent.findUnique({
      where: { section: req.params.section },
    });
    if (!row) {
      return res.status(404).json({ error: 'Section not found' });
    }
    res.json(row.data);
  } catch (error) {
    console.error('Error fetching section:', error);
    res.status(500).json({ error: 'Failed to fetch section' });
  }
});

// ─── Admin: upsert a section ───
router.put('/admin/:section', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { section } = req.params;
    const data = req.body;

    const row = await prisma.siteContent.upsert({
      where: { section },
      update: { data },
      create: { section, data },
    });

    res.json({ message: 'Section saved', section: row.section });
  } catch (error) {
    console.error('Error saving section:', error);
    res.status(500).json({ error: 'Failed to save section' });
  }
});

// ─── Admin: upload image for a section ───
router.post(
  '/admin/:section/upload',
  authenticateToken,
  requireAdmin,
  upload.single('image'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const { section } = req.params;
      const url = await uploadToSupabase(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        `site-content/${section}`
      );

      res.json({ url });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

export default router;
