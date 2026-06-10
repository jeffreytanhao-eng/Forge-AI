declare module 'ink' {
  import { ComponentType, ReactNode } from 'react';

  interface InkOptions {
    patchConsole?: boolean;
    exitOnCtrlC?: boolean;
  }

  interface Instance {
    waitUntilExit: () => Promise<void>;
    clear: () => void;
    unmount: (error?: Error) => void;
  }

  export function render(node: ReactNode, options?: InkOptions): Instance;

  interface BoxProps {
    children?: ReactNode;
    flexDirection?: 'row' | 'column';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
    padding?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    margin?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    width?: number | string;
    height?: number | string;
    minWidth?: number;
    minHeight?: number;
    gap?: number;
    borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
    borderColor?: string;
  }

  export const Box: ComponentType<BoxProps>;

  interface TextProps {
    children?: ReactNode;
    color?: string;
    backgroundColor?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    dimColor?: boolean;
    inverse?: boolean;
    wrap?: 'truncate' | 'wrap' | 'end';
  }

  export const Text: ComponentType<TextProps>;

  interface StaticProps {
    children?: ReactNode;
  }

  export const Static: ComponentType<StaticProps>;

  interface NewlineProps {
    count?: number;
  }

  export const Newline: ComponentType<NewlineProps>;

  interface SpacerProps {
    children?: ReactNode;
  }

  export const Spacer: ComponentType<SpacerProps>;

  interface Key {
    upArrow: boolean;
    downArrow: boolean;
    leftArrow: boolean;
    rightArrow: boolean;
    return: boolean;
    escape: boolean;
    ctrl: boolean;
    shift: boolean;
    meta: boolean;
    tab: boolean;
    backspace: boolean;
    delete: boolean;
    pageUp: boolean;
    pageDown: boolean;
    home: boolean;
    end: boolean;
  }

  export function useInput(inputHandler: (input: string, key: Key) => void): void;

  interface App {
    exit: (error?: Error) => void;
  }

  export function useApp(): App;

  interface Measure {
    width: number;
    height: number;
  }

  export function useStdout(): { stdout: NodeJS.WriteStream & { columns: number; rows: number } };
  export function useStderr(): { stderr: NodeJS.WriteStream };

  export function useFocusManager(): { focusNext: () => void; focusPrevious: () => void };

  interface Focusable {
    isFocused?: boolean;
  }
}

declare module 'prompts' {
  interface PromptObject<T extends string = string> {
    type: 'confirm' | 'text' | 'number' | 'select' | 'multiselect' | 'password';
    name: T;
    message: string;
    initial?: any;
    choices?: Array<{ title: string; value: any }>;
    validate?: (value: any) => boolean | string;
  }

  function prompts<T extends Record<string, any>>(
    questions: PromptObject | PromptObject[]
  ): Promise<T>;

  export default prompts;
}

declare module 'ink-select-input' {
  import { ComponentType } from 'react';

  interface Item<T = string> {
    label: string;
    value: T;
    key?: string;
  }

  interface SelectInputProps<T = string> {
    items: Item<T>[];
    onSelect: (item: Item<T>) => void;
    indicatorComponent?: ComponentType;
    itemComponent?: ComponentType;
    limit?: number;
    initialIndex?: number;
    isFocused?: boolean;
  }

  const SelectInput: ComponentType<SelectInputProps>;
  export default SelectInput;
}