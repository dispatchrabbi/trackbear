import type { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { RecordNotFoundError } from './models/errors';
import { ValueEnum } from './obj';

export type ApiResponse<T> = Response<ApiResponsePayload<T>>;
export type ApiResponsePayload<T> = ApiSuccessPayload<T> | ApiFailurePayload;

export type ApiSuccessPayload<T> = {
  success: true;
  data: T;
};

export type ApiFailurePayload = {
  success: false;
  error: {
    // the code may feel like overkill but it's intended not to be brittle, so that the front-end can count on it
    code: FailureCode | string;
    message: string;
  };
};

export function success<T>(data: T): ApiSuccessPayload<T> {
  return {
    success: true,
    data,
  };
}

export const FAILURE_CODES = {
  FORBIDDEN: 'FORBIDDEN',
  NOT_LOGGED_IN: 'NOT_LOGGED_IN',
  NO_API_TOKEN: 'NO_API_TOKEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
} as const;
export type FailureCode = ValueEnum<typeof FAILURE_CODES>;

export function failure(code: FailureCode | string, message: string): ApiFailurePayload {
  return {
    success: false,
    error: { code, message },
  };
}

export type ApiHandler<T> = (req: Request, res: Response) => Promise<ApiResponse<T>>;
export function h<T>(handler: ApiHandler<T>) {
  return async function handle(req: Request, res: Response, next: NextFunction) {
    try {
      await handler(req, res);
    } catch (err) {
      if(err instanceof RecordNotFoundError) {
        winston.warn(`RecordNotFoundError during call to ${req.url}: ${err.message}: ${err.cause}`);
        const { model, id } = err.meta;
        return notFound(res, model, id);
      } else if(err.code === 'P2025') { // P2025 means we tried to update or delete a db record that doesn't exist
        const model = err.meta.modelName;
        const cause = err.meta.cause;

        winston.warn(`Error modifying ${model} model during call to ${req.url}: ${cause}`);
        const id = req.params.id || '<unknown>';
        return notFound(res, model.toLowerCase(), id);
      }

      return next(err);
    }
  };
}

function notFound(res: Response, model: string, id: string | number, idType: string = 'id') {
  const message = `Did not find any ${model} with ${idType} ${id}`;
  return res.status(404).send(failure(FAILURE_CODES.NOT_FOUND, message));
}
