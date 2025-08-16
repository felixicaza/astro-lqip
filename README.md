<a href="https://astro-lqip.web.app/">
  <img src="./assets/logo.png" alt="Astro LQIP Logo" width="200" height="200" />
</a>

# 🖼️ astro-lqip

[![GitHub Release](https://img.shields.io/github/v/release/felixicaza/astro-lqip?logo=npm)](https://www.npmjs.com/package/astro-lqip)
[![GitHub License](https://img.shields.io/github/license/felixicaza/astro-lqip)](https://github.com/felixicaza/astro-lqip/blob/main/LICENSE)

Native extended Astro components for generating low quality image placeholders (LQIP).

## ⬇️ Installation

NPM:

```bash
npm install astro-lqip
```

PNPM:

```bash
pnpm add astro-lqip
```

Yarn:

```bash
yarn add astro-lqip
```

## 🚀 Usage

In your current Astro project, just replace the import of the native Astro `<Image>` or `<Picture>` components with the ones provided by [astro-lqip](https://astro-lqip.web.app/).

### Image

```diff
- import { Image } from 'astro:assets';
+ import { Image } from 'astro-lqip/components';
```

### Picture

```diff
- import { Picture } from 'astro:assets';
+ import { Picture } from 'astro-lqip/components';
```

Example:

```astro
---
import { Image, Picture } from 'astro-lqip/components';

import image from './path/to/image.png';
import otherImage from './path/to/other-image.png';
---

<Image src={image} alt="Cover Image" width={220} height={220} />
<Picture src={otherImage} alt="Other cover Image" width={220} height={220} />
```

## ⚙️ Props

Both `<Image>` and `<Picture>` components support all the props of the [native Astro components](https://docs.astro.build/en/reference/modules/astro-assets/), but adds a couple of props for LQIP management:

- `lqip`: The LQIP type to use. It can be one of the following:
  - `base64`: Generates a Base64-encoded LQIP image. (default option)
  - `color`: Generates a solid color placeholder. Not compatible with `lqipSize`.
  - `css`: Generates a CSS-based LQIP image.
  - `svg`: Generates an SVG-based LQIP image.
- `lqipSize`: The size of the LQIP image, which can be any number from `4` to `64`. (default is 4)

> [!WARNING]
> A major size in the `lqipSize` prop can significantly impact the performance of your application.

Example:

```astro
---
import { Image, Picture } from 'astro-lqip/components';

import image from './path/to/image.png';
import otherImage from './path/to/other-image.png';
---

<Image src={image} alt="Cover Image" width={220} height={220} lqip="svg" lqipSize={10} />
<Picture src={otherImage} alt="Other cover Image" width={220} height={220} lqip="css" lqipSize={7} />
```

> [!TIP]
> For the `<Image>` component, a `parentAttributes` prop similar to `pictureAttributes` has been added.

## 📝 ToDo

- [x] Add support for Image component.
- [x] Add support for more lqip techniques.
- [ ] Test for remote images.
- [x] Optimize current CSS usage.
- [x] Improve docs page.
- [ ] Test support for SSR mode.

## 💡 Knowledge

Since this integration is built on top of Astro native `<Image>` and `<Picture>` components, you can refer to the [Astro documentation](https://docs.astro.build/en/guides/images/) for more information on how to use it.

## 🤝 Contributing
If you wish to contribute to this project, you can do so by reading the [contribution guide](https://github.com/felixicaza/astro-lqip/blob/main/CONTRIBUTING.md).

## 📄 License
This project is licensed under the MIT License. See the [license file](https://github.com/felixicaza/astro-lqip/blob/main/LICENSE) for more details.
