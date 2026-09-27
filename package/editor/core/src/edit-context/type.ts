// @ffm/editor/src/edit-context/type.ts

declare global {
  interface EditContextInit {
    text?: string;
    selectionStart?: number;
    selectionEnd?: number;
  }

  interface TextUpdateEvent extends Event {
    updateRangeStart: number;
    updateRangeEnd: number;
    text: string;
    selectionStart: number;
    selectionEnd: number;
    compositionStart: number;
    compositionEnd: number;
  }

  interface TextFormat {
    rangeStart: number;
    rangeEnd: number;
    underlineStyle: string;
    underlineThickness: string;
    underlineColor: string;
  }

  interface TextFormatUpdateEvent extends Event {
    getTextFormats(): TextFormat[];
  }

  interface CharacterBoundsUpdateEvent extends Event {
    rangeStart: number;
    rangeEnd: number;
  }

  class EditContext extends EventTarget {
    constructor(init?: EditContextInit);
    readonly text: string;
    readonly selectionStart: number;
    readonly selectionEnd: number;
    updateText(rangeStart: number, rangeEnd: number, text: string): void;
    updateSelection(start: number, end: number): void;
    updateControlBounds(rect: DOMRect): void;
    updateSelectionBounds(rect: DOMRect): void;
    updateCharacterBounds(rangeStart: number, characterBounds: DOMRect[]): void;
    attachedElements(): HTMLElement[];
    addEventListener(
      type: 'textupdate',
      listener: (event: TextUpdateEvent) => void,
      options?: AddEventListenerOptions,
    ): void;
    addEventListener(
      type: 'textformatupdate',
      listener: (event: TextFormatUpdateEvent) => void,
      options?: AddEventListenerOptions,
    ): void;
    addEventListener(
      type: 'characterboundsupdate',
      listener: (event: CharacterBoundsUpdateEvent) => void,
      options?: AddEventListenerOptions,
    ): void;
    /** Fallback overload so this class stays assignable to EventTarget. */
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
  }

  interface HTMLElement {
    editContext: EditContext | null;
  }
}

export {};
