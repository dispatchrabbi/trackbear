import helmet from "helmet";

function middleware() {
  if(process.env.NODE_ENV === 'development') {
    // These allow the Vite server to do HMR
    return helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'", "ws://localhost:24678", "wss://localhost:24678", "http://localhost:24678", "https://localhost:24678"],
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        },
      },
    });
  } else {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        },
      },
    });
  }
}

export default middleware;
