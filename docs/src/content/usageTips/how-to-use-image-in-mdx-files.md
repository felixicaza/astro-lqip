---
id: 05
title: "How to use images in MDX files"
isFullHeight: true
---

# How to use images in MDX files

If you’re wondering why there isn’t a guide explaining how to use the `Image` and `Picture` components from [astro-lqip](https://npmjs.com/package/astro-lqip) in Markdown files, the answer is that Markdown does not support custom components. However, with MDX files, you can use these components easily.

As explained in the [guide on how to import images in Astro](/usage-tips/how-to-import-images-in-astro), you need to import each image to use them with the `Image` or `Picture` components. However, thanks to the flexibility of [astro-lqip](https://npmjs.com/package/astro-lqip), you can use image paths directly as string values without explicitly importing them in your MDX files. Here’s an example of how to do it:

```mdx
---
title: "Using images in MDX files"
---
import { Image } from "astro-lqip/components";

# Title of the MDX File

<Image src="/src/assets/images/image.jpg" alt="Description of the image" />
```

As you saw, the `Image` component from `astro-lqip` is used directly with the image path as a string. This simplifies the process and allows you to leverage the capabilities of `astro-lqip` without having to import each image individually.
