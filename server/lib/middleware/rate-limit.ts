// TODO: when we need to rate-limit API requests not just by IP, see https://express-rate-limit.mintlify.app/overview#alternate-rate-limiters
import { rateLimit as expressRateLimit } from 'express-rate-limit';
import { getNormalizedEnv } from 'server/lib/env.ts';
import { getApiTokenFromRequest } from '../auth.ts';
import { failure } from '../api-response.ts';
import { FAILURE_CODES } from '../api-response-codes';

async function rateLimit(windowMs?: number, limit?: number) {
  const env = await getNormalizedEnv();

  // return an empty middleware if we have disabled rate limits
  if(env.DISABLE_RATE_LIMITS) {
    return function() {};
  }

  return expressRateLimit({
    windowMs: windowMs ?? 60 * 1000, // default is 1 minute
    limit: limit ?? 100, // default is 100 requests per limit
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req/* , res */) => {
      // if we're using an API Key, rate-limit on that key
      const apiToken = getApiTokenFromRequest(req);
      if(apiToken) {
        return apiToken;
      }

      // if there's a session, rate-limit on the session
      const sessionId = req.sessionID;
      if(sessionId) {
        return sessionId;
      }

      // otherwise, rate-limit on the IP (and if for some reason there's no IP, just fall back to a default key)
      return req.ip ?? '_';
    },
    handler: (req, res) => {
      res.status(429).json(failure(FAILURE_CODES.TOO_MANY_REQUESTS, 'Too many requests! Paws for a moment and try again later.'));
    },
  });
}

export default rateLimit;
