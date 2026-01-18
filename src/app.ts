import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as path from 'path';
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import clientRoutes from './routes/client.routes';
import invoiceRoutes from './routes/invoice.routes';
import sitemapRoutes from './routes/sitemap.routes';
import rssRoutes from './routes/rss.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Get allowed origins for CORS
const getAllowedOrigins = () => {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }
  
  // In Vercel, use the deployment URL
  if (process.env.VERCEL_URL) {
    return [`https://${process.env.VERCEL_URL}`];
  }
  
  // Development fallback
  return ['http://localhost:5173'];
};

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = getAllowedOrigins();
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
if (process.env.STORAGE_TYPE === 'local') {
  const uploadsPath = process.env.STORAGE_PATH || './uploads';
  app.use('/uploads', express.static(path.resolve(uploadsPath)));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);

// Sitemap and RSS (public routes, no /api prefix)
app.use('/', sitemapRoutes);
app.use('/', rssRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 handler for API routes
// Note: Static files and SPA routes are handled by Vercel routing
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler must be last
app.use(errorHandler);

export default app;
