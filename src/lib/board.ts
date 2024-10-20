import { compare } from 'natural-orderby';
import { Board } from 'src/lib/api/board.ts';

const cmp = compare();
export function cmpBoard(a: Board, b: Board) {
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
