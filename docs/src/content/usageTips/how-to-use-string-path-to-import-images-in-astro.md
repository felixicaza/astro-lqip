---
id: 03
title: "How to use string path to import images in Astro"
---

# How to use string path to import images in Astro

## Absolute import of images using string paths

Unlike [how images are normally imported in Astro](/usage-tips/how-to-import-images-in-astro), in this usage tip you’ll learn how to import images using absolute paths defined as string values, thanks to [astro-lqip](https://npmjs.com/package/astro-lqip).

```astro
---
// src/components/Example.astro
import { Picture } from 'astro-lqip/components'
---

<Picture src="/src/assets/images/image.jpg" alt="Image Description" />
```

Make sure that the absolute path you use in the `src` attribute starts from the root of your project. In this example, the image is located in the `src/assets/images/` folder, so the absolute path is `/src/assets/images/image.jpg`.

## Relative import of images using string paths

You can also import images using relative paths defined as string values. Here’s an example:

```astro
---
// src/components/Example.astro
import { Picture } from 'astro-lqip/components'
---

<Picture src="../assets/images/image.jpg" alt="Image Description" />
```

Make sure that the relative path you use in the `src` attribute starts from the location of the current file. In this example, the image is located in the `src/assets/images/` folder, so the relative path is `../assets/images/image.jpg`, assuming, for example, that you are inside a file located in `src/components/`.

## Using aliases to import images

Similarly, you can use aliases to import images with string paths. Here’s an example:

```astro
---
// src/components/Example.astro
import { Picture } from 'astro-lqip/components'
---

<Picture src="@assets/images/image.jpg" alt="Image Description" />
```

Make sure that the alias path you use is correctly configured in your project. In this example, the `@assets` alias points to the `src/assets/` folder, so the alias path is `@assets/images/image.jpg`.

### How to configure aliases in Astro

If you’re not sure how to configure aliases in your Astro project, you can do so by modifying the `tsconfig.json` or `jsconfig.json` file at the root of your project. Here’s an example of how to set up an alias for the `src/assets/` folder:


```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@assets/*": ["src/assets/*"]
    }
  }
}
```

If you want to learn more about configuring aliases in Astro, you can check the [official Astro documentation on aliases](https://docs.astro.build/en/guides/imports/#aliases).

As seen in the previous examples, you can import images in Astro using absolute paths, relative paths, or aliases with string values, which makes managing images in your project easier. It’s up to you to choose the method that works best for you, but remember to maintain consistency throughout your project.
