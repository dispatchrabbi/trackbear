import type { OASidebarItem } from 'node_modules/vitepress-openapi/dist/types/src/composables/useSidebar';

type SidebarItem = {
  text: string;
  link: string;
};

export function sortSidebarGroupItems(sidebarGroup: OASidebarItem, cmpFn: (a: SidebarItem, b: SidebarItem) => number) {
  return {
    text: sidebarGroup.text,
    items: sidebarGroup.items?.toSorted(cmpFn),
  };
}

const priorty = [
  'ping',
  'list',
  'get',
  'star',
  'create', 'join',
  'update', 'upload',
  'delete', 'remove', 'leave',
  'batch',
];
export function cmpSidebarItems(a: SidebarItem, b: SidebarItem) {
  const aName = a.link.split('_')[1];
  const aPriority = priorty.findIndex(prefix => aName.startsWith(prefix));

  const bName = b.link.split('_')[1];
  const bPriority = priorty.findIndex(prefix => bName.startsWith(prefix));

  if(aPriority === bPriority) {
    return aName.length - bName.length;
  } else if(aPriority === undefined) {
    return 1;
  } else if(bPriority === undefined) {
    return -1;
  } else {
    return aPriority - bPriority;
  }
}
