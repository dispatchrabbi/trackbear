import { trace, type Span } from '@opentelemetry/api';
import { ATTR_HTTP_ROUTE, ATTR_CLIENT_ADDRESS } from '@opentelemetry/semantic-conventions';

import type { Request, Response, NextFunction } from 'express';
import { getTracer } from '../tracer';
import { RequestWithUser } from './access';

export type DecorateSpanConfig = {
  method: string;
  routePath: string;
};
export function decorateApiCallSpan(config: DecorateSpanConfig) {
  return function decorate(req: Request, res: Response, next: NextFunction) {
    const activeSpan = trace.getActiveSpan();

    const spanName = `${config.method.toUpperCase()} ${config.routePath}`;
    activeSpan.updateName(spanName);

    activeSpan.setAttribute(ATTR_HTTP_ROUTE, config.routePath);
    activeSpan.setAttribute(ATTR_CLIENT_ADDRESS, req.ip);

    if(req.sessionID) {
      activeSpan.setAttribute('session.id', req.sessionID);
    }

    next();
  };
}

export function addUserInfoToSpan(req: Request, res: Response, next: NextFunction) {
  const user = (req as RequestWithUser).user ?? null;

  if(user) {
    const activeSpan = trace.getActiveSpan();
    activeSpan.setAttribute('session.userId', user.id);
  }

  next();
}

type MiddlewareFunction<R extends Request = Request> = (req: R, res: Response, next: NextFunction) => unknown;

export function instrumentMiddleware<R extends Request = Request>(spanName: string, middlewareFn: MiddlewareFunction<R>): MiddlewareFunction<R> {
  return function wrappedMiddleware(req: R, res: Response, next: NextFunction) {
    const tracer = getTracer();
    return tracer.startActiveSpan(spanName, async (span: Span) => {
      const _next: NextFunction = function(err?: unknown) {
        span.end();
        next(err);
      };

      const result = await middlewareFn(req, res, _next);
      span.end(); // we need this here as well as in next in case the middleware returns (because it has sent a response)
      return result;
    });
  };
}
