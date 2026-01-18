import { Router, Request, Response } from 'express';

const router = Router();

interface BlogPost {
  title: string;
  description: string;
  url: string;
  publishedDate: string;
  author?: string;
}

const blogPosts: BlogPost[] = [
  {
    title: 'Country-Specific Invoice Requirements: A Complete Guide',
    description: 'Learn about invoice requirements for different countries including tax regulations, required fields, and compliance standards.',
    url: '/blog/country-specific-invoice-requirements',
    publishedDate: '2026-01-15T00:00:00Z',
    author: 'Invoice Composer',
  },
  {
    title: 'Simple Invoices for Small Businesses: A Practical Guide',
    description: 'A practical guide to creating simple, effective invoices for small businesses. Learn best practices, common mistakes to avoid, and tips for faster payment.',
    url: '/blog/simple-invoices-for-small-businesses',
    publishedDate: '2026-01-15T00:00:00Z',
    author: 'Invoice Composer',
  },
];

// Get base URL from environment or use default
const getBaseUrl = (req: Request): string => {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'invoicecomposer.com';
  return `${protocol}://${host}`;
};

// Generate RSS feed
const generateRSS = (req: Request): string => {
  const baseUrl = getBaseUrl(req);
  const currentDate = new Date().toUTCString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
  xml += '  <channel>\n';
  xml += `    <title>Invoice Composer Blog</title>\n`;
  xml += `    <link>${baseUrl}/blog</link>\n`;
  xml += `    <description>Articles and guides about invoicing, business tips, and invoice best practices.</description>\n`;
  xml += `    <language>en-US</language>\n`;
  xml += `    <lastBuildDate>${currentDate}</lastBuildDate>\n`;
  xml += `    <pubDate>${currentDate}</pubDate>\n`;
  xml += `    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />\n`;
  xml += `    <image>\n`;
  xml += `      <url>${baseUrl}/logo.png</url>\n`;
  xml += `      <title>Invoice Composer Blog</title>\n`;
  xml += `      <link>${baseUrl}/blog</link>\n`;
  xml += `    </image>\n`;

  blogPosts.forEach((post) => {
    const pubDate = new Date(post.publishedDate).toUTCString();
    xml += '    <item>\n';
    xml += `      <title><![CDATA[${post.title}]]></title>\n`;
    xml += `      <description><![CDATA[${post.description}]]></description>\n`;
    xml += `      <link>${baseUrl}${post.url}</link>\n`;
    xml += `      <guid isPermaLink="true">${baseUrl}${post.url}</guid>\n`;
    xml += `      <pubDate>${pubDate}</pubDate>\n`;
    if (post.author) {
      xml += `      <author>${post.author}</author>\n`;
    }
    xml += '    </item>\n';
  });

  xml += '  </channel>\n';
  xml += '</rss>';

  return xml;
};

// RSS feed route
router.get('/rss.xml', (req: Request, res: Response) => {
  try {
    const rss = generateRSS(req);
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(rss);
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).send('Error generating RSS feed');
  }
});

export default router;
