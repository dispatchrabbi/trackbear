import type { Request, Response, NextFunction } from 'express';
import { RecordNotFoundError } from './models/errors.ts';
import { type FailureCode, FAILURE_CODES } from './api-response-codes.ts';

import { getLogger } from 'server/lib/logger.ts';
const logger = getLogger();

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

export function failure(code: FailureCode | string, message: string): ApiFailurePayload {
  return {
    success: false,
    error: { code, message },
  };
}

export type ApiHandler<T> = (req: Request, res: Response) => Promise<ApiResponse<T>>;
export type DownloadHandler = (req: Request, res: Response) => Promise<void>;
export function h<T>(handler: ApiHandler<T> | DownloadHandler) {
  return async function handle(req: Request, res: Response, next: NextFunction) {
    try {
      await handler(req, res);
    } catch (err) {
      if(err instanceof RecordNotFoundError) {
        logger.warn(`RecordNotFoundError during call to ${req.url}: ${err.message}: ${err.cause}`);
        const { model, id } = err.meta;
        return notFound(res, model, id);
      } else if(err.code === 'P2025') { // P2025 means we tried to update or delete a db record that doesn't exist
        const model = err.meta.modelName;
        const cause = err.meta.cause;

        logger.warn(`Error modifying ${model} model during call to ${req.url}: ${cause}`);
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
