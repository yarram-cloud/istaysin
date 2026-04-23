import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Reusable middleware to validate req.body against a Zod schema.
 * Pass the schema to the middleware when defining your routes.
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Forward to the global error handler which natively parses ZodErrors
        next(error);
      } else {
        next(error);
      }
    }
  };
};
