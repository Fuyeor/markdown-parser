// @/document/util/extractTitle.ts
export const extractTitle = (content: string, untitled: string): string => {
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    const heading = /^#{1,6}\s+(.+)$/.exec(trimmed);
    if (heading) return heading[1].trim().slice(0, 30) || untitled;
    if (trimmed) return trimmed.slice(0, 30);
  }
  return untitled;
};
