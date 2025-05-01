export const TAG_STATE = {
  ACTIVE: 'active',
  DELETED: 'deleted',
};

export const TAG_COLORS = [
  'default',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'brown',
  'white',
  'black',
  'gray',
] as const;
export type TagColor = typeof TAG_COLORS[number];

export const TAG_DEFAULT_COLOR: TagColor = 'default';

export function isTagColor(possibleTagColor: string): possibleTagColor is TagColor {
  return TAG_COLORS.includes(possibleTagColor as TagColor);
}
