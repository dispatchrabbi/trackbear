import type { Request } from "express";

// This middleware re-routes valid URLs that must be served by the SPA so that
// when you navigate directly to them, you don't confuse the server
export default function spaRoutes(ignore) {
  return (req: Request, res, next) => {
    if(ignore.some(path => req.url.startsWith(path))) {
      return next();
    }

    req.url = '/index.html';
    return next();
  }
}
