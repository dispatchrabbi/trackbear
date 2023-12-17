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
  words: { count: 'Word Count', defaultChartMax: 5000 },
  time: { count: 'Time Spent', defaultChartMax: 250 },
  chapters: { count: 'Chapters', defaultChartMax: 30 },
  pages: { count: 'Pages', defaultChartMax: 50 },
};
