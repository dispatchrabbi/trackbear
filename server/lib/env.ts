import { access, constants } from 'fs/promises';

async function checkEnvVars() {
  // some of the env vars are optional/okay to leave empty
  // let's check the ones that aren't, and add defaults where it makes sense

  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  process.env.PORT = process.env.PORT || "3000";

  process.env.LOG_DIR = process.env.LOG_DIR || './logs';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./db/trackbear.db';

  if(!process.env.COOKIE_SECRET) { throw new Error('Missing COOKIE_SECRET value in .env'); }

  if(process.env.USE_HTTPS) {
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
}

export {
  checkEnvVars,
};
