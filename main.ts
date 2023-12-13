import process from 'node:process';
import dotenv from 'dotenv-safe';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import helmet from './server/lib/middleware/helmet.ts';
import bodyParser from 'body-parser';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';

import ViteExpress from 'vite-express';

import dbClient from './server/lib/db.js';

import apiRouter from './server/api/index.js';
// import PATHS from './server/lib/paths.js';

async function main() {
  const app = express();

  // add security headers
  app.use(helmet());

  // don't say that we're using Express
  app.disable('x-powered-by');

  // log requests
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

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

  // /api: self-explanatory
  app.use('/api', apiRouter);

  const server = app.listen(process.env.PORT, () => {
    console.log(`Listening! http://localhost:${process.env.PORT}/`);
  });

  // baseline 404 error (though this is probably obviated by the Vite fall-through route above)
  // TODO: figure out that interplay
  // app.use((req, res, next) => {
  //   res.status(404).send("404 Not Found");
  // });

  // baseline server-side error handling
  app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).send('500 Server error');
  });

  // this will bind a fall-through route to the front-end, so anything that isn't otherwise accounted for ends up here
  ViteExpress.bind(app, server);
}

main().catch(e => console.error(e));
