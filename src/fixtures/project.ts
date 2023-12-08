import type { Project } from '../lib/project.ts';

const SAMPLE_PROJECT: Project = {
  id: 42,
  uuid: '7cb2bf3e-cea0-47e8-bf8c-9793ecb99e57',
  ownerId: 54,
  title: 'Finally Writing That Romance Novel',
  type: 'words',
  state: 'active',
  goal: 50000,
  startDate: '2023-11-01',
  endDate: '2023-11-30',
  visibility: 'sharable',
  starred: true,
  updates: [
    { id: 301, date: '2023-11-01', value: 3001 },
    { id: 302, date: '2023-11-02', value: 2955 },
    { id: 303, date: '2023-11-04', value: 1667 },
  ],
};

export default SAMPLE_PROJECT;
