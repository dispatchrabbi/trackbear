import type { Request, Response, NextFunction } from "express";

export type ApiResponse<T> = Response<ApiResponsePayload<T>>;
export type ApiResponsePayload<T> = ApiSuccessPayload<T> | ApiFailurePayload;

export type ApiSuccessPayload<T> = {
  success: true;
  data: T
};

export type ApiFailurePayload = {
  success: false;
  error: {
    // the code may feel like overkill but it's intended not to be brittle, so that the front-end can count on it
    code: string;
    message: string;
  };
}

export function success<T>(data: T): ApiSuccessPayload<T> {
  return {
    success: true,
    data
  };
}

export function failure(code: string, message: string): ApiFailurePayload {
  return {
    success: false,
    error: { code, message },
  };
}

type ApiHandler<T> = (req: Request, res: Response) => Promise<ApiResponse<T>>;
export function h<T>(handler: ApiHandler<T>) {
  return async function handle(req: Request, res: Response, next: NextFunction) {
    try {
      await handler(req, res);
    } catch(err) { return next(err); }
  };
}
