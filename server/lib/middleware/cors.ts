import cors from 'cors';
import { getNormalizedEnv } from '../env';

const allowedCorsOrigins = {
  development: ['http://localhost:5173'],
  production: ['https://help.trackbear.app'],
};

export const corsOptionsDelegate: cors.CorsOptionsDelegate = async function(req, cb) {
  const env = await getNormalizedEnv();

  const options = {
    origin: allowedCorsOrigins[env.NODE_ENV] ?? [],
  };

  cb(null, options);
};
