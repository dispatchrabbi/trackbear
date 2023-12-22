export type Project = {
  id: number,
  uuid: string,
  ownerId: number,
  title: string,
  type: 'time' | 'words' | 'pages' | 'chapters',
  state: 'active' | 'finished' | 'archived',
  goal: number,
  startDate: string,
  endDate: string,
  visibility: 'hidden' | 'shared',
  starred: boolean,
  updates: Update[],
};

export type Update = {
  id: number;
  date: string;
  value: number;
  updatedAt: string;
};

export const TYPE_INFO = {
  words: {
    description: 'Word Count',
    defaultChartMax: 5000,
    counter: { singular: 'word', plural: 'words' },

  },
  time: {
    description: 'Time Spent',
    defaultChartMax: 250,
    counter: { singular: 'hour', plural: 'hours' },
  },
  chapters: {
    description: 'Chapters',
    defaultChartMax: 30,
    counter: { singular: 'chapter', plural: 'chapters' },
  },
  pages: {
    description: 'Pages',
    defaultChartMax: 50,
    counter: { singular: 'page', plural: 'pages' },
  },
};
