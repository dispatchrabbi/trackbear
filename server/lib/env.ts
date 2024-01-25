import { access, constants } from 'fs/promises';

import path from 'path';
const ROOT_DIR = path.resolve(import.meta.url.replace('file://', ''), '../../..');

type TrackbearCommonEnv = {
  NODE_ENV: string;

  PORT: number;
  HAS_PROXY: boolean;

  ENABLE_TLS: boolean;
  TLS_ALLOW_SELF_SIGNED: boolean;

  LOG_PATH: string;
  LOG_LEVEL: string;

  DB_PATH: string;
  COOKIE_SECRET: string;

  ENABLE_EMAIL: boolean;
  MAILERSEND_API_KEY: string;
  EMAIL_URL_PREFIX: string;
};

type TrackbearTlsEnv =
| {
    ENABLE_TLS: true;
    TLS_KEY_PATH: string;
    TLS_CERT_PATH: string;
  }
| {
    ENABLE_TLS: false;
    TLS_KEY_PATH: string | null;
    TLS_CERT_PATH: string | null;
  }
;

export type TrackbearEnv = TrackbearCommonEnv & TrackbearTlsEnv;

async function normalizeEnv(): Promise<TrackbearEnv> {
  // first step is to check for valid values and supply defaults

  if(!['', 'development', 'production'].includes(process.env.NODE_ENV)) { throw new Error('NODE_ENV should only be either `development` or `production`'); }
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';

  if(process.env.PORT !== '' && isNaN(Number.parseInt(process.env.PORT, 10))) {
    throw new Error('PORT must be a number');
  }
  process.env.PORT = process.env.PORT || "3000";

  if(!['', '0', '1'].includes(process.env.HAS_PROXY)) { throw new Error('HAS_PROXY should only be either `0` or `1`'); }
  process.env.HAS_PROXY = process.env.HAS_PROXY || "0";

  if(!['', '0', '1'].includes(process.env.ENABLE_TLS)) { throw new Error('ENABLE_TLS should only be either `0` or `1`'); }
  process.env.ENABLE_TLS = process.env.ENABLE_TLS || "0";

  const enableTls = !!+process.env.ENABLE_TLS;
  if(enableTls) {
    if(!(process.env.TLS_KEY_PATH && process.env.TLS_CERT_PATH)) { throw new Error('ENABLE_TLS requires both TLS_KEY_PATH and TLS_CERT_PATH values in .env'); }


    process.env.TLS_KEY_PATH = path.resolve(ROOT_DIR, process.env.TLS_KEY_PATH);
    try {
      await access(process.env.TLS_KEY_PATH, constants.R_OK);
    } catch(err) {
      throw new Error(`Could not read TLS_KEY_PATH (${process.env.TLS_KEY_PATH}): ${err.message}`, { cause: err });
    }

    process.env.TLS_CERT_PATH = path.resolve(ROOT_DIR, process.env.TLS_CERT_PATH);
    try {
      await access(process.env.TLS_CERT_PATH, constants.R_OK);
    } catch(err) {
      throw new Error(`Could not read TLS_CERT_PATH (${process.env.TLS_CERT_PATH}): ${err.message}`, { cause: err });
    }
  }

  if(!['', '0', '1'].includes(process.env.TLS_ALLOW_SELF_SIGNED)) { throw new Error('TLS_ALLOW_SELF_SIGNED should only be either `0` or `1`'); }
  process.env.TLS_ALLOW_SELF_SIGNED = process.env.TLS_ALLOW_SELF_SIGNED || "0";

  process.env.LOG_PATH = process.env.LOG_PATH || '/logs';

  if(!['', 'debug', 'info', 'warn', 'error', 'critical'].includes(process.env.LOG_LEVEL)) { throw new Error('LOG_LEVEL should be one of: `debug`, `info`, `warn`, `error`, `critical`'); }
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';

  process.env.DB_PATH = process.env.DB_PATH || '/db';

  if(!process.env.COOKIE_SECRET) { throw new Error('Missing COOKIE_SECRET value in .env'); }

  if(!process.env.MAILERSEND_API_KEY) { throw new Error('Missing MAILERSEND_API_KEY value in .env'); }
  if(!process.env.EMAIL_URL_PREFIX) { throw new Error('Missing EMAIL_URL_PREFIX value in .env'); }

  // second step is to parse the values into more usable types
  return {
    NODE_ENV:               process.env.NODE_ENV,

    PORT:                  +process.env.PORT,
    HAS_PROXY:              process.env.HAS_PROXY === '1',

    ENABLE_TLS:             process.env.ENABLE_TLS === '1',
    TLS_KEY_PATH:           enableTls ? process.env.TLS_KEY_PATH : null,
    TLS_CERT_PATH:          enableTls ? process.env.TLS_CERT_PATH : null,
    TLS_ALLOW_SELF_SIGNED:  process.env.TLS_ALLOW_SELF_SIGNED === '1',

    LOG_PATH:               process.env.LOG_PATH,
    LOG_LEVEL:              process.env.LOG_LEVEL,

    DB_PATH:                process.env.DB_PATH,
    COOKIE_SECRET:          process.env.COOKIE_SECRET,

    ENABLE_EMAIL:          process.env.ENABLE_EMAIL === '1',
    MAILERSEND_API_KEY:     process.env.MAILERSEND_API_KEY,
    EMAIL_URL_PREFIX:       process.env.EMAIL_URL_PREFIX,
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
