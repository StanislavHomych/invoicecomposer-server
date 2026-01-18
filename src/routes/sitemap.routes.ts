import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Sitemap Configuration
 * 
 * To add new pages to the sitemap:
 * 1. Add a new object to the publicPages array below
 * 2. Include: url, changefreq, priority, and lastmod (last modification date)
 * 
 * Priority values: 0.0 to 1.0 (1.0 = most important)
 * Changefreq values: always, hourly, daily, weekly, monthly, yearly, never
 * Lastmod format: YYYY-MM-DD (ISO date)
 * 
 * Example:
 * {
 *   url: '/new-page',
 *   changefreq: 'monthly',
 *   priority: '0.7',
 *   lastmod: '2026-01-14'
 * }
 */
const publicPages = [
  {
    url: '/',
    changefreq: 'weekly',
    priority: '1.0',
    lastmod: '2026-01-18'
  },
  {
    url: '/about',
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: '2026-01-18'
  },
  {
    url: '/privacy',
    changefreq: 'yearly',
    priority: '0.5',
    lastmod: '2026-01-18'
  },
  {
    url: '/terms',
    changefreq: 'yearly',
    priority: '0.5',
    lastmod: '2026-01-18'
  },
  {
    url: '/blog',
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: '2026-01-18'
  },
  {
    url: '/blog/country-specific-invoice-requirements',
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: '2026-01-18'
  },
  {
    url: '/blog/simple-invoices-for-small-businesses',
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: '2026-01-18'
  },
  {
    url: '/login',
    changefreq: 'monthly',
    priority: '0.6',
    lastmod: '2026-01-18'
  },
  {
    url: '/register',
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: '2026-01-18'
  },
  {
    url: '/invoice-builder',
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: '2026-01-18'
  },
  {
    url: '/create',
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: '2026-01-18'
  }
];

// Add RSS feed to sitemap (optional, but good practice)
const addRSSFeed = (baseUrl: string): string => {
  return `  <url>
    <loc>${baseUrl}/rss.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
};

// Get base URL from environment or use default
const getBaseUrl = (req: Request): string => {
  // Try to get from environment first
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // Try to get from Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback to request origin
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'invoicecomposer.com';
  return `${protocol}://${host}`;
};

// Generate sitemap XML
const generateSitemap = (req: Request): string => {
  const baseUrl = getBaseUrl(req);
  const currentDate = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  publicPages.forEach((page) => {
    const lastmod = page.lastmod || currentDate;
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  // Add RSS feed to sitemap
  xml += addRSSFeed(baseUrl);

  xml += '</urlset>';

  return xml;
};

// Sitemap route
router.get('/sitemap.xml', (req: Request, res: Response) => {
  try {
    const sitemap = generateSitemap(req);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
