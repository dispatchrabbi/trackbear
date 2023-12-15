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
