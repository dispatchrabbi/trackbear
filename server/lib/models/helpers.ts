import { omit } from "../obj";

type WorksAndTagsIncluded = {
  worksIncluded: { id: number }[],
  tagsIncluded: { id: number }[],
}

type WorksAndTagsIds = {
  workIds: number[],
  tagIds: number[],
}

type WithIdsInstead<T extends WorksAndTagsIncluded> = Omit<T, 'worksIncluded' | 'tagsIncluded'> & WorksAndTagsIds;
type WithIncludedInstead<T extends WorksAndTagsIds> = Omit<T, 'workIds' | 'tagIds'> & WorksAndTagsIncluded;

export function included2ids<O extends WorksAndTagsIncluded>(obj: O | null): WithIdsInstead<O> | null {
  if(obj === null) { return null; }
  
  return Object.assign(
    omit(obj, ['worksIncluded', 'tagsIncluded']),
    {
      workIds: obj.worksIncluded.map(work => work.id),
      tagIds: obj.tagsIncluded.map(tag => tag.id),
    }
  );
}

export function ids2included<O extends WorksAndTagsIds>(obj: O): WithIncludedInstead<O> {
  if(obj === null) { return null; }
  
  return Object.assign(
    omit(obj, ['workIds', 'tagIds']),
    {
      worksIncluded: obj.workIds.map(id => ({ id })),
      tagsIncluded: obj.tagIds.map(id => ({ id })),
    }
  );
}