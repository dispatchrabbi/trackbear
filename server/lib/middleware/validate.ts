import { ZodSchema } from 'zod';
import type { Request, Response, NextFunction } from 'express';

function validateBody(schema: ZodSchema) {
  return function validate(req: Request, res: Response, next: NextFunction) {
    const parsed = schema.safeParse(req.body);
    if(parsed.success === false) {
      const errorMessages = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}.`);
      res.status(400).send(`Payload validation failed: ${errorMessages.join(' ')}`);
      return;
    }

    req.body = parsed.data;
    return next();
  }
}

function validateParams(schema: ZodSchema) {
  return function validate(req: Request, res: Response, next: NextFunction) {
    const parsed = schema.safeParse(req.params);
    if(parsed.success === false) {
      const errorMessages = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}.`);
      res.status(400).send(`Param validation failed: ${errorMessages.join(' ')}`);
      return;
    }

    return next();
  }
}

function validateQuery(schema: ZodSchema) {
  return function validate(req: Request, res: Response, next: NextFunction) {
    const parsed = schema.safeParse(req.query);
    if(parsed.success === false) {
      const errorMessages = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}.`);
      res.status(400).send(`Query validation failed: ${errorMessages.join(' ')}`);
      return;
    }

    return next();
  }
}

export {
  validateParams,
  validateQuery,
  validateBody,
};
