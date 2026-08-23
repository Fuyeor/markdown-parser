// @/composables/useDocumentStats.ts
import { computed, type Ref } from 'vue';

export interface DocumentStats {
  words: number;
  characters: number;
  sentences: number;
  paragraphs: number;
}

export function countDocumentStats(text: string): DocumentStats {
  if (!text) {
    return { words: 0, characters: 0, sentences: 0, paragraphs: 0 };
  }

  const wordSegmenter = new window.Intl.Segmenter(undefined, {
    granularity: 'word',
  });
  const words = [...wordSegmenter.segment(text)].filter(
    ({ isWordLike }) => isWordLike,
  ).length;

  const characterSegmenter = new window.Intl.Segmenter(undefined, {
    granularity: 'grapheme',
  });
  const characters = [...characterSegmenter.segment(text)].length;

  const sentenceSegmenter = new window.Intl.Segmenter(undefined, {
    granularity: 'sentence',
  });
  const sentences = [...sentenceSegmenter.segment(text)].length;

  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim().length > 0).length;

  return { words, characters, sentences, paragraphs };
}

export function useDocumentStats(source: Ref<string>) {
  const stats = computed(() => countDocumentStats(source.value));
  return { stats };
}
