import type { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { RecordNotFoundError } from './models/errors';

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
    code: string;
    message: string;
  };
};

export function success<T>(data: T): ApiSuccessPayload<T> {
  return {
    success: true,
    data,
  };
}

export function failure(code: string, message: string): ApiFailurePayload {
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
        return res.status(404).send(failure('NOT_FOUND', `Did not find any ${err.meta.model} with id ${err.meta.id}`));
      } else if(err.code === 'P2025') { // P2025 means we tried to update or delete a db record that doesn't exist
        const model = err.meta.modelName;
        const cause = err.meta.cause;

        winston.warn(`Error modifying ${model} model during call to ${req.url}: ${cause}`);
        return res.status(404).send(failure('NOT_FOUND', `Did not find any ${model.toLowerCase()} with id ${req.params.id || '<unknown>'}`));
      }

      return next(err);
    }
  };
}
