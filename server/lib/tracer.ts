import { trace } from '@opentelemetry/api';

import packageJson from '../../package.json' assert { type: 'json' };

export function getTracer(scopeName?: string) {
  const tracer = trace.getTracer(
    scopeName ?? packageJson.name,
    // if there was a scopeName provided, do not supply a version
    scopeName ? undefined : packageJson.version,
  );

  return tracer;
}