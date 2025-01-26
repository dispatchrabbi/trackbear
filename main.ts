import { readFile } from 'fs/promises';
import dotenv from 'dotenv';
import { getNormalizedEnv } from 'server/lib/env.ts';

import winston from 'winston';
import { initLoggers, closeLoggers } from 'server/lib/logger.ts';

import { createAvatarUploadDirectory, createCoverUploadDirectory } from 'server/lib/upload';

import dbClient, { testDatabaseConnection } from 'server/lib/db.ts';

import { initQueue } from 'server/lib/queue.ts';
import initWorkers from 'server/lib/workers.ts';

import http from 'http';
import https from 'https';
import { promisify } from 'util';
import express, { ErrorRequestHandler } from 'express';
import morgan from 'morgan';
import helmet from 'server/lib/middleware/helmet.ts';
import compression from 'compression';
import bodyParser from 'body-parser';
import qs from 'qs';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import rateLimit from 'server/lib/middleware/rate-limit.ts';

import { mountApiEndpoints } from 'server/api/index.ts';
import spaRoutes from 'server/lib/middleware/spa-routes.ts';
import { createServer } from 'vite';

async function main() {
  dotenv.config();
  const env = await getNormalizedEnv();

  await initLoggers();
  winston.info('TrackBear is starting up and logs are online!');
  // use `winston` just as the general logger
  const accessLogger = winston.loggers.get('access');
  
  // make sure all the directories we need exist
  await createAvatarUploadDirectory();
  await createCoverUploadDirectory();
  winston.info('Avatar and cover upload directories exist');

  // test the database connection
  try {
    await testDatabaseConnection();
    winston.info('Database connection established');
  } catch(err) {
    console.error(`Could not connect to the database: ${err.message}`);
    winston.error(`${err.message}`, {
      message: err.message,
      stack: err.stack.split('\n'),
    });

    process.exit(2);
  }

  // initialize the queue
  await initQueue();

  // initialize the workers
  initWorkers();

  // let's start up the server!
  const app = express();

  // this must be set before anything else (see https://github.com/expressjs/express/issues/4979)
  app.set('query parser', (str: string) => qs.parse(str));

  // add security headers
  app.use(await helmet());

  // compress responses
  app.use(compression());

  // don't say that we're using Express
  app.disable('x-powered-by');

  // are we behind a proxy?
  if(env.HAS_PROXY) {
    app.set('trust proxy', 1);
  }

  // log requests
  // always stream to the access logger
  app.use(morgan('combined', { stream: { write: function(message) { accessLogger.info(message); } } }));
  // also stream to the console if we're developing
  if(env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // parse request bodies using application/json
  app.use(bodyParser.json());

  // sessions
  // Allow multiple signing secrets: see using an array at https://www.npmjs.com/package/express-session#secret
  const cookieSecret = (env.COOKIE_SECRET || '').split(',');
  // the combination of maxAge: 2 days & rolling: true means that you'll get logged out if you don't do _something_ every 2 days
  app.use(session({
    cookie: {
      maxAge: 2 * 24 * 60 * 60 * 1000, // in ms
      secure: true,
      sameSite: 'strict',
    },
    name: 'trackbear.sid',
    secret: cookieSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new PrismaSessionStore(dbClient, {
      checkPeriod: 2 * 60 * 1000, // in ms, how often to delete expired sessions
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }));

  // /api: mount the API routes
  if(env.NODE_ENV !== 'development') {
    // add rate-limiting for the API for production
    app.use('/api', rateLimit());
  }
  mountApiEndpoints(app);

  // Serve the front-end - either statically or out of the vite server, depending
  if(env.NODE_ENV === 'production') {
    // serve the front-end statically out of dist/
    winston.info('Serving the front-end out of dist/');
    app.use(spaRoutes(['/assets', '/images', '/uploads', '/manifest.json']));
    app.use('/uploads', express.static(env.UPLOADS_PATH));
    app.use(express.static('./dist'));
  } else {
    // Serve the front end using the schmancy HMR vite server.
    // This middleware has a catch-all route
    winston.info('Serving the front-end dynamically using vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        https:  env.ENABLE_TLS ? {
          key:  env.TLS_KEY_PATH,
          cert: env.TLS_CERT_PATH,
        } : undefined,
      },
      appType: 'spa',
      publicDir: './public',
    });
    app.use(vite.middlewares); // vite takes care of serving the front end
    // NOTE: alternately, it could be appType: custom, and then app.use('*', handleServingHtml)
    // see https://vitejs.dev/config/server-options.html#server-middlewaremode
  }

  // baseline server-side error handling
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const lastChanceErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).send('500 Server error');
  };
  app.use(lastChanceErrorHandler);

  // are we doing HTTP or HTTPS?
  let server: https.Server | http.Server;
  if(env.ENABLE_TLS) {
    server = https.createServer({
      key: await readFile(env.TLS_KEY_PATH),
      cert: await readFile(env.TLS_CERT_PATH),
    }, app);
  } else {
    server = http.createServer(app);
  }
  server.listen(env.PORT, () => {
    winston.info(`TrackBear is now listening on ${env.ENABLE_TLS ? 'https' : 'http'}://localhost:${env.PORT}/`);
  });

  // handle SIGINT for graceful shutdown
  process.on('SIGINT', async () => {
    try {
      await handleGracefulShutdown('SIGINT', server);
      process.exit(0);
    } catch {
      process.exit(1);
    }
  });
}

async function handleGracefulShutdown(signal: string, server: https.Server | http.Server) {
  winston.info(`Received ${signal}, shutting down gracefully...`);

  // no need to disconnect Prisma; it does it itself
  // we only need to close off the server and the logs
  await promisify(server.close)();
  await closeLoggers();
}

main().catch(e => console.error(e));
