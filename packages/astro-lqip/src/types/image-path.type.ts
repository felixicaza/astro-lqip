import type { ImageMetadata } from 'astro'

export type ResolvedImage = ImageMetadata & {
  fsPath?: string
}

export type ResolvedImageSource =
  | { kind: 'remote'; astroSrc: string; lqipInput: { src: string } }
  | { kind: 'local'; astroSrc: ResolvedImage; lqipInput: ResolvedImage }
  | { kind: 'public'; astroSrc: ResolvedImage; width: number; height: number; lqipInput: { src: string; fsPath: string } }

export interface ImportModule { default: ResolvedImage }
export type ImagePath = string | ResolvedImage | Promise<ImportModule>
export type GlobMap = Record<string, () => Promise<ImportModule>>
