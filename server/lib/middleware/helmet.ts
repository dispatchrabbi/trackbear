import helmet from "helmet";
import { getNormalizedEnv } from 'server/lib/env.ts';

async function middleware() {
  const env = await getNormalizedEnv();

  if(env.NODE_ENV === 'development') {
    // These are more lenient in order to allow the Vite server to do HMR and enable other local dev needs
    return helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": [
            "'self'", // ourselves
            "ws://localhost:24678", "wss://localhost:24678", "http://localhost:24678", "https://localhost:24678" // HMR
          ],
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          "img-src": ["'self'", "blob:"],
          "connect-src": [
            "'self'", // the api
            "ws://localhost:24678", "wss://localhost:24678", "http://localhost:24678", "https://localhost:24678", // HMR
            ...(env.ENABLE_METRICS ? [env.PLAUSIBLE_HOST] : []),
            "https://api.nanowrimo.org" // NaNoWriMo importing
          ],
        },
      },
    });
  } else {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          "img-src": ["'self'", "blob:"],
          "connect-src": [
            "'self'", // the api
            ...(env.ENABLE_METRICS ? [env.PLAUSIBLE_HOST] : []),
            "https://api.nanowrimo.org" // NaNoWriMo importing
          ],
        },
      },
    });
  }
}

export default middleware;
