import type { Project } from '@prisma/client';

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

export function makeShareUrl(project: Project) {
  return new URL(`/share/projects/${project.uuid}`, window.location.href);
}
