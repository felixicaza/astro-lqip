---
id: 01
title: "How to import images in Astro"
---

# How to import images in Astro

When working with images in Astro, it’s highly recommended to place them inside the `src` folder of your project. This allows you to import images directly into your Astro components or pages, taking advantage of Astro’s image optimization features.

Typically, you can import images as follows:

```astro
---
// src/index.astro
import { Image } from 'astro-lqip/components';

import image from '../assets/images/image.png';
---

<Image src={image} alt="Description of my image" />
```

This way, Astro can automatically manage and optimize your images, improving your website’s performance. Furthermore, by using the `<Image>` or `<Picture>` components from [astro-lqip](https://npmjs.com/package/astro-lqip), you can take advantage of additional features such as generating [low-quality placeholders](/#:~:text=Props) versions for a better user experience.

## Why shouldn’t we place images in the `public` folder when using these components?

Placing images in Astro’s `public` folder means they won’t be processed or optimized, as stated in the [official Astro documentation](https://docs.astro.build/en/guides/images/#where-to-store-images).

By importing images from the `src` folder, you ensure that Astro can optimize them effectively, leading to faster load times and a better overall user experience. Utilizing components like `<Image>` and `<Picture>` from [astro-lqip](https://npmjs.com/package/astro-lqip) further enhances this by providing features such as [low-quality placeholders](/#:~:text=Props), which improve perceived performance during image loading. Therefore, for optimal image handling in Astro projects, always prefer importing images from the `src` directory over placing them in the `public` folder.

If for some reason you need to use images from the `public` folder, you can do so using the HTML `<img>` tag. Make sure to manually optimize the images before adding them to your project and use absolute paths to reference them:

Image path in the `public` folder:

```text
public/images/image.webp
```

```astro
---
// src/index.astro
---

<img src="/images/image.webp" alt="Description of my image" />
```
