// TODO: when we need to rate-limit API requests not just by IP, see https://express-rate-limit.mintlify.app/overview#alternate-rate-limiters
import { rateLimit as expressRateLimit } from 'express-rate-limit';
import { getApiTokenFromRequest } from '../auth';

function rateLimit() {
  return expressRateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 100, // 100 requests per limit
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req/* , res */) => {
      // if we're using an API Key, rate-limit on that key
      const apiKey = getApiTokenFromRequest(req);
      if(apiKey) {
        return apiKey;
      }

      // if there's a session, rate-limit on the session
      const sessionId = req.sessionID;
      if(sessionId) {
        return sessionId;
      }

      // otherwise, rate-limit on the IP
      return req.ip;
    },
  });
}

export default rateLimit;
