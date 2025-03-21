/* tslint:disable */
/* eslint-disable */
export function scan_text(text: string, options: any): any;
export function fix(text: string, options: any): string;
export function tokenize(text: string): any;
export function to_monotonic(text: string): string;
export function syllabify(text: string, separator: string): string;

export interface Diagnostic {
  kind: string;
  range: {
    start: number;
    end: number;
  };
  fix: string;
};

export interface Token {
  text: string,
  whitespace: string,
  index: number,
  range: {
    start: number,
    end: number,
  }
  punct: boolean,
  greek: boolean,
}


export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly scan_text: (a: number, b: number, c: any) => [number, number, number];
  readonly fix: (a: number, b: number, c: any) => [number, number];
  readonly tokenize: (a: number, b: number) => [number, number, number];
  readonly to_monotonic: (a: number, b: number) => [number, number];
  readonly syllabify: (a: number, b: number, c: number, d: number) => [number, number];
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_4: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
