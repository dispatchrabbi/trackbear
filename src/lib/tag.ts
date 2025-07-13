import { compare } from 'natural-orderby';
import { Tag } from 'generated/prisma/client';

const cmp = compare();
export function cmpTag(a: Tag, b: Tag) {
  return cmp(a.name, b.name);
}
