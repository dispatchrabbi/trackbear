import { Board } from 'src/lib/api/board.ts';

export function cmpBoard(a: Board, b: Board) {
  if(a.starred !== b.starred) {
    return a.starred ? -1 : 1;
  }

  if(a.endDate < b.endDate) {
    return -1;
  } else if(a.endDate > b.endDate) {
    return 1;
  }

  const aTitle = a.title.toLowerCase();
  const bTitle = b.title.toLowerCase();
  return aTitle < bTitle ? -1 : aTitle > bTitle ? 1 : 0;
}
