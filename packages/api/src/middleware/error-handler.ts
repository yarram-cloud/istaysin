import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Gracefully handle Zod validation errors globally
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    console.warn('⚠️ [VALIDATION ERROR]', formattedErrors);
    res.status(400).json({
      success: false,
      error: `Validation failed: ${formattedErrors}`,
      details: err.errors
    });
    return;
  }

  console.error('🚨 [ERROR]', err.message, err.stack);

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
