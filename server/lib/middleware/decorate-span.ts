import { trace, type Span } from '@opentelemetry/api';
import type { HttpCustomAttributeFunction } from '@opentelemetry/instrumentation-http';
import { ATTR_HTTP_ROUTE, ATTR_CLIENT_ADDRESS } from '@opentelemetry/semantic-conventions';
import { ATTR_TB_SESSION_ID, ATTR_TB_USER_ID, ATTR_TB_ACCESS_TYPE } from '../metrics/attributes';

import type { Request, Response, NextFunction } from 'express';
import { getTracer } from '../metrics/tracer';
import { type RequestWithUser } from './access';
import { ACCESS_TYPE } from '../auth-consts';

export type DecorateSpanConfig = {
  method: string;
  routePath: string;
};
export function decorateApiCallSpan(config: DecorateSpanConfig) {
  return function decorate(req: Request, res: Response, next: NextFunction) {
    const apiSpan = trace.getActiveSpan();
    if(!apiSpan) {
      return;
    }

    const spanName = `${config.method.toUpperCase()} ${config.routePath}`;
    apiSpan.updateName(spanName);

    apiSpan.setAttribute(ATTR_HTTP_ROUTE, config.routePath);
    apiSpan.setAttribute(ATTR_CLIENT_ADDRESS, req.ip ?? '');

    next();
  };
}

export const applyCustomAttributesOnSpan: HttpCustomAttributeFunction = function(span, req/* , res */) {
  span.setAttribute(ATTR_TB_SESSION_ID, (req as RequestWithUser).sessionID ?? null);
  span.setAttribute(ATTR_TB_USER_ID, (req as RequestWithUser).user.id ?? null);
  span.setAttribute(ATTR_TB_ACCESS_TYPE, (req as RequestWithUser).accessType ?? ACCESS_TYPE.UNKNOWN);
};

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
