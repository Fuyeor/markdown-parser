// @/playground/composable/useFormatOption.ts
import { ref, watch } from 'vue';
import type { FormatOption, TextTransformer } from '@ffm/formatter';

export interface KeyValuePair {
  from: string;
  to: string;
}

export interface ReplacerRule extends KeyValuePair {
  /** 是否按正则处理 from */
  regex?: boolean;
}

/** UI 层 + localStorage 层用的可序列化形态 */
export interface FormatOptionState {
  autoCase: {
    sentence: boolean;
    heading: 'off' | 'sentence' | 'title' | 'capitalize';
    glossary: KeyValuePair[];
  };
  continuousScript: {
    autoSpacing: boolean;
    autoUpperWord: boolean;
    fullwidthPunctuation: boolean;
  };
  replacer: ReplacerRule[];
}

const storageKey = 'formatter';

export const defaultOption: FormatOptionState = {
  autoCase: {
    sentence: false,
    heading: 'off',
    glossary: [],
  },
  continuousScript: {
    autoSpacing: true,
    autoUpperWord: false,
    fullwidthPunctuation: true,
  },
  replacer: [],
};

function load(): FormatOptionState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return structuredClone(defaultOption);
    const parsed = JSON.parse(raw) as Partial<FormatOptionState>;
    return {
      ...structuredClone(defaultOption),
      ...parsed,
      autoCase: {
        ...defaultOption.autoCase,
        ...(parsed.autoCase ?? {}),
      },
      continuousScript: {
        ...defaultOption.continuousScript,
        ...(parsed.continuousScript ?? {}),
      },
    };
  } catch {
    return structuredClone(defaultOption);
  }
}

const state = ref<FormatOptionState>(load());

watch(
  state,
  (value) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // 存储失败（隐私模式 / 空间满）时静默忽略
    }
  },
  { deep: true },
);

/** 把 UI 状态编译成 @ffm/formatter 需要的形态 */
export function toFormatOption(s: FormatOptionState): FormatOption {
  const glossary: Record<string, string> = {};
  for (const { from, to } of s.autoCase.glossary) {
    if (from) glossary[from] = to;
  }

  let transformer: TextTransformer | undefined;
  if (s.replacer.length > 0) {
    // 预编译正则，避免每次 format 都重新构造
    const compiled = s.replacer
      .filter((r) => r.from)
      .map((r) => {
        if (r.regex) {
          try {
            return {
              test: new RegExp(r.from, 'g'),
              to: r.to,
              regex: true,
            } as const;
          } catch {
            return null;
          }
        }
        return { test: r.from, to: r.to, regex: false } as const;
      })
      .filter(Boolean) as
      | Array<{ test: RegExp; to: string; regex: true }>
      | Array<{ test: string; to: string; regex: false }>;

    transformer = (text) => {
      let result = text;
      for (const rule of compiled) {
        if (rule.regex) {
          result = result.replace(rule.test, rule.to);
        } else {
          result = result.split(rule.test).join(rule.to);
        }
      }
      return result;
    };
  }

  return {
    autoCase: {
      sentence: s.autoCase.sentence ? 'capitalize' : undefined,
      heading: s.autoCase.heading === 'off' ? undefined : s.autoCase.heading,
      glossary: Object.keys(glossary).length > 0 ? glossary : undefined,
    },
    continuousScript: { ...s.continuousScript },
    transformer,
  };
}

export function useFormatOption() {
  return state;
}
