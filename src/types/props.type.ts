import type { Props as PictureProps } from 'astro/components/Picture.astro'

import type { LqipType } from './lqip.type'

export type Props = PictureProps & {
  lqip?: LqipType
}
