import helmet from "helmet";

function middleware() {
  if(process.env.NODE_ENV === 'development') {
    // These allow the Vite server to do HMR
    return helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'", "ws://localhost:24678"],
          "script-src": ["'self'", "'unsafe-inline'"],
        },
      },
    });
  } else {
    // use default configuration
    return helmet();
  }
}

export default middleware;
