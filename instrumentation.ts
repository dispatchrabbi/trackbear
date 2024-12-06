import dotenv from 'dotenv';

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';

// import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import Prisma from '@prisma/instrumentation';

// import {
//     SimpleLogRecordProcessor,
//     ConsoleLogRecordExporter,
//     BatchLogRecordProcessor,
// } from '@opentelemetry/sdk-logs';
// import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';

// import { ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
// import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
// import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

import packageJson from './package.json' assert { type: 'json' };

dotenv.config();
const miniEnv = {
  enableInstrumentation: process.env.ENABLE_INSTRUMENTATION === '1',
  otlpUrl: process.env.OTLP_URL ?? '',
};

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: packageJson.name,
    [ATTR_SERVICE_VERSION]: packageJson.version,
  }),
  
  // logRecordProcessors: [
  //   // new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
  //   new BatchLogRecordProcessor(new OTLPLogExporter({
  //     url: miniEnv.otlpUrl,
  //   })),
  // ],
  
  traceExporter: new OTLPTraceExporter({
    url: miniEnv.otlpUrl,
  }),
  // traceExporter: new ConsoleSpanExporter(),

  // metricReader: new PeriodicExportingMetricReader({
  //   exporter: new OTLPMetricExporter({
  //     url: miniEnv.otlpUrl,
  //   }),
  // }),
  
  instrumentations: [
    new WinstonInstrumentation(),
    
    // fun fact: the express instrumentation doesn't play nicely with routers so... we can't use it!
    // so we are just going to do http instrumentation and then we'll have to do middleware for the rest
    new HttpInstrumentation(),
    
    new Prisma.PrismaInstrumentation(),
  ],
});

if(miniEnv.enableInstrumentation) {
  console.info('Enabling instrumentation...');
  sdk.start();
} else {
  console.info('Continuing without instrumentation...');
}