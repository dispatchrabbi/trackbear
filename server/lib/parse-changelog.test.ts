import { expect, describe, it } from "vitest";
import { parseChangelog } from "./parse-changelog";

const BLANK_LINE = ``;
const TITLE = `#CHANGELOG`;
const INTRO = `This is a bunch of text that doesn't matter.`;
const FAKEOUT = `- NEW, for new features`;
const VERSION = `## 0.15.5`;
const CHANGE_WITHOUT_HT = `- NEW: Leaderboards in fundraiser mode now show their totals.`;
const CHANGE_WITH_HT = `- FIXED: Fixed a bug that made it impossible to join boards using the code. (h/t Jagodzianka)`;
const CHANGE_WITH_MULTIPLE_HT = `- FIXED: The streak counter for habit goals on the dashboard no longer dumps a bunch of unrelated text and instead now gives a cheery "X in a row!" counter like it's supposed to. (h/t CaitSidhe, sarah, Quinoafox)`;

describe('parseChangelog', () => {
  
  it('returns an empty array if fed an empty string', () => {
    const expected = [];

    const actual = parseChangelog('');

    expect(actual).toEqual(expected);
  });

  it('returns an empty array if there are no versions', () => {
    const expected = [];

    const contents = `
# CHANGELOG

This file lists notable changes to TrackBear in each version. TrackBear uses romantic versioning, so don't read too far into the version numbers.

Types of changes include:
- NEW, for new features
- CHANGED, for changes in existing functionality
- FIXED, for bug fixes
- DEPRECATED, for soon-to-be-removed features
- REMOVED, for features that have been removed
- SECURITY, for vulnerabilities or other security updates
`.trim();

    const actual = parseChangelog(contents);

    expect(actual).toEqual(expected);

  });

  it('parses a changelog', () => {
    const expected = [
    {
      version: 'Upcoming/Unreleased',
      changes: [],
    },
    {
      version: '0.15.5',
      changes: [
        { tag: 'NEW', entry: 'Things are even better.', credit: 'user1, user 2, userThree' },
        { tag: 'FIXED', entry: 'That bug is gone.', credit: 'reporter' },
        { tag: 'SECURITY', entry: 'I added passwords!', },
      ]
    }
  ];

    const contents = `
# CHANGELOG

This file lists notable changes to TrackBear in each version. TrackBear uses romantic versioning, so don't read too far into the version numbers.

Types of changes include:
- NEW, for new features
- CHANGED, for changes in existing functionality
- FIXED, for bug fixes
- DEPRECATED, for soon-to-be-removed features
- REMOVED, for features that have been removed
- SECURITY, for vulnerabilities or other security updates

## Upcoming/Unreleased

## 0.15.5

- NEW: Things are even better. (h/t user1, user 2, userThree)
- FIXED: That bug is gone. (h/t reporter)
- SECURITY: I added passwords!
`.trim();

    const actual = parseChangelog(contents);

    expect(actual).toEqual(expected);
  });
});