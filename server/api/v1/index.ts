import { prefixRoutes, type RouteConfig } from 'server/lib/api.ts';

import apiKeyRoutes from './api-key.ts';
import goalRoutes from './goal.ts';
import leaderboardRoutes from './leaderboard.ts';
import meRoutes from './me.ts';
import pingRoutes from './ping.ts';
import profileRoutes from './profile.ts';
import statsRoutes from './stats.ts';
import tagRoutes from './tag.ts';
import tallyRoutes from './tally.ts';
import workRoutes from './work.ts';

const v1Routes: RouteConfig[] = [
  ...prefixRoutes('/api-key', apiKeyRoutes),
  ...prefixRoutes('/goal', goalRoutes),
  ...prefixRoutes('/leaderboard', leaderboardRoutes),
  ...prefixRoutes('/me', meRoutes),
  ...prefixRoutes('/ping', pingRoutes),
  ...prefixRoutes('/profile', profileRoutes),
  ...prefixRoutes('/stats', statsRoutes),
  ...prefixRoutes('/tag', tagRoutes),
  ...prefixRoutes('/tally', tallyRoutes),
  ...prefixRoutes('/work', workRoutes),
];

export default v1Routes;
