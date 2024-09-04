import helmet from "helmet";
import { getNormalizedEnv } from 'server/lib/env.ts';

async function middleware() {
  const env = await getNormalizedEnv();

  if(env.NODE_ENV === 'development') {
    // These allow the Vite server to do HMR
    return helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'", "ws://localhost:24678", "wss://localhost:24678", "http://localhost:24678", "https://localhost:24678"],
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          "img-src": ["'self'", "blob:"],
          "connect-src": ["'self'", "ws://localhost:24678", "wss://localhost:24678", "http://localhost:24678", "https://localhost:24678", "https://api.nanowrimo.org"],
        },
      },
    });
  } else {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          "img-src": ["'self'", "blob:"],
          "connect-src": ["'self'", "https://api.nanowrimo.org"],
        },
      },
    });
  }
}

export default middleware;
