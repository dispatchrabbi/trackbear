import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest';

import { createChartSeries, createParSeries, determineChartStartDate, determineChartEndDate, getChartDomain } from './chart-functions';

describe('chart-functions', () => {
  describe(createChartSeries, () => {
    it('creates a series of chart data points', () => {
      const series = 'Progress';
      const tallies = [
        { date: '2024-11-02', count: 200 },
        { date: '2024-11-03', count: 300 },
        { date: '2024-11-05', count: 500 },
        { date: '2024-11-06', count: 600 },
      ];

      const expected = [
        { series, date: '2024-11-02', value: 200 },
        { series, date: '2024-11-03', value: 300 },
        { series, date: '2024-11-05', value: 500 },
        { series, date: '2024-11-06', value: 600 },
      ];

      const actual = createChartSeries(tallies);

      expect(actual).toStrictEqual(expected);
    });

    it('creates a series of accumulated chart data points', () => {
      const series = 'Progress';
      const tallies = [
        { date: '2024-11-02', count: 200 },
        { date: '2024-11-03', count: 300 },
        { date: '2024-11-05', count: 500 },
        { date: '2024-11-06', count: 600 },
      ];

      const expected = [
        { series, date: '2024-11-02', value: 200 },
        { series, date: '2024-11-03', value: 500 },
        { series, date: '2024-11-05', value: 1000 },
        { series, date: '2024-11-06', value: 1600 },
      ];

      const actual = createChartSeries(tallies, { accumulate: true });

      expect(actual).toStrictEqual(expected);
    });

    it('creates a series of densified chart data points', () => {
      const series = 'Progress';
      const tallies = [
        { date: '2024-11-02', count: 200 },
        { date: '2024-11-03', count: 300 },
        { date: '2024-11-05', count: 500 },
        { date: '2024-11-06', count: 600 },
        { date: '2024-11-09', count: 900 },
      ];

      const expected = [
        { series, date: '2024-11-02', value: 200 },
        { series, date: '2024-11-03', value: 300 },
        { series, date: '2024-11-04', value: 0 },
        { series, date: '2024-11-05', value: 500 },
        { series, date: '2024-11-06', value: 600 },
        { series, date: '2024-11-07', value: 0 },
        { series, date: '2024-11-08', value: 0 },
        { series, date: '2024-11-09', value: 900 },
      ];

      const actual = createChartSeries(tallies, {
        densify: true,
        earliestData: tallies.at(0).date,
        latestData: tallies.at(-1).date,
      });

      expect(actual).toStrictEqual(expected);
    });

    it('respects a passed start date', () => {
      const series = 'Progress';
      const startDate = '2024-11-03';
      const tallies = [
        { date: '2024-11-02', count: 200 },
        { date: '2024-11-03', count: 300 },
        { date: '2024-11-05', count: 500 },
        { date: '2024-11-06', count: 600 },
      ];

      const expected = [
        { series, date: '2024-11-03', value: 300 },
        { series, date: '2024-11-05', value: 500 },
        { series, date: '2024-11-06', value: 600 },
      ];

      const actual = createChartSeries(tallies, { startDate });

      expect(actual).toStrictEqual(expected);
    });

    it('respects a passed end date', () => {
      const series = 'Progress';
      const endDate = '2024-11-05';
      const tallies = [
        { date: '2024-11-02', count: 200 },
        { date: '2024-11-03', count: 300 },
        { date: '2024-11-05', count: 500 },
        { date: '2024-11-06', count: 600 },
      ];

      const expected = [
        { series, date: '2024-11-02', value: 200 },
        { series, date: '2024-11-03', value: 300 },
        { series, date: '2024-11-05', value: 500 },
      ];

      const actual = createChartSeries(tallies, { endDate });

      expect(actual).toStrictEqual(expected);
    });

    it('creates a series of densified chart data points with start and end dates', () => {
      const series = 'Progress';
      const startDate = '2024-11-01';
      const endDate = '2024-11-10';
      const tallies = [
        { date: '2024-11-02', count: 200 },
        { date: '2024-11-03', count: 300 },
        { date: '2024-11-05', count: 500 },
        { date: '2024-11-06', count: 600 },
        { date: '2024-11-09', count: 900 },
      ];

      const expected = [
        { series, date: '2024-11-02', value: 200 },
        { series, date: '2024-11-03', value: 300 },
        { series, date: '2024-11-04', value: 0 },
        { series, date: '2024-11-05', value: 500 },
        { series, date: '2024-11-06', value: 600 },
        { series, date: '2024-11-07', value: 0 },
        { series, date: '2024-11-08', value: 0 },
        { series, date: '2024-11-09', value: 900 },
      ];

      const actual = createChartSeries(tallies, {
        densify: true,
        startDate,
        endDate,
        earliestData: tallies.at(0).date,
        latestData: tallies.at(-1).date,
      });

      expect(actual).toStrictEqual(expected);
    });

    it('creates an extended series of densified chart data points with start and end dates', () => {
      const series = 'Progress';
      const startDate = '2024-11-01';
      const endDate = '2024-11-10';
      const tallies = [
        { date: '2024-11-02', count: 200 },
        { date: '2024-11-03', count: 300 },
        { date: '2024-11-05', count: 500 },
        { date: '2024-11-06', count: 600 },
      ];

      const expected = [
        { series, date: '2024-11-01', value: 0 },
        { series, date: '2024-11-02', value: 200 },
        { series, date: '2024-11-03', value: 300 },
        { series, date: '2024-11-04', value: 0 },
        { series, date: '2024-11-05', value: 500 },
        { series, date: '2024-11-06', value: 600 },
        { series, date: '2024-11-07', value: 0 },
        { series, date: '2024-11-08', value: 0 },
        { series, date: '2024-11-09', value: 0 },
        { series, date: '2024-11-10', value: 0 },
      ];

      const actual = createChartSeries(tallies, {
        densify: true,
        extend: true,
        startDate,
        endDate,
        earliestData: tallies.at(0).date,
        latestData: tallies.at(-1).date,
      });

      expect(actual).toStrictEqual(expected);
    });

    it('creates a series of accumulated chart data points with a starting total', () => {
      const series = 'Progress';
      const tallies = [
        { date: '2024-11-02', count: 200 },
        { date: '2024-11-03', count: 300 },
        { date: '2024-11-05', count: 500 },
        { date: '2024-11-06', count: 600 },
      ];

      const expected = [
        { series, date: '2024-11-02', value: 201 },
        { series, date: '2024-11-03', value: 501 },
        { series, date: '2024-11-05', value: 1001 },
        { series, date: '2024-11-06', value: 1601 },
      ];

      const actual = createChartSeries(tallies, { accumulate: true, startingTotal: 1 });

      expect(actual).toStrictEqual(expected);
    });

    it('does not add a starting total when not accumulating', () => {
      const series = 'Progress';
      const tallies = [
        { date: '2024-11-02', count: 200 },
        { date: '2024-11-03', count: 300 },
        { date: '2024-11-05', count: 500 },
        { date: '2024-11-06', count: 600 },
      ];

      const expected = [
        { series, date: '2024-11-02', value: 200 },
        { series, date: '2024-11-03', value: 300 },
        { series, date: '2024-11-05', value: 500 },
        { series, date: '2024-11-06', value: 600 },
      ];

      const actual = createChartSeries(tallies, { startingTotal: 1 });

      expect(actual).toStrictEqual(expected);
    });

    it('uses a custom series name', () => {
      const series = 'Test';
      const tallies = [
        { date: '2024-11-02', count: 200 },
        { date: '2024-11-03', count: 300 },
        { date: '2024-11-05', count: 500 },
        { date: '2024-11-06', count: 600 },
      ];

      const expected = [
        { series, date: '2024-11-02', value: 200 },
        { series, date: '2024-11-03', value: 300 },
        { series, date: '2024-11-05', value: 500 },
        { series, date: '2024-11-06', value: 600 },
      ];

      const actual = createChartSeries(tallies, { series });

      expect(actual).toStrictEqual(expected);
    });
  });

  describe(createParSeries, () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 11 - 1, 1));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns a flat par series for the given dates', () => {
      const series = 'Par';
      const expected = [
        { series, date: '2024-11-01', value: 10 },
        { series, date: '2024-11-02', value: 10 },
        { series, date: '2024-11-03', value: 10 },
        { series, date: '2024-11-04', value: 10 },
        { series, date: '2024-11-05', value: 10 },
      ];

      const actual = createParSeries(50, {
        startDate: '2024-11-01',
        endDate: '2024-11-05',
      });

      expect(actual).toStrictEqual(expected);
    });

    it('deals with uneven division', () => {
      const series = 'Par';
      const expected = [
        { series, date: '2024-11-01', value: 1765 },
        { series, date: '2024-11-02', value: 1765 },
        { series, date: '2024-11-03', value: 1765 },
        { series, date: '2024-11-04', value: 1765 },
        { series, date: '2024-11-05', value: 1766 },
        { series, date: '2024-11-06', value: 1765 },
        { series, date: '2024-11-07', value: 1765 },
        { series, date: '2024-11-08', value: 1765 },
        { series, date: '2024-11-09', value: 1765 },
        { series, date: '2024-11-10', value: 1765 },
        { series, date: '2024-11-11', value: 1765 },
        { series, date: '2024-11-12', value: 1765 },
        { series, date: '2024-11-13', value: 1766 },
        { series, date: '2024-11-14', value: 1765 },
        { series, date: '2024-11-15', value: 1765 },
        { series, date: '2024-11-16', value: 1765 },
        { series, date: '2024-11-17', value: 1765 },
      ];
      const goal = 30007;

      const actual = createParSeries(goal, {
        startDate: '2024-11-01',
        endDate: '2024-11-17',
      });

      const sum = actual.map(dp => dp.value).reduce((total, val) => total + val, 0);
      expect(sum).toEqual(goal);
      expect(actual).toStrictEqual(expected);
    });

    it('returns an accumulating par series for the given dates', () => {
      const series = 'Par';
      const expected = [
        { series, date: '2024-11-01', value: 10 },
        { series, date: '2024-11-02', value: 20 },
        { series, date: '2024-11-03', value: 30 },
        { series, date: '2024-11-04', value: 40 },
        { series, date: '2024-11-05', value: 50 },
      ];

      const actual = createParSeries(50, {
        accumulate: true,
        startDate: '2024-11-01',
        endDate: '2024-11-05',
      });

      expect(actual).toStrictEqual(expected);
    });

    it('deals with uneven division when accumulating', () => {
      const series = 'Par';
      const expected = [
        { series, date: '2024-11-01', value: 1765 },
        { series, date: '2024-11-02', value: 3530 },
        { series, date: '2024-11-03', value: 5295 },
        { series, date: '2024-11-04', value: 7060 },
        { series, date: '2024-11-05', value: 8826 },
        { series, date: '2024-11-06', value: 10591 },
        { series, date: '2024-11-07', value: 12356 },
        { series, date: '2024-11-08', value: 14121 },
        { series, date: '2024-11-09', value: 15886 },
        { series, date: '2024-11-10', value: 17651 },
        { series, date: '2024-11-11', value: 19416 },
        { series, date: '2024-11-12', value: 21181 },
        { series, date: '2024-11-13', value: 22947 },
        { series, date: '2024-11-14', value: 24712 },
        { series, date: '2024-11-15', value: 26477 },
        { series, date: '2024-11-16', value: 28242 },
        { series, date: '2024-11-17', value: 30007 },
      ];
      const goal = 30007;

      const actual = createParSeries(goal, {
        startDate: '2024-11-01',
        endDate: '2024-11-17',
        accumulate: true,
      });

      expect(actual).toStrictEqual(expected);
    });

    it('respects a custom series name', () => {
      const series = 'Test';
      const expected = [
        { series, date: '2024-11-01', value: 10 },
        { series, date: '2024-11-02', value: 10 },
        { series, date: '2024-11-03', value: 10 },
        { series, date: '2024-11-04', value: 10 },
        { series, date: '2024-11-05', value: 10 },
      ];

      const actual = createParSeries(50, {
        startDate: '2024-11-01',
        endDate: '2024-11-05',
        series,
      });

      expect(actual).toStrictEqual(expected);
    });
  });

  describe(determineChartStartDate, () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns the current date if nothing is passed', () => {
      const fakeCurrentDate = new Date(2024, 5 - 1, 14);
      vi.setSystemTime(fakeCurrentDate);
      const currentDateStr = '2024-05-14';

      const actual = determineChartStartDate(null, null);

      expect(actual).toEqual(currentDateStr);
    });

    it('returns the first update date if no override date is passed', () => {
      const firstUpdate = '2024-05-04';

      const actual = determineChartStartDate(firstUpdate, null);

      expect(actual).toEqual(firstUpdate);
    });

    it('returns the override date if both a first update date and override date are passed', () => {
      const startDate = '2024-05-01';
      const firstUpdate = '2024-05-04';

      const actual = determineChartStartDate(firstUpdate, startDate);

      expect(actual).toEqual(startDate);
    });

    it('returns the override date if only an override date is passed', () => {
      const startDate = '2024-05-01';

      const actual = determineChartStartDate(null, startDate);

      expect(actual).toEqual(startDate);
    });
  });

  describe(determineChartEndDate, () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns 6 days from today if nothing is passed', () => {
      const fakeCurrentDate = new Date(2024, 5 - 1, 7);
      vi.setSystemTime(fakeCurrentDate);

      const sixDaysLater = '2024-05-13';

      const actual = determineChartEndDate(null, null, null);

      expect(actual).toEqual(sixDaysLater);
    });

    it('returns 6 days from the overridden start date if only a start date is passed and the start date is after today', () => {
      const fakeCurrentDate = new Date(2024, 5 - 1, 7);
      vi.setSystemTime(fakeCurrentDate);
      const startDate = '2024-05-14';
      const sixDaysLater = '2024-05-20';

      const actual = determineChartEndDate(null, null, startDate);

      expect(actual).toEqual(sixDaysLater);
    });

    it('returns 6 days from today if only a start date is passed and the start date is before today', () => {
      const startDate = '2024-05-14';
      const fakeCurrentDate = new Date(2024, 5 - 1, 20);
      vi.setSystemTime(fakeCurrentDate);
      const sixDaysLater = '2024-05-26';

      const actual = determineChartEndDate(null, null, startDate);

      expect(actual).toEqual(sixDaysLater);
    });

    it('returns the last update date if no override date is passed', () => {
      const lastUpdate = '2024-05-29';

      const actual = determineChartStartDate(lastUpdate, null);

      expect(actual).toEqual(lastUpdate);
    });

    it('returns the override end date if both a last update date and override end date are passed', () => {
      const lastUpdate = '2024-05-28';
      const endDate = '2024-05-31';

      const actual = determineChartStartDate(lastUpdate, endDate);

      expect(actual).toEqual(endDate);
    });

    it('returns the override end date if only an override end date is passed', () => {
      const endDate = '2024-05-31';

      const actual = determineChartStartDate(null, endDate);

      expect(actual).toEqual(endDate);
    });
  });

  describe(getChartDomain, () => {
    it('reports the domain with all positive values', () => {
      const expected = [0, 200];

      const data = [
        { date: '2024-11-01', value: 100 },
        { date: '2024-11-02', value: 200 },
      ];

      const actual = getChartDomain(data, [], 0);

      expect(actual).toEqual(expected);
    });

    it('reports the stacked domain with all positive values', () => {
      const expected = [0, 300];

      const data = [
        { date: '2024-11-01', value: 50 },
        { date: '2024-11-01', value: 150 },
        { date: '2024-11-02', value: 100 },
        { date: '2024-11-02', value: 200 },
      ];

      const actual = getChartDomain(data, [], 0, true);

      expect(actual).toEqual(expected);
    });

    it('reports the domain with all negative values', () => {
      const expected = [-200, 0];

      const data = [
        { date: '2024-11-01', value: -100 },
        { date: '2024-11-02', value: -200 },
      ];

      const actual = getChartDomain(data, [], 0);

      expect(actual).toEqual(expected);
    });

    it('reports the stacked domain with all negative values', () => {
      const expected = [-300, 0];

      const data = [
        { date: '2024-11-01', value: -50 },
        { date: '2024-11-01', value: -150 },
        { date: '2024-11-02', value: -100 },
        { date: '2024-11-02', value: -200 },
      ];

      const actual = getChartDomain(data, [], 0, true);

      expect(actual).toEqual(expected);
    });

    it('reports the domain with a mix of signed values', () => {
      const expected = [-400, 300];

      const data = [
        { date: '2024-11-01', value: 100 },
        { date: '2024-11-02', value: -200 },
        { date: '2024-11-03', value: 300 },
        { date: '2024-11-04', value: -400 },
      ];

      const actual = getChartDomain(data, [], 0);

      expect(actual).toEqual(expected);
    });

    it('reports the stacked domain with a mix of signed values', () => {
      const expected = [-200, 100];

      const data = [
        { date: '2024-11-01', value: 50 },
        { date: '2024-11-01', value: -150 },
        { date: '2024-11-02', value: 100 },
        { date: '2024-11-02', value: -200 },
      ];

      const actual = getChartDomain(data, [], 0, true);

      expect(actual).toEqual(expected);
    });

    it('it overrides the max with the suggested value', () => {
      const expected = [0, 500];

      const data = [
        { date: '2024-11-01', value: 100 },
        { date: '2024-11-02', value: 200 },
      ];

      const actual = getChartDomain(data, [], 500);

      expect(actual).toEqual(expected);
    });

    it('it overrides the min with the negative of the suggested value', () => {
      const expected = [-500, 0];

      const data = [
        { date: '2024-11-01', value: -100 },
        { date: '2024-11-02', value: -200 },
      ];

      const actual = getChartDomain(data, [], 500);

      expect(actual).toEqual(expected);
    });
  });
});
