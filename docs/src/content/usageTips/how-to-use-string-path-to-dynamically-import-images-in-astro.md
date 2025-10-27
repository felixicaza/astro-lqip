---
id: 04
title: "How to use string path to dynamically import images in Astro"
---

# How to use string path to dynamically import images in Astro

Similarly, [astro-lqip](https://www.npmjs.com/package/astro-lqip) allows importing images dynamically using string paths. This was developed with developer experience (DX) in mind, as [dynamic imports in Astro](/usage-tips/how-to-import-images-dynamically-in-astro) can be somewhat tricky.

```astro
---
// src/components/Example.astro
import { Picture } from 'astro-lqip/components';

const images = [
  {
    src: '/src/assets/images/image1.jpg',
    alt: 'Image 1',
  },
  {
    src: '/src/assets/images/image2.jpg',
    alt: 'Image 2',
  },
  {
    src: '/src/assets/images/image3.jpg',
    alt: 'Image 3',
  },
];
---

<div>
  {
    images.map(({ src, alt }) => (
      <Picture src={src} alt={alt} width={300} height={300} />
    ))
  }
</div>
```

In this example, an array of objects called `images` is defined, where each object contains the image path (`src`) and the alternative text (`alt`). Then, the `Picture` component from `astro-lqip` is used to render each image using the path provided as a string. This simplifies the process of dynamically importing images in Astro, allowing for greater flexibility and ease of use.

## Another way to import images dynamically

In addition to using an array of objects to map paths, you can also dynamically import images using the `import.meta.glob()` function from [Vite](https://vite.dev/guide/features.html#glob-import). This is useful when you want to load images by defining a single base path.

```astro
---
// src/components/Example.astro
import type { ImageMetadata } from 'astro';

import { Picture } from 'astro-lqip/components';

const getImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/*.{jpeg,jpg,png}'
);
---

<div>
  {
    Object.entries(getImages).map(async (src, index) => {
      const imageResponse = await src();
      const image = imageResponse.default;
      return <Picture src={image} alt={`Image ${index}`} width={300} height={300} />;
    })
  }
</div>
```

In this example, `import.meta.glob()` is used to import all images within the specified folder. Then, the entries of the resulting object are iterated over to render each image using the `Picture` component from `astro-lqip`. The only downside of this approach is that you cannot define custom alternative text for each image, as the paths are generated dynamically. However, it is an efficient way to load multiple images without having to define each path manually.

Thanks to [@SofiDevO](https://github.com/SofiDevO) and [@elstron](https://github.com/elstron) for the discovery.
