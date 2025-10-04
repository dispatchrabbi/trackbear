import { ZodSchema } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { failure } from '../../lib/api-response.ts';
import { FAILURE_CODES } from '../../lib/api-response-codes.ts';

function validateBody(schema: ZodSchema) {
  return function validateBody(req: Request, res: Response, next: NextFunction) {
    const parsed = schema.safeParse(req.body);
    if(parsed.success === false) {
      const errorMessages = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}.`);
      res.status(400).send(failure(FAILURE_CODES.VALIDATION_FAILED, `Payload validation failed: ${errorMessages.join(' ')}`));
      return;
    }

    req.body = parsed.data;
    return next();
  };
}

function validateParams(schema: ZodSchema) {
  return function validateParams(req: Request, res: Response, next: NextFunction) {
    const parsed = schema.safeParse(req.params);
    if(parsed.success === false) {
      const errorMessages = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}.`);
      res.status(400).send(failure(FAILURE_CODES.VALIDATION_FAILED, `URL parameter validation failed: ${errorMessages.join(' ')}`));
      return;
    }

    return next();
  };
}

function validateQuery(schema: ZodSchema) {
  return function validateQuery(req: Request, res: Response, next: NextFunction) {
    const parsed = schema.safeParse(req.query);
    if(parsed.success === false) {
      const errorMessages = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}.`);
      res.status(400).send(failure(FAILURE_CODES.VALIDATION_FAILED, `Query validation failed: ${errorMessages.join(' ')}`));
      return;
    }

    req.query = parsed.data;
    return next();
  };
}

export {
  validateParams,
  validateQuery,
  validateBody,
};
