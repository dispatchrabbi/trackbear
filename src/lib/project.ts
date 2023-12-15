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
  id: number,
  date: string,
  value: number,
};

export const TYPE_INFO = {
  words: { count: 'Word Count', defaultChartMax: 1000 },
  time: { count: 'Time Spent', defaultChartMax: 500 },
  chapters: { count: 'Chapters', defaultChartMax: 15 },
  pages: { count: 'Pages', defaultChartMax: 300 },
};
