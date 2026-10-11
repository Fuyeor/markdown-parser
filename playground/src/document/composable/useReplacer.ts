// @/document/composable/useReplacer.ts
import { computed, ref, watch } from 'vue';

export interface Match {
  start: number;
  end: number;
}

export interface SearchOption {
  caseSensitive: boolean;
  regex: boolean;
  wholeWord: boolean;
}

/** Escape regex metacharacters; optionally wrap in word boundaries. */
const escapePattern = (value: string, wholeWord: boolean): string => {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return wholeWord ? `\\b${escaped}\\b` : escaped;
};

/** Build the search regex; returns null on invalid user input. */
const buildRegex = (query: string, option: SearchOption): RegExp | null => {
  const flags = option.caseSensitive ? 'g' : 'gi';
  const pattern = option.regex ? query : escapePattern(query, option.wholeWord);
  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
};

/** Find-and-replace state for a plain-text source. */
export const useSearchReplace = (getSource: () => string) => {
  const query = ref('');
  const replacement = ref('');
  const active = ref(0);
  const option = ref<SearchOption>({
    caseSensitive: false,
    regex: false,
    wholeWord: false,
  });

  const matchList = computed<Match[]>(() => {
    if (!query.value) return [];
    const regex = buildRegex(query.value, option.value);
    if (!regex) return [];

    const result: Match[] = [];
    for (const m of getSource().matchAll(regex)) {
      if (m[0].length === 0) continue;
      result.push({ start: m.index, end: m.index + m[0].length });
    }
    return result;
  });

  const current = computed(() => matchList.value[active.value]);
  const total = computed(() => matchList.value.length);

  // Clamp active index when the match list shrinks.
  watch(matchList, (list) => {
    if (active.value >= list.length) active.value = 0;
  });

  // Restart from the first match when the query or options change.
  watch(
    [
      query,
      () => option.value.caseSensitive,
      () => option.value.regex,
      () => option.value.wholeWord,
    ],
    () => {
      active.value = 0;
    },
  );

  const seek = (delta: number) => {
    const size = matchList.value.length;
    if (size === 0) return;
    active.value = (active.value + delta + size) % size;
  };

  const replaceOne = (): string | null => {
    const m = current.value;
    if (!m) return null;
    const text = getSource();
    return text.slice(0, m.start) + replacement.value + text.slice(m.end);
  };

  const replaceAll = (): string | null => {
    const list = matchList.value;
    if (list.length === 0) return null;
    const text = getSource();
    let result = '';
    let cursor = 0;
    for (const m of list) {
      result += text.slice(cursor, m.start) + replacement.value;
      cursor = m.end;
    }
    return result + text.slice(cursor);
  };

  return {
    query,
    replacement,
    active,
    option,
    matchList,
    current,
    total,
    next: () => seek(1),
    prev: () => seek(-1),
    replaceOne,
    replaceAll,
  };
};
