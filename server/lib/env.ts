import { access, constants } from 'fs/promises';

import path from 'path';
const ROOT_DIR = path.resolve(import.meta.url.replace('file://', ''), '../../..');

type TrackbearCommonEnv = {
  NODE_ENV: string,
  PORT: number;
  LOG_DIR: string;
  APP_DB_URL: string;
  QUEUE_DB_PATH: string;
  COOKIE_SECRET: string;
  MAILERSEND_API_KEY: string;
  USE_PROXY: boolean;
};

type TrackbearTlsEnv =
| { USE_HTTPS: true; TLS_KEY: string; TLS_CERT: string; }
| { USE_HTTPS: false; TLS_KEY: string | null; TLS_CERT: string | null; }

export type TrackbearEnv = TrackbearCommonEnv & TrackbearTlsEnv;

async function normalizeEnv(): Promise<TrackbearEnv> {
  // some of the env vars are optional/okay to leave empty
  // let's check the ones that aren't, and add defaults where it makes sense

  if(!['', 'development', 'production'].includes(process.env.NODE_ENV)) { throw new Error('NODE_ENV should only be either development or production'); }
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';

  if(process.env.PORT !== '' && isNaN(Number.parseInt(process.env.PORT, 10))) {
    throw new Error('PORT must be a number');
  }
  process.env.PORT = process.env.PORT || "3000";

  process.env.LOG_DIR = process.env.LOG_DIR || './logs';
  process.env.APP_DB_URL = process.env.APP_DB_URL || 'file:./db/app.db';
  process.env.QUEUE_DB_PATH = path.resolve(ROOT_DIR, process.env.QUEUE_DB_PATH || "./db/queue.db");

  if(!process.env.COOKIE_SECRET) { throw new Error('Missing COOKIE_SECRET value in .env'); }
  if(!process.env.MAILERSEND_API_KEY) { throw new Error('Missing MAILERSEND_API_KEY value in .env'); }

  if(!['', '0', '1'].includes(process.env.USE_PROXY)) { throw new Error('USE_PROXY should only be either 0 or 1'); }

  if(!['', '0', '1'].includes(process.env.USE_HTTPS)) { throw new Error('USE_HTTPS should only be either 0 or 1'); }

  const useHttps = +process.env.USE_HTTPS;
  if(useHttps) {
    if(!(process.env.TLS_KEY && process.env.TLS_CERT)) { throw new Error('USE_HTTPS requires both TLS_KEY and TLS_CERT values in .env'); }

    try {
      await access(process.env.TLS_KEY, constants.R_OK);
    } catch(err) {
      throw new Error(`Could not read TLS_KEY: ${process.env.TLS_KEY}`);
    }

    try {
      await access(process.env.TLS_CERT, constants.R_OK);
    } catch(err) {
      throw new Error(`Could not read TLS_CERT: ${process.env.TLS_CERT}`);
    }
  }

  return {
    NODE_ENV:           process.env.NODE_ENV,
    PORT:              +process.env.PORT,
    LOG_DIR:            process.env.LOG_DIR,
    APP_DB_URL:         process.env.APP_DB_URL,
    QUEUE_DB_PATH:      process.env.QUEUE_DB_PATH,
    COOKIE_SECRET:      process.env.COOKIE_SECRET,
    MAILERSEND_API_KEY: process.env.MAILERSEND_API_KEY,
    USE_PROXY:        !!process.env.USE_PROXY,
    USE_HTTPS:        !!process.env.USE_HTTPS,
    TLS_KEY:            process.env.TLS_KEY || null,
    TLS_CERT:           process.env.TLS_CERT || null,
  };
}

let env = null;
async function getNormalizedEnv(): Promise<TrackbearEnv> {
  if(env === null) {
    env = await normalizeEnv();
  }

  return env;
}

export {
  getNormalizedEnv,
};
