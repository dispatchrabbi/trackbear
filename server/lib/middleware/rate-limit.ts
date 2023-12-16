// TODO: when we need to rate-limit API requests not just by IP, see https://express-rate-limit.mintlify.app/overview#alternate-rate-limiters
import { rateLimit as expressRateLimit } from 'express-rate-limit';

function rateLimit() {
  return expressRateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 100, // TODO: test this for front-end needs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
}

export default rateLimit;
