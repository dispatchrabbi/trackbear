import process from 'process';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv-safe';
import { checkEnvVars } from './server/lib/env.ts';

import winston from 'winston';
import initLoggers from './server/lib/logger.ts';

import http from 'http';
import https from 'https';
import express from 'express';
import morgan from 'morgan';
import helmet from './server/lib/middleware/helmet.ts';
import bodyParser from 'body-parser';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import rateLimit from './server/lib/middleware/rate-limit.ts';

import ViteExpress from 'vite-express';

import dbClient from './server/lib/db.js';

import apiRouter from './server/api/index.js';

async function main() {
  dotenv.config({ allowEmptyValues: true });
  checkEnvVars();

  initLoggers(process.env.LOG_DIR);
  // use `winston` just as the general logger
  const accessLogger = winston.loggers.get('access');

  const app = express();

  // add security headers
  app.use(helmet());

  // don't say that we're using Express
  app.disable('x-powered-by');

  // log requests
  // always stream to the access logger
  app.use(morgan('combined', { stream: { write: function(message) { accessLogger.info(message); } } }));
  // also stream to the console if we're developing
  if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // rate-limiting
  if(process.env.NODE_ENV !== 'development') {
    app.use(rateLimit());
  }

  // parse request bodies using application/json
  app.use(bodyParser.json());

  // sessions
  // Allow multiple signing secrets: see using an array at https://www.npmjs.com/package/express-session#secret
  const cookieSecret = (process.env.COOKIE_SECRET || '').split(',');
  app.use(session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // in ms
      secure: 'auto', // TODO: lock this down when we figure out deployment
    },
    secret: cookieSecret,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(dbClient, {
      checkPeriod: 2 * 60 * 1000, // in ms, how often to delete expired sessions
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }));

  // /api: mount the API routes
  app.use('/api', apiRouter);

  // are we behind a proxy?
  if(process.env.USE_PROXY) {
    app.set('trust proxy', 1);
  }

  // are we doing HTTP or HTTPS?
  let server: https.Server | http.Server;
  if(process.env.USE_HTTPS) {
    server = https.createServer({
      key: await readFile(process.env.TLS_KEY as string),
      cert: await readFile(process.env.TLS_CERT as string),
    }, app);
  } else {
    server = http.createServer(app);
  }
  server.listen(process.env.PORT, () => {
    winston.info(`TrackBear is now listening on ${process.env.USE_HTTPS ? 'https' : 'http'}://localhost:${process.env.PORT}/`);
  });

  // baseline server-side error handling
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).send('500 Server error');
  });

  // this will bind a fall-through route to the front-end, so anything that isn't otherwise accounted for ends up here
  ViteExpress.bind(app, server);
}

main().catch(e => console.error(e));
