import { compare } from 'natural-orderby';
import type { Leaderboard, LeaderboardTeam, Membership } from 'src/lib/api/leaderboard';
import { formatDate } from './date';

const cmp = compare();
export function cmpBoard(a: Leaderboard, b: Leaderboard) {
  if(a.starred !== b.starred) {
    return a.starred ? -1 : 1;
  }

  // TODO: add this back in with a dropdown; as-is, it's not intuitive how this is sorted
  // if(a.endDate < b.endDate) {
  //   return -1;
  // } else if(a.endDate > b.endDate) {
  //   return 1;
  // }

  return cmp(a.title, b.title);
}

export function cmpMember(a: Membership, b: Membership) {
  if(a.isOwner !== b.isOwner) {
    return a.isOwner ? -1 : 1;
  } else if(a.isParticipant !== b.isParticipant) {
    return a.isParticipant ? -1 : 1;
  } else {
    return cmp(a.displayName.toLowerCase(), b.displayName.toLowerCase());
  }
}

export function cmpTeam(a: LeaderboardTeam, b: LeaderboardTeam) {
  return cmp(a.name, b.name);
}

export function describeLeaderboard(leaderboard: Leaderboard) {
  const today = formatDate(new Date());
  if(leaderboard.startDate && leaderboard.endDate) {
    return `From ${leaderboard.startDate} to ${leaderboard.endDate}`;
  } else if(leaderboard.startDate) {
    return `${leaderboard.startDate < today ? 'Started' : 'Starts'} ${leaderboard.startDate}`;
  } else if(leaderboard.endDate) {
    return `${leaderboard.endDate > today ? 'Ends' : 'Ended'} ${leaderboard.endDate}`;
  } else {
    return 'Ongoing';
  }
}
