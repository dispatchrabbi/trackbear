import { vi, expect, describe, it, afterEach } from 'vitest';
import { mockObject } from 'testing-support/util';

import _dbClient from '../../db.ts';

import { getTalliesForParticipants } from './helpers.ts';
import { Leaderboard } from './types.ts';
import { TALLY_MEASURE, TALLY_STATE } from '../tally/consts.ts';

vi.mock('../../tracer.ts');

vi.mock('../../db.ts');
const dbClient = vi.mocked(_dbClient, { deep: true });

describe(getTalliesForParticipants, () => {

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns an empty array if there are no participants', async () => {
    const testLeaderboard = mockObject<Leaderboard>();

    const actual = await getTalliesForParticipants(testLeaderboard, []);

    expect(actual.length).toBe(0);
    expect(dbClient.tally.findMany).not.toBeCalled();
  });

  it('gets tallies for participants within date bounds', async () => {
    dbClient.tally.findMany.mockResolvedValue([]);

    const testLeaderboard = mockObject<Leaderboard>({
      individualGoalMode: false,
      measures: [TALLY_MEASURE.WORD],
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });

    type Participant = Parameters<typeof getTalliesForParticipants>[1][number];
    const testParticipants = [
      mockObject<Participant>({ userId: -20, worksIncluded: [], tagsIncluded: [] }),
    ];

    await getTalliesForParticipants(testLeaderboard, testParticipants);

    expect(dbClient.tally.findMany).toBeCalledWith({
      where: {
        state: TALLY_STATE.ACTIVE,
        measure: { in: [TALLY_MEASURE.WORD] },
        date: { gte: '2024-01-01', lte: '2024-12-31' },
        OR: [
          { ownerId: -20, measure: undefined, workId: undefined, tags: undefined },
        ]
      }
    });
  });

  it('gets tallies for participants with a leaderboard goal', async () => {
    dbClient.tally.findMany.mockResolvedValue([]);

    const testLeaderboard = mockObject<Leaderboard>({
      individualGoalMode: false,
      measures: [TALLY_MEASURE.WORD],
    });

    type Participant = Parameters<typeof getTalliesForParticipants>[1][number];
    const testParticipants = [
      mockObject<Participant>({ userId: -20, worksIncluded: [], tagsIncluded: [] }),
      mockObject<Participant>({ userId: -21, worksIncluded: [ { id: -30 }, { id: -31 } ], tagsIncluded: [] }),
      mockObject<Participant>({ userId: -22, worksIncluded: [], tagsIncluded: [ { id: -40 }, { id: -41 } ] }),
    ];

    await getTalliesForParticipants(testLeaderboard, testParticipants);

    expect(dbClient.tally.findMany).toBeCalledWith({
      where: {
        state: TALLY_STATE.ACTIVE,
        measure: { in: [TALLY_MEASURE.WORD] },
        date: { gte: undefined, lte: undefined },
        OR: [
          { ownerId: -20, measure: undefined, workId: undefined, tags: undefined },
          { ownerId: -21, measure: undefined, workId: { in: [-30, -31] }, tags: undefined },
          { ownerId: -22, measure: undefined, workId: undefined, tags: { some: { id: { in: [-40, -41] } } } },
        ]
      }
    });
  });

  it('gets tallies for participants with individual goals', async () => {
    dbClient.tally.findMany.mockResolvedValue([]);

    const testLeaderboard = mockObject<Leaderboard>({
      individualGoalMode: true,
    });

    type Participant = Parameters<typeof getTalliesForParticipants>[1][number];
    const testParticipants = [
      mockObject<Participant>({ userId: -20, goal: { measure: TALLY_MEASURE.PAGE, count: 100 }, worksIncluded: [], tagsIncluded: [] }),
      mockObject<Participant>({ userId: -21, goal: null, worksIncluded: [], tagsIncluded: [] }),
    ];

    await getTalliesForParticipants(testLeaderboard, testParticipants);

    expect(dbClient.tally.findMany).toBeCalledWith({
      where: {
        state: TALLY_STATE.ACTIVE,
        measure: undefined,
        date: { gte: undefined, lte: undefined },
        OR: [
          { ownerId: -20, measure: TALLY_MEASURE.PAGE, workId: undefined, tags: undefined },
          { ownerId: -21, measure: 'do-not-return-tallies', workId: undefined, tags: undefined },
        ]
      }
    });
  });

});