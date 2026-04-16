<a href="https://astro-lqip.web.app/">
  <img src="./assets/logo.png" alt="Astro LQIP Logo" width="200" height="200" />
</a>

# 🖼️ astro-lqip

[![GitHub Release](https://img.shields.io/github/v/release/felixicaza/astro-lqip?logo=npm)](https://npmx.dev/package/astro-lqip)
[![GitHub License](https://img.shields.io/github/license/felixicaza/astro-lqip)](https://github.com/felixicaza/astro-lqip/blob/main/LICENSE)

Native extended Astro components for generating low-quality image placeholders (LQIP), compatible with `<img>`, `<picture>` and CSS background images.

## ✨ Features
- 🖼️ Supports both `<Image>` and `<Picture>` components and CSS background images.
- 🎨 Multiple LQIP techniques: base64, solid color, CSS via gradients and SVG.
- 🚀 Easy to use, just replace the native Astro components with the ones from [astro-lqip](https://astro-lqip.web.app/).
- ⚡️ Support images as static imports or using string paths.
- 🔧 Fully compatible with [Astro's image optimization features](https://docs.astro.build/en/guides/images/).
- 🌍 Supports both local and remote images.
- ⚙️ Supports SSR mode with [Node Adapter](https://docs.astro.build/en/guides/integrations-guide/node/).

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

In your current Astro project, just replace the import of the native Astro `<Image>` or `<Picture>` components with the ones provided by [astro-lqip](https://astro-lqip.web.app/) or import the `<Background>` component for CSS background images.

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

### Background

```diff
+ import { Background } from 'astro-lqip/components';
```

Example:

```astro
---
import { Image, Picture, Background } from 'astro-lqip/components';

import image from '/src/assets/images/image.png';
import otherImage from '/src/assets/images/other-image.png';
import backgroundImage from '/src/assets/images/background-image.png';
---

<Image src={image} alt="Cover Image" width={220} height={220} />
<Picture src={otherImage} alt="Other Image" width={220} height={220} />
<Background src={backgroundImage}>
  <section>
    <p>Optimized background</p>
  </section>
</Background>

<style>
  section {
    background-image: var(--background);
    background-size: cover;
    background-position: center;
  }
</style>
```

> [!TIP]
> Since version `1.6.0`, you can also put the image path as string directly in the `src` prop. Support absolute paths in `src`, relative paths and alias.

Example with absolute path:

```astro
---
import { Image, Picture, Background } from 'astro-lqip/components';
---

<Image src="/src/assets/images/image.png" alt="Cover Image" width={220} height={220} />
<Picture src="/src/assets/images/other-image.png" alt="Other Image" width={220} height={220} />
<Background src="/src/assets/images/background-image.png">
  <section>
    <p>Optimized background</p>
  </section>
</Background>

<style>
  section {
    background-image: var(--background);
    background-size: cover;
    background-position: center;
  }
</style>
```

Example with relative path:

```astro
---
import { Image, Picture, Background } from 'astro-lqip/components';
---

<!-- assuming you are on the path `/src/pages/index.astro` -->
<Image src="../assets/images/image.png" alt="Cover Image" width={220} height={220} />
<Picture src="../assets/images/other-image.png" alt="Other Image" width={220} height={220} />
<Background src="../assets/images/background-image.png">
  <section>
    <p>Optimized background</p>
  </section>
</Background>

<style>
  section {
    background-image: var(--background);
    background-size: cover;
    background-position: center;
  }
</style>
```

Example with alias:

```astro
---
import { Image, Picture, Background } from 'astro-lqip/components';
---

<Image src="@/assets/images/image.png" alt="Cover Image" width={220} height={220} />
<Picture src="@/assets/images/other-image.png" alt="Other Image" width={220} height={220} />
<Background src="@/assets/images/background-image.png">
  <section>
    <p>Optimized background</p>
  </section>
</Background>

<style>
  section {
    background-image: var(--background);
    background-size: cover;
    background-position: center;
  }
</style>
```

Learn how to configure path aliasing in the [Astro documentation](https://docs.astro.build/en/guides/typescript/#import-aliases). If you want more examples of uses you can see the [Usage Tips](https://astro-lqip.web.app/usage-tips/) page.

## ⚙️ Props

### Image and Picture

Both `<Image>` and `<Picture>` components support all the props of the [native Astro components](https://docs.astro.build/en/reference/modules/astro-assets/), but adds a couple of props for LQIP management:

- `lqip`: The LQIP type to use. It can be one of the following:
  - `base64`: Generates a Base64-encoded LQIP image. (default option)
  - `color`: Generates a solid color placeholder. Not compatible with `lqipSize`.
  - `css`: Generates a CSS-based LQIP image.
  - `svg`: Generates an SVG-based LQIP image.
  - `false`: Disables LQIP generation entirely. The component renders the underlying Astro image unchanged — no placeholder, no `data-astro-lqip` attribute, no `onload` handler.
- `lqipSize`: The size of the LQIP image, which can be any number from `4` to `64`. (default is 4)

> [!WARNING]
> A high value for `lqipSize` can significantly increase the total size of your website.

Example:

```astro
---
import { Image, Picture } from 'astro-lqip/components';

import image from '/src/assets/images/image.png';
import otherImage from '/src/assets/images/other-image.png';
---

<Image src={image} alt="Cover Image" width={220} height={220} lqip="svg" lqipSize={10} />
<Picture src={otherImage} alt="Other Image" width={220} height={220} lqip="css" lqipSize={7} />
```

#### Disabling LQIP

Pass `lqip={false}` to skip LQIP generation entirely. This is useful for faster development, since generating placeholders adds latency to page loads and HMR:

```astro
---
import { Image } from 'astro-lqip/components';

import hero from '/src/assets/images/hero.jpg';
---

<!-- Skip LQIP in development for faster HMR, keep it in production -->
<Image src={hero} alt="Hero" lqip={import.meta.env.DEV ? false : 'color'} />
```

When `lqip={false}`, the `<Image>` component renders without its wrapper `<div>`, and `<Picture>` renders without LQIP-related attributes — identical to using the native Astro components directly.

> [!TIP]
> For the `<Image>` component, a `parentAttributes` prop similar to `pictureAttributes` has been added.

### Background

The `<Background>` component supports the following props:

- `src` (required): The source of the background image located in `src` folder. It can be a static import, absolute path, relative path, alias path or remote URL.
- `lqip`: The LQIP type to use. It can be one of the following:
  - `base64`: Generates a Base64-encoded LQIP image. (default option)
  - `color`: Generates a solid color placeholder.
  - `false`: Disables LQIP generation. The background renders without a placeholder layer.
- `cssVariable`: A string that represents the name of the CSS variable to store the background data.
  - By default, the background data is stored in a CSS variable named `--background`.
  - For responsive backgrounds, the CSS variable names are generated based on the provided widths, following the pattern `--background-small` (lower than 768px), `--background-medium` (768px to 1199px), `--background-large` (1200px to 1919px) and `--background-xlarge` (1920px and above). `--background` is also generated for the largest image for backward compatibility.
  - If the `cssVariable` prop is provided, the generated CSS variable names will follow the pattern `--{cssVariable}-small`, `--{cssVariable}-medium`, `--{cssVariable}-large` and `--{cssVariable}-xlarge`.
- `format`: The image format to use for the background. It can be one of the following in string or an array of strings. If an array is provided, this generates multiple background images with the native [`image-set()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/image/image-set) CSS function, which allows the browser to choose the best format to use based on its support:
  - `avif`
  - `webp` (default option)
  - `jpeg`
  - `png`
- `widths`: An array of numbers that represents the widths to use for responsive background images.
- `width`: The width to use for the background image. This prop is ignored if the `widths` prop is provided.
- `height`: The height to use for the background image. This prop is ignored if the `widths` prop is provided.
- `quality`: The quality to use for the background image. It can be a number from `1` to `100`.
- `fit`: The fit to use for the background image. It can be one of the following:
  - `cover`
  - `contain`
  - `fill`
  - `inside`
  - `outside`

Example:

```astro
---
import { Background } from 'astro-lqip/components';
import backgroundImage from '/src/assets/images/background-image.png';
---

<Background src={backgroundImage} lqip="color" cssVariable="--bg-lqip" format={["avif", "webp"]} width={500} height={300} quality={80} fit="cover">
  <section>
    <p>Optimized background</p>
  </section>
</Background>

<style>
  section {
    background-image: var(--bg-lqip);
    background-size: cover;
    background-position: center;
  }
</style>
```

Example with responsive background:

```astro
---
import { Background } from 'astro-lqip/components';
import backgroundImage from '/src/assets/images/background-image.png';
---

<Background src={backgroundImage} format="avif" widths={[475, 1000, 1536, 2100]}>
  <section>
    <p>Optimized background</p>
  </section>
</Background>

<style>
  section {
    background-image: var(--background-small); /* 475px */
    background-size: cover;
    background-position: center;
  }

  @media (width >= 768px) {
    section {
      background-image: var(--background-medium); /* 1000px */
    }
  }

  @media (width >= 1200px) {
    section {
      background-image: var(--background-large); /* 1536px */
    }
  }

  @media (width >= 1920px) {
    section {
      /* or var(--background), since it's the default variable for the largest image */
      background-image: var(--background-xlarge); /* 2100px */
    }
  }
</style>
```

> [!NOTE]
> The `lqipSize` prop is not compatible with this component, to avoid large CSS outputs.

## 💡 Knowledge

Since this integration is built on top of Astro native `<Image>` and `<Picture>` components, you can refer to the [Astro documentation](https://docs.astro.build/en/guides/images/) for more information on how to use it.

For some simple tips, visit the [Usage Tips](https://astro-lqip.web.app/usage-tips/) page.

## 🤝 Contributing
If you wish to contribute to this project, you can do so by reading the [contribution guide](https://github.com/felixicaza/astro-lqip/blob/main/CONTRIBUTING.md).

## 📄 License
This project is licensed under the MIT License. See the [license file](https://github.com/felixicaza/astro-lqip/blob/main/LICENSE) for more details.
