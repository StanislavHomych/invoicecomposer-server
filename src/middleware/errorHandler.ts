import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('=== ERROR HANDLER ===');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  if (err instanceof Error && (err as any).code) {
    console.error('Error code:', (err as any).code);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const firstError = err.errors[0];
    return res.status(400).json({
      error: firstError?.message || 'Validation error',
      details: process.env.NODE_ENV === 'development' ? err.errors : undefined,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError' || err.constructor?.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        error: 'A record with this information already exists',
      });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found',
      });
    }
    // Log other Prisma errors for debugging
    console.error('Prisma error:', prismaError.code, prismaError.message);
  }

  // Handle other known errors
  if (err.message && err.message.includes('not found')) {
    return res.status(404).json({ error: err.message });
  }

  if (err.message && err.message.includes('already exists')) {
    return res.status(409).json({ error: err.message });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
