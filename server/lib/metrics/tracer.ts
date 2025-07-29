import { trace, Span, SpanStatusCode } from '@opentelemetry/api';

import packageJson from '../../../package.json' assert { type: 'json' };

export function getTracer(scopeName?: string) {
  const tracer = trace.getTracer(
    scopeName ?? packageJson.name,
    // if there was a scopeName provided, do not supply a version
    scopeName ? undefined : packageJson.version,
  );

  return tracer;
}

/**
 * Adds tracing to the function via a nested span. Use this as a decorator: `@trace`
 *
 * @param fn the original function
 * @param context the context for the function
 * @returns a traced verion of the function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function traced<This, Args extends any[], Return>(
  fn: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
  const tracer = getTracer();
  const fnName = String(context.name);

  function tracedFn(this: This, ...args: Args): Return {
    return tracer.startActiveSpan(fnName, (span: Span) => {
      let result;
      try {
        result = fn.call(this, ...args);
      } catch (err) {
        span.recordException(err);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: err.message,
        });

        span.end();
        throw err;
      }

      span.end();
      return result;
    });
  }

  return tracedFn;
}
