import { describe, it, expect } from 'vitest';
import { TEST_OBJECT_ID, TEST_USER_ID } from 'testing-support/util';

import { WORK_STATE } from './work/consts';
import { TAG_STATE } from './tag/consts';

import {
  included2ids,
  ids2included,
  makeIncludeWorkAndTagIds
} from './helpers';

describe('model helpers', () => {
  describe(included2ids, () => {
    it('converts an object with works and tags included to an object with work and tag ids', () => {
      const expected = {
        id: TEST_OBJECT_ID,
        someOtherProperty: true,
        anArray: [1, 3, 5],
        workIds: [ -20, -21, -22 ],
        tagIds: [ -30, -31, -32 ],
      };
  
      const testInput = {
        id: TEST_OBJECT_ID,
        someOtherProperty: true,
        anArray: [1, 3, 5],
        worksIncluded: [ { id: -20 }, { id: -21 }, { id: -22 } ],
        tagsIncluded: [ { id: -30 }, { id: -31 }, { id: -32 } ],
      };
  
      const actual = included2ids(testInput);
  
      expect(actual).toEqual(expected);
    });
  
    it('returns null when handed null', () => {
      const actual = included2ids(null);
  
      expect(actual).toBe(null);
    });
  });
  
  describe(ids2included, () => {
    it('converts an object with work and tag ids to an object with works and tags included', () => {
      const expected = {
        id: TEST_OBJECT_ID,
        someOtherProperty: true,
        anArray: [1, 3, 5],
        worksIncluded: [ { id: -20 }, { id: -21 }, { id: -22 } ],
        tagsIncluded: [ { id: -30 }, { id: -31 }, { id: -32 } ],
      };
  
      const testInput = {
        id: TEST_OBJECT_ID,
        someOtherProperty: true,
        anArray: [1, 3, 5],
        workIds: [ -20, -21, -22 ],
        tagIds: [ -30, -31, -32 ],
      };
  
      
  
      const actual = ids2included(testInput);
  
      expect(actual).toEqual(expected);
    });
  
    it('returns null when handed null', () => {
      const actual = included2ids(null);
  
      expect(actual).toBe(null);
    });
  });

  describe(makeIncludeWorkAndTagIds, () => {
    it('builds the include object', () => {
      const expected = {
        worksIncluded: {
          where: {
            ownerId: TEST_USER_ID,
            state: WORK_STATE.ACTIVE,
          },
          select: { id: true },
        },
        tagsIncluded: {
          where: {
            ownerId: TEST_USER_ID,
            state: TAG_STATE.ACTIVE,
          },
          select: { id: true },
        }
      };

      const actual = makeIncludeWorkAndTagIds({ id: TEST_USER_ID });

      expect(actual).toEqual(expected);
    });
  })
});