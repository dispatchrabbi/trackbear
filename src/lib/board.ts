import { compare } from 'natural-orderby';
import type { Leaderboard, Membership } from 'src/lib/api/leaderboard';

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
