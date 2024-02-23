const PASSWORD_RESET_LINK_STATE = {
  ACTIVE:   'active',
  USED:     'used',
  // no DELETED because we only hard-delete these
};

const PROJECT_STATE = {
  ACTIVE:   'active',
  DELETED:  'deleted',
};

const PROJECT_VISIBILITY = {
  PRIVATE:  'private',
  PUBLIC:   'public',
};

const PROJECT_TYPE = {
  WORDS:    'words',
  TIME:     'time',
  PAGES:    'pages',
  CHAPTERS: 'chapters',
};

const LEADERBOARD_STATE = {
  ACTIVE:   'active',
  DELETED:  'deleted',
};

const LEADERBOARD_GOAL_TYPE = {
  ...PROJECT_TYPE,
  PERCENTAGE: 'percentage',
};

export {
  PASSWORD_RESET_LINK_STATE,
  PROJECT_STATE,
  PROJECT_VISIBILITY,
  PROJECT_TYPE,
  LEADERBOARD_STATE,
  LEADERBOARD_GOAL_TYPE,
};
