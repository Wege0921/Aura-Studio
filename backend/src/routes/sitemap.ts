import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

const BASE_URL = process.env.FRONTEND_URL?.split(',')[0]?.trim()?.replace(/\/$/, '') || 'https://aurastudio.et';

router.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      where: { isActive: true, date: { gte: new Date() } },
      select: { id: true, updatedAt: true },
    });

    // Fetch shop products and categories for sitemap inclusion
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: { slug: true, updatedAt: true },
      }),
      prisma.productCategory.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const staticPages = [
      { loc: `${BASE_URL}/`, priority: 1.0, changefreq: 'weekly' },
      { loc: `${BASE_URL}/classes`, priority: 0.9, changefreq: 'daily' },
      { loc: `${BASE_URL}/packages`, priority: 0.8, changefreq: 'weekly' },
      { loc: `${BASE_URL}/shop`, priority: 0.9, changefreq: 'daily' },
      { loc: `${BASE_URL}/contact`, priority: 0.6, changefreq: 'monthly' },
    ];

    const classUrls = classes.map((c) => ({
      loc: `${BASE_URL}/classes/${c.id}`,
      lastmod: c.updatedAt.toISOString(),
      priority: 0.7,
      changefreq: 'daily' as const,
    }));

    const productUrls = products.map((p) => ({
      loc: `${BASE_URL}/shop/products/${p.slug}`,
      lastmod: p.updatedAt.toISOString(),
      priority: 0.8,
      changefreq: 'weekly' as const,
    }));

    const categoryUrls = categories.map((c) => ({
      loc: `${BASE_URL}/shop?category=${c.slug}`,
      lastmod: c.updatedAt.toISOString(),
      priority: 0.7,
      changefreq: 'weekly' as const,
    }));

    const urls = [...staticPages, ...classUrls, ...productUrls, ...categoryUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    ${'lastmod' in u ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority}</priority>
    <changefreq>${u.changefreq}</changefreq>
  </url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Internal server error');
  }
});

export default router;
