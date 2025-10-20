export type ImagePath = string | { src: string } | Promise<{ default: { src: string } }>
export type ResolvedImage = { src: string, width?: number, height?: number, [k: string]: unknown }
export type ImportModule = Record<string, unknown> & { default?: unknown }
export type GlobMap = Record<string, () => Promise<ImportModule>>
