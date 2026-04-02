export * from './types/index.ts'

import { Picture as PictureRuntime, type Props as PictureProps } from './components/Picture.ts'
import { Image as ImageRuntime, type Props as ImageProps } from './components/Image.ts'
import { Background as BackgroundRuntime, type Props as BackgroundProps } from './components/Background.ts'

type AstroTypedComponent<Props> = ((props: Props) => unknown) & {
  isAstroComponentFactory?: boolean
  moduleId?: string
}

export const Image = ImageRuntime as unknown as AstroTypedComponent<ImageProps>
export const Picture = PictureRuntime as unknown as AstroTypedComponent<PictureProps>
export const Background = BackgroundRuntime as unknown as AstroTypedComponent<BackgroundProps>
