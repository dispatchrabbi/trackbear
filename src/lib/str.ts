export function toTitleCase(str: string): string {
  return str.split(' ').map(s => s.length > 0 ? s[0].toUpperCase() + s.slice(1) : '').join(' ');
}

export function filenameify(str: string): string {
  return str.replaceAll(/[\\/|:*?"<>\p{Control}\s]/gu, '-').replaceAll(/-+/g, '-');
}
