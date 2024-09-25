import { NodeSDK } from '@opentelemetry/sdk-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

// import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
// import { ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

import { ATTR_HTTP_REQUEST_METHOD, ATTR_HTTP_ROUTE } from '@opentelemetry/semantic-conventions';

import packageJson from './package.json' assert { type: 'json' };

const sdk = new NodeSDK({
  serviceName: `${packageJson.name}`,
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
  ],
});

sdk.start();