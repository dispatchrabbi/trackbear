import dotenv from 'dotenv';

import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';

// import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { applyCustomAttributesOnSpan } from 'server/lib/middleware/decorate-span';

import {
  // SimpleLogRecordProcessor,
  // ConsoleLogRecordExporter,
  BatchLogRecordProcessor,
  // LoggerProvider,
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';

// import { ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

import packageJson from './package.json' assert { type: 'json' };

// enable both the new semantic conventions for built-in instrumentations and the old ones
// the new ones, because we have no history worth preserving; the old ones because that's what Signoz parses still
process.env.OTEL_SEMCONV_STABILITY_OPT_IN = 'http/dup';

dotenv.config();
const miniEnv = {
  enableInstrumentation: process.env.ENABLE_INSTRUMENTATION === '1',
  otlpUrl: process.env.OTLP_URL ?? 'http://localhost:4318',
};

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: packageJson.name,
    [ATTR_SERVICE_VERSION]: packageJson.version,
  }),

  logRecordProcessors: [
    // new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
    new BatchLogRecordProcessor(new OTLPLogExporter({
      url: miniEnv.otlpUrl + '/v1/logs',
    })),
  ],

  // traceExporter: new ConsoleSpanExporter(),
  traceExporter: new OTLPTraceExporter({
    url: miniEnv.otlpUrl + '/v1/traces',
  }),

  metricReader: new PeriodicExportingMetricReader({
    // exporter: new ConsoleMetricExporter(),
    exporter: new OTLPMetricExporter({
      url: miniEnv.otlpUrl + '/v1/metrics',
    }),
  }),

  instrumentations: [
    new WinstonInstrumentation(),

    // fun fact: the express instrumentation doesn't play nicely with routers so... we can't use it!
    // so we are just going to do http instrumentation and then we'll have to do middleware for the rest
    new HttpInstrumentation({
      applyCustomAttributesOnSpan,
    }),

    new PrismaInstrumentation(),
  ],
});

if(miniEnv.enableInstrumentation) {
  console.info('Enabling instrumentation...');
  sdk.start();
} else {
  console.info('Continuing without instrumentation...');
}
