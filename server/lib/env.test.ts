import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { getNormalizedEnv } from "./env";

describe('getNormalizedEnv', () => {

  let ORIGINAL_ENV_VARS = { ...process.env };
  beforeEach(() => {
    ORIGINAL_ENV_VARS = { ...process.env };
    
    const NEW_ENV_VARS = {
      NODE_ENV: 'development',
    
      PORT: '3000',
      HAS_PROXY: '0',
    
      ENABLE_TLS: '0',
      TLS_ALLOW_SELF_SIGNED: '0',
    
      LOG_PATH: './logs',
      LOG_LEVEL: 'debug',
    
      DATABASE_USER: 'fake',
      DATABASE_PASSWORD: 'fake',
      DATABASE_NAME: 'fake',
      DATABASE_HOST: 'localhost',
    
      DB_PATH: '',
      COOKIE_SECRET: 'fake',
    
      ENABLE_EMAIL: '0',
      MAILERSEND_API_KEY: 'fake',
      EMAIL_URL_PREFIX: 'localhost:3000',
    
      UPLOADS_PATH: './uploads',

      ENABLE_METRICS: '0',
      PLAUSIBLE_HOST: 'http://localhost:8000',
      PLAUSIBLE_DOMAIN: 'trackbear.example',
    };
    
    process.env = {
      ...process.env,
      ...NEW_ENV_VARS,
    };
  });
  afterEach(() => {
    process.env = {
      ...process.env,
      ...ORIGINAL_ENV_VARS,
    };
  });

  describe.todo('env var validation');

  it('returns an object with env vars', async () => {
    const expected = process.env.NODE_ENV;

    const envObj = await getNormalizedEnv();
    const actual = envObj.NODE_ENV;

    expect(actual).toEqual(expected);
  });

  it('returns the same object on being called twice', async() => {
    const expected = await getNormalizedEnv();
    const actual = await getNormalizedEnv();

    expect(actual).toEqual(expected);
  });
});