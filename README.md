[![astro-lqip](https://raw.githubusercontent.com/felixicaza/astro-lqip/HEAD/.github/assets/astro-lqip.jpg)](https://astro-lqip.web.app/)

# 🖼️ astro-lqip

[![npm version](https://img.shields.io/npm/v/astro-lqip?color=4dae5f&logo=npm&logoColor=888888&labelColor=ffffff)](https://npmx.dev/package/astro-lqip)
![GitHub actions workflow tests status](https://img.shields.io/github/actions/workflow/status/felixicaza/astro-lqip/tests.yml?color=4dae5f&logo=rocket&logoColor=888888&label=tests&labelColor=ffffff)
[![license](https://img.shields.io/github/license/felixicaza/astro-lqip?color=4dae5f&logo=googledocs&logoColor=888888&labelColor=ffffff)](https://github.com/felixicaza/astro-lqip/blob/main/LICENSE)

Native extended Astro components for generating low-quality image placeholders (LQIP), compatible with `<Image>`, `<Picture>` and CSS background images.

## ✨ Features
- 🖼️ Supports both `<Image>` and `<Picture>` components and CSS background images.
- 🎨 Multiple LQIP techniques: base64, solid color, CSS via gradients and SVG.
- 🚀 Easy to use, just replace the native Astro components by [astro-lqip](https://astro-lqip.web.app/).
- ⚡️ Support images as static imports or using string paths.
- 🔧 Fully compatible with [Astro's image optimization features](https://docs.astro.build/en/guides/images/).
- 🌍 Supports both local and remote images.
- ⚙️ Supports SSR mode with [Node Adapter](https://docs.astro.build/en/guides/integrations-guide/node/).

## 📦 Installation

You can install [`astro-lqip`](https://astro-lqip.web.app/) using npm:

```sh
$ npm install astro-lqip
```

<details>
  <summary>Using a different package manager?</summary>
  <br/>

  Using pnpm:
  ```sh
  $ pnpm add astro-lqip
  ```

  Using yarn:
  ```sh
  $ yarn add astro-lqip
  ```

  Using bun:
  ```sh
  $ bun add astro-lqip
  ```
</details>

## 🚀 Usage

In your current Astro project, just replace the import of the native Astro `<Image>` or `<Picture>` components by [astro-lqip](https://astro-lqip.web.app/) or import the `<Background>` component for optimized CSS background images.

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
>
>
> <details>
>  <summary>Example with absolute path</summary>
>  <br/>
>
>  ```astro
>  ---
>  import { Image, Picture, Background } from 'astro-lqip/components';
>  ---
>
>  <Image src="/src/assets/images/image.png" alt="Cover Image" width={220} height={220} />
>  <Picture src="/src/assets/images/other-image.png" alt="Other Image" width={220} height={220} />
>  <Background src="/src/assets/images/background-image.png">
>    <section>
>      <p>Optimized background</p>
>    </section>
>  </Background>
>
>  <style>
>    section {
>      background-image: var(--background);
>      background-size: cover;
>      background-position: center;
>    }
>  </style>
>  ```
> </details>
>
> <details>
>  <summary>Example with relative path</summary>
>  <br/>
>
>  ```astro
>  ---
>  import { Image, Picture, Background } from 'astro-lqip/components';
>  ---
>
>  <!-- assuming you are on the path `/src/pages/index.astro` -->
>  <Image src="../assets/images/image.png" alt="Cover Image" width={220} height={220} />
>  <Picture src="../assets/images/other-image.png" alt="Other Image" width={220} height={220} />
>  <Background src="../assets/images/background-image.png">
>    <section>
>      <p>Optimized background</p>
>    </section>
>  </Background>
>
>  <style>
>    section {
>      background-image: var(--background);
>      background-size: cover;
>      background-position: center;
>    }
>  </style>
>  ```
> </details>
>
> <details>
>  <summary>Example with alias</summary>
>  <br/>
>
>  ```astro
>  ---
>  import { Image, Picture, Background } from 'astro-lqip/components';
>  ---
>
>  <Image src="@/assets/images/image.png" alt="Cover Image" width={220} height={220} />
>  <Picture src="@/assets/images/other-image.png" alt="Other Image" width={220} height={220} />
>  <Background src="@/assets/images/background-image.png">
>    <section>
>      <p>Optimized background</p>
>    </section>
>  </Background>
>
>  <style>
>    section {
>      background-image: var(--background);
>      background-size: cover;
>      background-position: center;
>    }
>  </style>
>  ```
> </details>

Learn how to configure path aliasing in the [Astro documentation](https://docs.astro.build/en/guides/typescript/#import-aliases). If you want more examples of uses you can see the [Usage Tips](https://astro-lqip.web.app/usage-tips/) page.

## ⚙️ Props

### 🔩 Image and Picture

Both `<Image>` and `<Picture>` components support all the props of the [native Astro components](https://docs.astro.build/en/reference/modules/astro-assets/), but adds a couple of props for LQIP management:

#### `lqip` (string) — optional
The LQIP type to use. It can be one of the following:
- `base64` (default) — Base64-encoded LQIP image
- `color` — Solid color placeholder
- `css` — CSS-based LQIP image
- `svg` — SVG-based LQIP image
- `false` — Disables LQIP generation

#### `lqipSize` (number) — optional (default 4)
The size of the LQIP image, which can be any number from `4` to `64`.

> [!WARNING]
> A high value for `lqipSize` can significantly increase the total size of your website.

<details>
  <summary>Example</summary>
  <br/>

  ```astro
  ---
  import { Image, Picture } from 'astro-lqip/components';

  import image from '/src/assets/images/image.png';
  import otherImage from '/src/assets/images/other-image.png';
  ---

  <Image src={image} alt="Cover Image" width={220} height={220} lqip="svg" lqipSize={10} />
  <Picture src={otherImage} alt="Other Image" width={220} height={220} lqip="css" lqipSize={7} />
  ```
</details>

> [!TIP]
> For the `<Image>` component, a `parentAttributes` prop similar to [`pictureAttributes`](https://docs.astro.build/en/reference/modules/astro-assets/#pictureattributes) has been added.

<details>
  <summary>Example</summary>
  <br/>

  ```astro
  ---
  import { Image } from 'astro-lqip/components';

  import image from '/src/assets/images/image.png';
  ---

  <Image
    src={image}
    alt="Cover Image"
    width={220}
    height={220}
    lqip="svg"
    lqipSize={10}
    parentAttributes={{ style: "background-color: red;" }}
  />
  ```
</details>

### 🔩 Background

The `<Background>` component supports the following props:

#### `src` (string) — required
The source of the background image located in `src` folder. It can be a static import, absolute path, relative path, alias path or remote URL.

#### `lqip` — optional
The LQIP type to use. It can be one of the following:
- `base64` (default) — Base64-encoded LQIP image
- `color` — Solid color placeholder
- `css` — CSS-based LQIP image
- `svg` — SVG-based LQIP image
- `false` — Disables LQIP generation

#### `cssVariable` (string) — optional
Represents the name of the CSS variable to store the background data.

- By default, the background data is stored in a CSS variable named `--background`.
- For responsive backgrounds, the CSS variable names are generated based on the provided widths, following the pattern:
  - `--background-small` (lower than 768px)
  - `--background-medium` (768px to 1199px)
  - `--background-large` (1200px to 1919px)
  - `--background-xlarge` (1920px and above), `--background` is also generated for the largest image for backward compatibility.
- If the `cssVariable` prop is provided, the generated CSS variable names will follow the pattern:
  - `--{cssVariable}-small`
  - `--{cssVariable}-medium`
  - `--{cssVariable}-large`
  - `--{cssVariable}-xlarge`, `--{cssVariable}` is also generated for the largest image for backward compatibility.

#### `format` (string | array&lt;string&gt;) — optional
The image format to use for the background. It can be one of the following in string or an array of strings. If an array is provided, this generates multiple background images with the native [`image-set()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/image/image-set) CSS function, which allows the browser to choose the best format to use based on its support:
- `avif`
- `webp` (default)
- `jpeg`
- `png`


#### `widths` (array) — optional
An array of numbers that represents the widths to use for responsive background images.

#### `width` (number) — optional
The width to use for the background image. This prop is ignored if the `widths` prop is provided.

#### `height` (number) — optional
The height to use for the background image. This prop is ignored if the `widths` prop is provided.

#### `quality` (number) — optional
The quality to use for the background image. It can be a number from `1` to `100`.

#### `fit` (string) — optional
The fit to use for the background image. It can be one of the following:
- `cover` (default)
- `contain`
- `fill`
- `inside`
- `outside`

<details>
  <summary>Example</summary>
  <br/>

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
</details>

<details>
  <summary>Example with responsive background</summary>
  <br/>

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
</details>

> [!NOTE]
> The `lqipSize` prop is not compatible with this component, to avoid large CSS outputs.

## 💡 Knowledge
Since this integration is built on top of Astro native `<Image>` and `<Picture>` components, you can refer to the [Astro documentation](https://docs.astro.build/en/guides/images/) for more information on how to use it.

For some simple tips, visit the [Usage Tips](https://astro-lqip.web.app/usage-tips/) page.

## 🤝 Contributing
Contributions to this library are welcome! If you have any ideas for improvements or new features, please feel free to open an issue or submit a pull request. I appreciate your help in making [`astro-lqip`](https://astro-lqip.web.app/) better for everyone. Please read the [CONTRIBUTING.md](https://github.com/felixicaza/astro-lqip/blob/main/CONTRIBUTING.md).

## 📄 License
This project is licensed under the MIT License. See the [LICENSE](https://github.com/felixicaza/astro-lqip/blob/main/LICENSE) file for details.
