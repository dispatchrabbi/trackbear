import { describe, it, expect } from 'vitest';

import {
  analyzeStreaksForHabit, isRangeCurrent,
  isTargetAchieved,
  isTargetGoal, isHabitGoal,
} from './helpers';
import { mockObject } from 'testing-support/util';
import { type Goal, type TargetGoal } from './types';
import { GOAL_TYPE } from './consts';
import { TALLY_MEASURE } from '../tally/consts';

describe('goal model helpers', () => {
  describe.todo(analyzeStreaksForHabit);

  describe.todo(isRangeCurrent);

  describe(isTargetAchieved, () => {
    describe('when the target is positive', () => {
      const testTargetWith500Words = mockObject<TargetGoal>({
        parameters: { threshold: {
          measure: TALLY_MEASURE.WORD,
          count: 500,
        } },
      });

      it('returns true when the current count is higher than the target', () => {
        const actual = isTargetAchieved(testTargetWith500Words, 600);
        expect(actual).toBe(true);
      });

      it('returns true when the current count is equal to the target', () => {
        const actual = isTargetAchieved(testTargetWith500Words, 500);
        expect(actual).toBe(true);
      });

      it('returns false when the current count is lower than the target', () => {
        const actual = isTargetAchieved(testTargetWith500Words, 400);
        expect(actual).toBe(false);
      });

      it('returns false when the current count is negative', () => {
        const actual = isTargetAchieved(testTargetWith500Words, -1000);
        expect(actual).toBe(false);
      });
    });

    describe('when the target is negative', () => {
      const testTargetWithNegative500Words = mockObject<TargetGoal>({
        parameters: { threshold: {
          measure: TALLY_MEASURE.WORD,
          count: -500,
        } },
      });

      it('returns true when the current count is lower than the target', () => {
        const actual = isTargetAchieved(testTargetWithNegative500Words, -600);
        expect(actual).toBe(true);
      });

      it('returns true when the current count is equal to the target', () => {
        const actual = isTargetAchieved(testTargetWithNegative500Words, -500);
        expect(actual).toBe(true);
      });

      it('returns false when the current count is higher than the target', () => {
        const actual = isTargetAchieved(testTargetWithNegative500Words, -400);
        expect(actual).toBe(false);
      });

      it('returns false when the current count is positive', () => {
        const actual = isTargetAchieved(testTargetWithNegative500Words, 1000);
        expect(actual).toBe(false);
      });
    });
  });

  describe(isTargetGoal, () => {
    it('returns true if the goal is a target', () => {
      const goal = mockObject<Goal>({ type: GOAL_TYPE.TARGET });

      const actual = isTargetGoal(goal);

      expect(actual).toBe(true);
    });

    it('returns true if the goal is not a target', () => {
      const goal = mockObject<Goal>({ type: GOAL_TYPE.HABIT });

      const actual = isTargetGoal(goal);

      expect(actual).toBe(false);
    });
  });

  describe(isHabitGoal, () => {
    it('returns true if the goal is a habit', () => {
      const goal = mockObject<Goal>({ type: GOAL_TYPE.HABIT });

      const actual = isHabitGoal(goal);

      expect(actual).toBe(true);
    });

    it('returns true if the goal is not a habit', () => {
      const goal = mockObject<Goal>({ type: GOAL_TYPE.TARGET });

      const actual = isHabitGoal(goal);

      expect(actual).toBe(false);
    });
  });
});
