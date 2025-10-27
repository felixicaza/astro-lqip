---
id: 06
title: "How to import remote images in Astro"
---

# How to import remote images in Astro

In Astro, you can import remote images, but the process is not as straightforward as importing local images. Here’s how to do it:

## Add allowed domains

To import images from remote domains, you first need to specify those domains in your Astro configuration. Open your `astro.config.mjs` file and add the allowed domains under the `images` section:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  images: {
    domains: ['example.com', 'another-example.com'],
  },
});
```

## Import the remote image

Once you have configured the allowed domains, you can import remote images in your Astro components by passing the URL directly to the `src` property. Here’s an example:

```astro
---
import { Image } from 'astro-lqip/components';
---

<Image
  src="https://example.com/path/to/image.jpg"
  alt="Description of the image"
  width={600}
  height={400}
/>
```

With these steps, you will be able to import and use remote images in your Astro projects efficiently. Make sure that the domains from which you are importing images are correctly configured in your configuration file to avoid loading issues.
