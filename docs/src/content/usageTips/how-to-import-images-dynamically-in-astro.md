---
id: 02
title: "How to import images dynamically in Astro"
---

# How to import images dynamically in Astro

To import images dynamically in Astro, a few additional steps are required, since Astro doesn’t allow passing the path directly. However, [astro-lqip](https://npmjs.com/package/astro-lqip) does support this. Even so, let’s take a look at how we can do it.

## Image paths

Suppose you have an image folder in `src/assets/images` and you want to load them based on some dynamic logic, for example, in a carousel.

```text
src/
  assets/
    images/
      image1.jpg
      image2.jpg
      image3.jpg
```

## Creating a file or an array of objects to map the images

Since we need to import the images dynamically, we can create an array of objects or a separate file that maps the corresponding paths. In this case, we’ll create a file called `carousel.ts` inside the `src/data` folder.

```ts
// src/data/carousel.ts
export const images = [
  {
    src: '/src/assets/images/image1.jpg',
    alt: 'Image 1 Description'
  },
  {
    src: '/src/assets/images/image2.jpg',
    alt: 'Image 2 Description'
  },
  {
    src: '/src/assets/images/image3.jpg',
    alt: 'Image 3 Description'
  }
];
```

## Using the images in an Astro component

Now, let’s suppose we want to use these images in an Astro component, which we’ll create in `src/components/Carousel.astro`. In this component, we can import the `carousel.ts` file and then use its paths to render the images. Although in this example we’ll use the `Picture` component from [astro-lqip](https://npmjs.com/package/astro-lqip), the same concept applies to the `Image` component.

```astro
---
// src/components/Carousel.astro
import type { ImageMetadata } from 'astro';

import { images } from '../data/carousel';

import { Picture } from 'astro-lqip/components';

const getImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/*.{jpeg,jpg,png}'
);
---

<div>
  {
    images.map(({ src, alt }) => (
      <Picture
        src={getImages[src]()}
        alt={alt}
        width={300}
        height={300}
      />
    ))
  }
</div>
```

As you may have noticed, to import images dynamically we use `import.meta.glob` and type it with the `ImageMetadata` type provided by Astro. This is necessary so it can handle the paths by matching `getImages[src]()`, since it returns a structure like the following:

```ts
{
  '/src/assets/images/image1.jpg': () => import('/src/assets/images/image1.jpg'),
  '/src/assets/images/image2.jpg': () => import('/src/assets/images/image2.jpg'),
  '/src/assets/images/image3.jpg': () => import('/src/assets/images/image3.jpg')
}
```

In this way, we can import images dynamically in Astro by using a mapping file and `import.meta.glob`. If you’d like to learn more about this topic, I recommend reading the [official Astro guide on dynamic imports](https://docs.astro.build/en/recipes/dynamically-importing-images/).
