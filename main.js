import process from 'node:process';
import dotenv from 'dotenv-safe';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import ViteExpress from 'vite-express';

import apiRouter from './server/api/index.js';
// import PATHS from './server/lib/paths.js';

async function main() {
  const app = express();

  // log requests
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  const server = app.listen(process.env.PORT, () => {
    console.log(`App is listening on port ${process.env.PORT}`);
  });

  // /api: self-explanatory
  app.use('/api', apiRouter);

  // this will bind a fall-through route to the front-end, so anything that isn't otherwise accounted for ends up here
  ViteExpress.bind(app, server);
}

main().catch(e => console.error(e));
