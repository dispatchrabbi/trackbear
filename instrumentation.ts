import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

// import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
// import { ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import Prisma from '@prisma/instrumentation';

import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

import packageJson from './package.json' assert { type: 'json' };

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: packageJson.name,
    [ATTR_SERVICE_VERSION]: packageJson.version,
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
  // traceExporter: new ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://localhost:4318/v1/metrics',
    }),
  }),
  
  instrumentations: [
    // fun fact: the express instrumentation doesn't play nicely with routers so... we can't use it!
    // so we are just going to do http instrumentation and then we'll have to do middleware for the rest
    new HttpInstrumentation(),
    new Prisma.PrismaInstrumentation(),
  ],
});

sdk.start();