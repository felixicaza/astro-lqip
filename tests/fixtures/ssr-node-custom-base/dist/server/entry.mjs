import fs, { createReadStream } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import { AsyncLocalStorage } from 'node:async_hooks';
import path from 'node:path';
import { Readable } from 'node:stream';
import { Http2ServerResponse } from 'node:http2';
import url from 'node:url';
import require$$0$2 from 'path';
import require$$1 from 'tty';
import require$$1$1 from 'util';
import require$$0$3 from 'os';
import require$$0$4 from 'crypto';
import require$$1$2 from 'fs';
import require$$13 from 'stream';

function appendForwardSlash(path) {
  return path.endsWith("/") ? path : path + "/";
}
function prependForwardSlash$1(path) {
  return path[0] === "/" ? path : "/" + path;
}
const MANY_LEADING_SLASHES = /^\/{2,}/;
function collapseDuplicateLeadingSlashes(path) {
  if (!path) {
    return path;
  }
  return path.replace(MANY_LEADING_SLASHES, "/");
}
const MANY_SLASHES = /\/{2,}/g;
function collapseDuplicateSlashes(path) {
  if (!path) {
    return path;
  }
  return path.replace(MANY_SLASHES, "/");
}
const MANY_TRAILING_SLASHES = /\/{2,}$/g;
function collapseDuplicateTrailingSlashes(path, trailingSlash) {
  if (!path) {
    return path;
  }
  return path.replace(MANY_TRAILING_SLASHES, trailingSlash ? "/" : "") || "/";
}
function removeTrailingForwardSlash(path) {
  return path.endsWith("/") ? path.slice(0, path.length - 1) : path;
}
function removeLeadingForwardSlash(path) {
  return path.startsWith("/") ? path.substring(1) : path;
}
function trimSlashes(path) {
  return path.replace(/^\/|\/$/g, "");
}
function isString(path) {
  return typeof path === "string" || path instanceof String;
}
const INTERNAL_PREFIXES = /* @__PURE__ */ new Set(["/_", "/@", "/.", "//"]);
const JUST_SLASHES = /^\/{2,}$/;
function isInternalPath(path) {
  return INTERNAL_PREFIXES.has(path.slice(0, 2)) && !JUST_SLASHES.test(path);
}
function joinPaths(...paths) {
  return paths.filter(isString).map((path, i) => {
    if (i === 0) {
      return removeTrailingForwardSlash(path);
    } else if (i === paths.length - 1) {
      return removeLeadingForwardSlash(path);
    } else {
      return trimSlashes(path);
    }
  }).join("/");
}
function slash(path) {
  return path.replace(/\\/g, "/");
}
function fileExtension(path) {
  const ext = path.split(".").pop();
  return ext !== path ? `.${ext}` : "";
}
const WITH_FILE_EXT = /\/[^/]+\.\w+$/;
function hasFileExtension(path) {
  return WITH_FILE_EXT.test(path);
}

function matchPattern(url, remotePattern) {
  return matchProtocol(url, remotePattern.protocol) && matchHostname(url, remotePattern.hostname, true) && matchPort(url, remotePattern.port) && matchPathname(url, remotePattern.pathname, true);
}
function matchPort(url, port) {
  return !port || port === url.port;
}
function matchProtocol(url, protocol) {
  return !protocol || protocol === url.protocol.slice(0, -1);
}
function matchHostname(url, hostname, allowWildcard = false) {
  if (!hostname) {
    return true;
  } else if (!allowWildcard || !hostname.startsWith("*")) {
    return hostname === url.hostname;
  } else if (hostname.startsWith("**.")) {
    const slicedHostname = hostname.slice(2);
    return slicedHostname !== url.hostname && url.hostname.endsWith(slicedHostname);
  } else if (hostname.startsWith("*.")) {
    const slicedHostname = hostname.slice(1);
    if (!url.hostname.endsWith(slicedHostname)) {
      return false;
    }
    const subdomainWithDot = url.hostname.slice(0, -(slicedHostname.length - 1));
    return subdomainWithDot.endsWith(".") && !subdomainWithDot.slice(0, -1).includes(".");
  }
  return false;
}
function matchPathname(url, pathname, allowWildcard = false) {
  if (!pathname) {
    return true;
  } else if (!allowWildcard || !pathname.endsWith("*")) {
    return pathname === url.pathname;
  } else if (pathname.endsWith("/**")) {
    const slicedPathname = pathname.slice(0, -2);
    return slicedPathname !== url.pathname && url.pathname.startsWith(slicedPathname);
  } else if (pathname.endsWith("/*")) {
    const slicedPathname = pathname.slice(0, -1);
    if (!url.pathname.startsWith(slicedPathname)) {
      return false;
    }
    const additionalPathChunks = url.pathname.slice(slicedPathname.length).split("/").filter(Boolean);
    return additionalPathChunks.length === 1;
  }
  return false;
}

function normalizeLF(code) {
  return code.replace(/\r\n|\r(?!\n)|\n/g, "\n");
}

function codeFrame(src, loc) {
  if (!loc || loc.line === void 0 || loc.column === void 0) {
    return "";
  }
  const lines = normalizeLF(src).split("\n").map((ln) => ln.replace(/\t/g, "  "));
  const visibleLines = [];
  for (let n = -2; n <= 2; n++) {
    if (lines[loc.line + n]) visibleLines.push(loc.line + n);
  }
  let gutterWidth = 0;
  for (const lineNo of visibleLines) {
    let w = `> ${lineNo}`;
    if (w.length > gutterWidth) gutterWidth = w.length;
  }
  let output = "";
  for (const lineNo of visibleLines) {
    const isFocusedLine = lineNo === loc.line - 1;
    output += isFocusedLine ? "> " : "  ";
    output += `${lineNo + 1} | ${lines[lineNo]}
`;
    if (isFocusedLine)
      output += `${Array.from({ length: gutterWidth }).join(" ")}  | ${Array.from({
        length: loc.column
      }).join(" ")}^
`;
  }
  return output;
}

class AstroError extends Error {
  loc;
  title;
  hint;
  frame;
  type = "AstroError";
  constructor(props, options) {
    const { name, title, message, stack, location, hint, frame } = props;
    super(message, options);
    this.title = title;
    this.name = name;
    if (message) this.message = message;
    this.stack = stack ? stack : this.stack;
    this.loc = location;
    this.hint = hint;
    this.frame = frame;
  }
  setLocation(location) {
    this.loc = location;
  }
  setName(name) {
    this.name = name;
  }
  setMessage(message) {
    this.message = message;
  }
  setHint(hint) {
    this.hint = hint;
  }
  setFrame(source, location) {
    this.frame = codeFrame(source, location);
  }
  static is(err) {
    return err?.type === "AstroError";
  }
}

const ClientAddressNotAvailable = {
  name: "ClientAddressNotAvailable",
  title: "`Astro.clientAddress` is not available in current adapter.",
  message: (adapterName) => `\`Astro.clientAddress\` is not available in the \`${adapterName}\` adapter. File an issue with the adapter to add support.`
};
const PrerenderClientAddressNotAvailable = {
  name: "PrerenderClientAddressNotAvailable",
  title: "`Astro.clientAddress` cannot be used inside prerendered routes.",
  message: (name) => `\`Astro.clientAddress\` cannot be used inside prerendered route ${name}`
};
const StaticClientAddressNotAvailable = {
  name: "StaticClientAddressNotAvailable",
  title: "`Astro.clientAddress` is not available in prerendered pages.",
  message: "`Astro.clientAddress` is only available on pages that are server-rendered.",
  hint: "See https://docs.astro.build/en/guides/on-demand-rendering/ for more information on how to enable SSR."
};
const NoMatchingStaticPathFound = {
  name: "NoMatchingStaticPathFound",
  title: "No static path found for requested path.",
  message: (pathName) => `A \`getStaticPaths()\` route pattern was matched, but no matching static path was found for requested path \`${pathName}\`.`,
  hint: (possibleRoutes) => `Possible dynamic routes being matched: ${possibleRoutes.join(", ")}.`
};
const OnlyResponseCanBeReturned = {
  name: "OnlyResponseCanBeReturned",
  title: "Invalid type returned by Astro page.",
  message: (route, returnedValue) => `Route \`${route ? route : ""}\` returned a \`${returnedValue}\`. Only a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) can be returned from Astro files.`,
  hint: "See https://docs.astro.build/en/guides/on-demand-rendering/#response for more information."
};
const MissingMediaQueryDirective = {
  name: "MissingMediaQueryDirective",
  title: "Missing value for `client:media` directive.",
  message: 'Media query not provided for `client:media` directive. A media query similar to `client:media="(max-width: 600px)"` must be provided'
};
const NoMatchingRenderer = {
  name: "NoMatchingRenderer",
  title: "No matching renderer found.",
  message: (componentName, componentExtension, plural, validRenderersCount) => `Unable to render \`${componentName}\`.

${validRenderersCount > 0 ? `There ${plural ? "are" : "is"} ${validRenderersCount} renderer${plural ? "s" : ""} configured in your \`astro.config.mjs\` file,
but ${plural ? "none were" : "it was not"} able to server-side render \`${componentName}\`.` : `No valid renderer was found ${componentExtension ? `for the \`.${componentExtension}\` file extension.` : `for this file extension.`}`}`,
  hint: (probableRenderers) => `Did you mean to enable the ${probableRenderers} integration?

See https://docs.astro.build/en/guides/framework-components/ for more information on how to install and configure integrations.`
};
const NoClientOnlyHint = {
  name: "NoClientOnlyHint",
  title: "Missing hint on client:only directive.",
  message: (componentName) => `Unable to render \`${componentName}\`. When using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.`,
  hint: (probableRenderers) => `Did you mean to pass \`client:only="${probableRenderers}"\`? See https://docs.astro.build/en/reference/directives-reference/#clientonly for more information on client:only`
};
const InvalidGetStaticPathsEntry = {
  name: "InvalidGetStaticPathsEntry",
  title: "Invalid entry inside getStaticPath's return value",
  message: (entryType) => `Invalid entry returned by getStaticPaths. Expected an object, got \`${entryType}\``,
  hint: "If you're using a `.map` call, you might be looking for `.flatMap()` instead. See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
};
const InvalidGetStaticPathsReturn = {
  name: "InvalidGetStaticPathsReturn",
  title: "Invalid value returned by getStaticPaths.",
  message: (returnType) => `Invalid type returned by \`getStaticPaths\`. Expected an \`array\`, got \`${returnType}\``,
  hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
};
const GetStaticPathsExpectedParams = {
  name: "GetStaticPathsExpectedParams",
  title: "Missing params property on `getStaticPaths` route.",
  message: "Missing or empty required `params` property on `getStaticPaths` route.",
  hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
};
const GetStaticPathsInvalidRouteParam = {
  name: "GetStaticPathsInvalidRouteParam",
  title: "Invalid route parameter returned by `getStaticPaths()`.",
  message: (key, value, valueType) => `Invalid \`getStaticPaths()\` route parameter for \`${key}\`. Expected a string or undefined, received \`${valueType}\` (\`${value}\`)`,
  hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
};
const GetStaticPathsRequired = {
  name: "GetStaticPathsRequired",
  title: "`getStaticPaths()` function required for dynamic routes.",
  message: "`getStaticPaths()` function is required for dynamic routes. Make sure that you `export` a `getStaticPaths` function from your dynamic route.",
  hint: `See https://docs.astro.build/en/guides/routing/#dynamic-routes for more information on dynamic routes.

	If you meant for this route to be server-rendered, set \`export const prerender = false;\` in the page.`
};
const ReservedSlotName = {
  name: "ReservedSlotName",
  title: "Invalid slot name.",
  message: (slotName) => `Unable to create a slot named \`${slotName}\`. \`${slotName}\` is a reserved slot name. Please update the name of this slot.`
};
const NoMatchingImport = {
  name: "NoMatchingImport",
  title: "No import found for component.",
  message: (componentName) => `Could not render \`${componentName}\`. No matching import has been found for \`${componentName}\`.`,
  hint: "Please make sure the component is properly imported."
};
const PageNumberParamNotFound = {
  name: "PageNumberParamNotFound",
  title: "Page number param not found.",
  message: (paramName) => `[paginate()] page number param \`${paramName}\` not found in your filepath.`,
  hint: "Rename your file to `[page].astro` or `[...page].astro`."
};
const PrerenderDynamicEndpointPathCollide = {
  name: "PrerenderDynamicEndpointPathCollide",
  title: "Prerendered dynamic endpoint has path collision.",
  message: (pathname) => `Could not render \`${pathname}\` with an \`undefined\` param as the generated path will collide during prerendering. Prevent passing \`undefined\` as \`params\` for the endpoint's \`getStaticPaths()\` function, or add an additional extension to the endpoint's filename.`,
  hint: (filename) => `Rename \`${filename}\` to \`${filename.replace(/\.(?:js|ts)/, (m) => `.json` + m)}\``
};
const ResponseSentError = {
  name: "ResponseSentError",
  title: "Unable to set response.",
  message: "The response has already been sent to the browser and cannot be altered."
};
const MiddlewareNoDataOrNextCalled = {
  name: "MiddlewareNoDataOrNextCalled",
  title: "The middleware didn't return a `Response`.",
  message: "Make sure your middleware returns a `Response` object, either directly or by returning the `Response` from calling the `next` function."
};
const MiddlewareNotAResponse = {
  name: "MiddlewareNotAResponse",
  title: "The middleware returned something that is not a `Response` object.",
  message: "Any data returned from middleware must be a valid `Response` object."
};
const EndpointDidNotReturnAResponse = {
  name: "EndpointDidNotReturnAResponse",
  title: "The endpoint did not return a `Response`.",
  message: "An endpoint must return either a `Response`, or a `Promise` that resolves with a `Response`."
};
const LocalsNotAnObject = {
  name: "LocalsNotAnObject",
  title: "Value assigned to `locals` is not accepted.",
  message: "`locals` can only be assigned to an object. Other values like numbers, strings, etc. are not accepted.",
  hint: "If you tried to remove some information from the `locals` object, try to use `delete` or set the property to `undefined`."
};
const LocalsReassigned = {
  name: "LocalsReassigned",
  title: "`locals` must not be reassigned.",
  message: "`locals` cannot be assigned directly.",
  hint: "Set a `locals` property instead."
};
const AstroResponseHeadersReassigned = {
  name: "AstroResponseHeadersReassigned",
  title: "`Astro.response.headers` must not be reassigned.",
  message: "Individual headers can be added to and removed from `Astro.response.headers`, but it must not be replaced with another instance of `Headers` altogether.",
  hint: "Consider using `Astro.response.headers.add()`, and `Astro.response.headers.delete()`."
};
const i18nNoLocaleFoundInPath = {
  name: "i18nNoLocaleFoundInPath",
  title: "The path doesn't contain any locale",
  message: "You tried to use an i18n utility on a path that doesn't contain any locale. You can use `pathHasLocale` first to determine if the path has a locale."
};
const RewriteWithBodyUsed = {
  name: "RewriteWithBodyUsed",
  title: "Cannot use Astro.rewrite after the request body has been read",
  message: "Astro.rewrite() cannot be used if the request body has already been read. If you need to read the body, first clone the request."
};
const ForbiddenRewrite = {
  name: "ForbiddenRewrite",
  title: "Forbidden rewrite to a static route.",
  message: (from, to, component) => `You tried to rewrite the on-demand route '${from}' with the static route '${to}', when using the 'server' output. 

The static route '${to}' is rendered by the component
'${component}', which is marked as prerendered. This is a forbidden operation because during the build, the component '${component}' is compiled to an
HTML file, which can't be retrieved at runtime by Astro.`,
  hint: (component) => `Add \`export const prerender = false\` to the component '${component}', or use a Astro.redirect().`
};
const ActionsReturnedInvalidDataError = {
  name: "ActionsReturnedInvalidDataError",
  title: "Action handler returned invalid data.",
  message: (error) => `Action handler returned invalid data. Handlers should return serializable data types like objects, arrays, strings, and numbers. Parse error: ${error}`,
  hint: "See the devalue library for all supported types: https://github.com/rich-harris/devalue"
};
const ActionNotFoundError = {
  name: "ActionNotFoundError",
  title: "Action not found.",
  message: (actionName) => `The server received a request for an action named \`${actionName}\` but could not find a match. If you renamed an action, check that you've updated your \`actions/index\` file and your calling code to match.`,
  hint: "You can run `astro check` to detect type errors caused by mismatched action names."
};
const SessionStorageInitError = {
  name: "SessionStorageInitError",
  title: "Session storage could not be initialized.",
  message: (error, driver) => `Error when initializing session storage${driver ? ` with driver \`${driver}\`` : ""}. \`${error ?? ""}\``,
  hint: "For more information, see https://docs.astro.build/en/guides/sessions/"
};
const SessionStorageSaveError = {
  name: "SessionStorageSaveError",
  title: "Session data could not be saved.",
  message: (error, driver) => `Error when saving session data${driver ? ` with driver \`${driver}\`` : ""}. \`${error ?? ""}\``,
  hint: "For more information, see https://docs.astro.build/en/guides/sessions/"
};
const CacheNotEnabled = {
  name: "CacheNotEnabled",
  title: "Cache is not enabled.",
  message: "`Astro.cache` is not available because the cache feature is not enabled. To use caching, configure a cache provider in your Astro config under `experimental.cache`.",
  hint: 'Use an adapter that provides a default cache provider, or set one explicitly: `experimental: { cache: { provider: "..." } }`. See https://docs.astro.build/en/reference/experimental-flags/route-caching/.'
};

const decoder$2 = new TextDecoder();
const toUTF8String = (input, start = 0, end = input.length) => decoder$2.decode(input.slice(start, end));
const toHexString = (input, start = 0, end = input.length) => input.slice(start, end).reduce((memo, i) => memo + `0${i.toString(16)}`.slice(-2), "");
const getView = (input, offset) => new DataView(input.buffer, input.byteOffset + offset);
const readInt16LE = (input, offset = 0) => getView(input, offset).getInt16(0, true);
const readUInt16BE = (input, offset = 0) => getView(input, offset).getUint16(0, false);
const readUInt16LE = (input, offset = 0) => getView(input, offset).getUint16(0, true);
const readUInt24LE = (input, offset = 0) => {
  const view = getView(input, offset);
  return view.getUint16(0, true) + (view.getUint8(2) << 16);
};
const readInt32LE = (input, offset = 0) => getView(input, offset).getInt32(0, true);
const readUInt32BE = (input, offset = 0) => getView(input, offset).getUint32(0, false);
const readUInt32LE = (input, offset = 0) => getView(input, offset).getUint32(0, true);
const readUInt64 = (input, offset, isBigEndian) => getView(input, offset).getBigUint64(0, !isBigEndian);
const methods = {
  readUInt16BE,
  readUInt16LE,
  readUInt32BE,
  readUInt32LE
};
function readUInt(input, bits, offset = 0, isBigEndian = false) {
  const endian = isBigEndian ? "BE" : "LE";
  const methodName = `readUInt${bits}${endian}`;
  return methods[methodName](input, offset);
}
function readBox(input, offset) {
  if (input.length - offset < 4) return;
  const boxSize = readUInt32BE(input, offset);
  if (input.length - offset < boxSize) return;
  return {
    name: toUTF8String(input, 4 + offset, 8 + offset),
    offset,
    size: boxSize
  };
}
function findBox(input, boxName, currentOffset) {
  while (currentOffset < input.length) {
    const box = readBox(input, currentOffset);
    if (!box) break;
    if (box.name === boxName) return box;
    currentOffset += box.size > 0 ? box.size : 8;
  }
}

const BMP = {
  validate: (input) => toUTF8String(input, 0, 2) === "BM",
  calculate: (input) => ({
    height: Math.abs(readInt32LE(input, 22)),
    width: readUInt32LE(input, 18)
  })
};

const TYPE_ICON = 1;
const SIZE_HEADER$1 = 2 + 2 + 2;
const SIZE_IMAGE_ENTRY = 1 + 1 + 1 + 1 + 2 + 2 + 4 + 4;
function getSizeFromOffset(input, offset) {
  const value = input[offset];
  return value === 0 ? 256 : value;
}
function getImageSize$1(input, imageIndex) {
  const offset = SIZE_HEADER$1 + imageIndex * SIZE_IMAGE_ENTRY;
  return {
    height: getSizeFromOffset(input, offset + 1),
    width: getSizeFromOffset(input, offset)
  };
}
const ICO = {
  validate(input) {
    const reserved = readUInt16LE(input, 0);
    const imageCount = readUInt16LE(input, 4);
    if (reserved !== 0 || imageCount === 0) return false;
    const imageType = readUInt16LE(input, 2);
    return imageType === TYPE_ICON;
  },
  calculate(input) {
    const nbImages = readUInt16LE(input, 4);
    const imageSize = getImageSize$1(input, 0);
    if (nbImages === 1) return imageSize;
    const images = [];
    for (let imageIndex = 0; imageIndex < nbImages; imageIndex += 1) {
      images.push(getImageSize$1(input, imageIndex));
    }
    return {
      width: imageSize.width,
      height: imageSize.height,
      images
    };
  }
};

const TYPE_CURSOR = 2;
const CUR = {
  validate(input) {
    const reserved = readUInt16LE(input, 0);
    const imageCount = readUInt16LE(input, 4);
    if (reserved !== 0 || imageCount === 0) return false;
    const imageType = readUInt16LE(input, 2);
    return imageType === TYPE_CURSOR;
  },
  calculate: (input) => ICO.calculate(input)
};

const DDS = {
  validate: (input) => readUInt32LE(input, 0) === 542327876,
  calculate: (input) => ({
    height: readUInt32LE(input, 12),
    width: readUInt32LE(input, 16)
  })
};

const gifRegexp = /^GIF8[79]a/;
const GIF = {
  validate: (input) => gifRegexp.test(toUTF8String(input, 0, 6)),
  calculate: (input) => ({
    height: readUInt16LE(input, 8),
    width: readUInt16LE(input, 6)
  })
};

const brandMap = {
  avif: "avif",
  avis: "avif",
  // avif-sequence
  mif1: "heif",
  msf1: "heif",
  // heif-sequence
  heic: "heic",
  heix: "heic",
  hevc: "heic",
  // heic-sequence
  hevx: "heic"
  // heic-sequence
};
function detectType(input, start, end) {
  let hasAvif = false;
  let hasHeic = false;
  let hasHeif = false;
  for (let i = start; i <= end; i += 4) {
    const brand = toUTF8String(input, i, i + 4);
    if (brand === "avif" || brand === "avis") hasAvif = true;
    else if (brand === "heic" || brand === "heix" || brand === "hevc" || brand === "hevx") hasHeic = true;
    else if (brand === "mif1" || brand === "msf1") hasHeif = true;
  }
  if (hasAvif) return "avif";
  if (hasHeic) return "heic";
  if (hasHeif) return "heif";
}
const HEIF = {
  validate(input) {
    const boxType = toUTF8String(input, 4, 8);
    if (boxType !== "ftyp") return false;
    const ftypBox = findBox(input, "ftyp", 0);
    if (!ftypBox) return false;
    const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12);
    return brand in brandMap;
  },
  calculate(input) {
    const metaBox = findBox(input, "meta", 0);
    const iprpBox = metaBox && findBox(input, "iprp", metaBox.offset + 12);
    const ipcoBox = iprpBox && findBox(input, "ipco", iprpBox.offset + 8);
    if (!ipcoBox) {
      throw new TypeError("Invalid HEIF, no ipco box found");
    }
    const type = detectType(input, 8, metaBox.offset);
    const images = [];
    let currentOffset = ipcoBox.offset + 8;
    while (currentOffset < ipcoBox.offset + ipcoBox.size) {
      const ispeBox = findBox(input, "ispe", currentOffset);
      if (!ispeBox) break;
      const rawWidth = readUInt32BE(input, ispeBox.offset + 12);
      const rawHeight = readUInt32BE(input, ispeBox.offset + 16);
      const clapBox = findBox(input, "clap", currentOffset);
      let width = rawWidth;
      let height = rawHeight;
      if (clapBox && clapBox.offset < ipcoBox.offset + ipcoBox.size) {
        const cropRight = readUInt32BE(input, clapBox.offset + 12);
        width = rawWidth - cropRight;
      }
      images.push({ height, width });
      currentOffset = ispeBox.offset + ispeBox.size;
    }
    if (images.length === 0) {
      throw new TypeError("Invalid HEIF, no sizes found");
    }
    return {
      width: images[0].width,
      height: images[0].height,
      type,
      ...images.length > 1 ? { images } : {}
    };
  }
};

const SIZE_HEADER = 4 + 4;
const FILE_LENGTH_OFFSET = 4;
const ENTRY_LENGTH_OFFSET = 4;
const ICON_TYPE_SIZE = {
  ICON: 32,
  "ICN#": 32,
  // m => 16 x 16
  "icm#": 16,
  icm4: 16,
  icm8: 16,
  // s => 16 x 16
  "ics#": 16,
  ics4: 16,
  ics8: 16,
  is32: 16,
  s8mk: 16,
  icp4: 16,
  // l => 32 x 32
  icl4: 32,
  icl8: 32,
  il32: 32,
  l8mk: 32,
  icp5: 32,
  ic11: 32,
  // h => 48 x 48
  ich4: 48,
  ich8: 48,
  ih32: 48,
  h8mk: 48,
  // . => 64 x 64
  icp6: 64,
  ic12: 32,
  // t => 128 x 128
  it32: 128,
  t8mk: 128,
  ic07: 128,
  // . => 256 x 256
  ic08: 256,
  ic13: 256,
  // . => 512 x 512
  ic09: 512,
  ic14: 512,
  // . => 1024 x 1024
  ic10: 1024
};
function readImageHeader(input, imageOffset) {
  const imageLengthOffset = imageOffset + ENTRY_LENGTH_OFFSET;
  return [
    toUTF8String(input, imageOffset, imageLengthOffset),
    readUInt32BE(input, imageLengthOffset)
  ];
}
function getImageSize(type) {
  const size = ICON_TYPE_SIZE[type];
  return { width: size, height: size, type };
}
const ICNS = {
  validate: (input) => toUTF8String(input, 0, 4) === "icns",
  calculate(input) {
    const inputLength = input.length;
    const fileLength = readUInt32BE(input, FILE_LENGTH_OFFSET);
    let imageOffset = SIZE_HEADER;
    const images = [];
    while (imageOffset < fileLength && imageOffset < inputLength) {
      const imageHeader = readImageHeader(input, imageOffset);
      const imageSize = getImageSize(imageHeader[0]);
      images.push(imageSize);
      imageOffset += imageHeader[1];
    }
    if (images.length === 0) {
      throw new TypeError("Invalid ICNS, no sizes found");
    }
    return {
      width: images[0].width,
      height: images[0].height,
      ...images.length > 1 ? { images } : {}
    };
  }
};

const J2C = {
  // TODO: this doesn't seem right. SIZ marker doesn't have to be right after the SOC
  validate: (input) => readUInt32BE(input, 0) === 4283432785,
  calculate: (input) => ({
    height: readUInt32BE(input, 12),
    width: readUInt32BE(input, 8)
  })
};

const JP2 = {
  validate(input) {
    const boxType = toUTF8String(input, 4, 8);
    if (boxType !== "jP  ") return false;
    const ftypBox = findBox(input, "ftyp", 0);
    if (!ftypBox) return false;
    const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12);
    return brand === "jp2 ";
  },
  calculate(input) {
    const jp2hBox = findBox(input, "jp2h", 0);
    const ihdrBox = jp2hBox && findBox(input, "ihdr", jp2hBox.offset + 8);
    if (ihdrBox) {
      return {
        height: readUInt32BE(input, ihdrBox.offset + 8),
        width: readUInt32BE(input, ihdrBox.offset + 12)
      };
    }
    throw new TypeError("Unsupported JPEG 2000 format");
  }
};

const EXIF_MARKER = "45786966";
const APP1_DATA_SIZE_BYTES = 2;
const EXIF_HEADER_BYTES = 6;
const TIFF_BYTE_ALIGN_BYTES = 2;
const BIG_ENDIAN_BYTE_ALIGN = "4d4d";
const LITTLE_ENDIAN_BYTE_ALIGN = "4949";
const IDF_ENTRY_BYTES = 12;
const NUM_DIRECTORY_ENTRIES_BYTES = 2;
function isEXIF(input) {
  return toHexString(input, 2, 6) === EXIF_MARKER;
}
function extractSize(input, index) {
  return {
    height: readUInt16BE(input, index),
    width: readUInt16BE(input, index + 2)
  };
}
function extractOrientation(exifBlock, isBigEndian) {
  const idfOffset = 8;
  const offset = EXIF_HEADER_BYTES + idfOffset;
  const idfDirectoryEntries = readUInt(exifBlock, 16, offset, isBigEndian);
  for (let directoryEntryNumber = 0; directoryEntryNumber < idfDirectoryEntries; directoryEntryNumber++) {
    const start = offset + NUM_DIRECTORY_ENTRIES_BYTES + directoryEntryNumber * IDF_ENTRY_BYTES;
    const end = start + IDF_ENTRY_BYTES;
    if (start > exifBlock.length) {
      return;
    }
    const block = exifBlock.slice(start, end);
    const tagNumber = readUInt(block, 16, 0, isBigEndian);
    if (tagNumber === 274) {
      const dataFormat = readUInt(block, 16, 2, isBigEndian);
      if (dataFormat !== 3) {
        return;
      }
      const numberOfComponents = readUInt(block, 32, 4, isBigEndian);
      if (numberOfComponents !== 1) {
        return;
      }
      return readUInt(block, 16, 8, isBigEndian);
    }
  }
}
function validateExifBlock(input, index) {
  const exifBlock = input.slice(APP1_DATA_SIZE_BYTES, index);
  const byteAlign = toHexString(
    exifBlock,
    EXIF_HEADER_BYTES,
    EXIF_HEADER_BYTES + TIFF_BYTE_ALIGN_BYTES
  );
  const isBigEndian = byteAlign === BIG_ENDIAN_BYTE_ALIGN;
  const isLittleEndian = byteAlign === LITTLE_ENDIAN_BYTE_ALIGN;
  if (isBigEndian || isLittleEndian) {
    return extractOrientation(exifBlock, isBigEndian);
  }
}
function validateInput(input, index) {
  if (index > input.length) {
    throw new TypeError("Corrupt JPG, exceeded buffer limits");
  }
}
const JPG = {
  validate: (input) => toHexString(input, 0, 2) === "ffd8",
  calculate(_input) {
    let input = _input.slice(4);
    let orientation;
    let next;
    while (input.length) {
      const i = readUInt16BE(input, 0);
      validateInput(input, i);
      if (input[i] !== 255) {
        input = input.slice(1);
        continue;
      }
      if (isEXIF(input)) {
        orientation = validateExifBlock(input, i);
      }
      next = input[i + 1];
      if (next === 192 || next === 193 || next === 194) {
        const size = extractSize(input, i + 5);
        if (!orientation) {
          return size;
        }
        return {
          height: size.height,
          orientation,
          width: size.width
        };
      }
      input = input.slice(i + 2);
    }
    throw new TypeError("Invalid JPG, no size found");
  }
};

class BitReader {
  constructor(input, endianness) {
    this.input = input;
    this.endianness = endianness;
  }
  // Skip the first 16 bits (2 bytes) of signature
  byteOffset = 2;
  bitOffset = 0;
  /** Reads a specified number of bits, and move the offset */
  getBits(length = 1) {
    let result = 0;
    let bitsRead = 0;
    while (bitsRead < length) {
      if (this.byteOffset >= this.input.length) {
        throw new Error("Reached end of input");
      }
      const currentByte = this.input[this.byteOffset];
      const bitsLeft = 8 - this.bitOffset;
      const bitsToRead = Math.min(length - bitsRead, bitsLeft);
      if (this.endianness === "little-endian") {
        const mask = (1 << bitsToRead) - 1;
        const bits = currentByte >> this.bitOffset & mask;
        result |= bits << bitsRead;
      } else {
        const mask = (1 << bitsToRead) - 1 << 8 - this.bitOffset - bitsToRead;
        const bits = (currentByte & mask) >> 8 - this.bitOffset - bitsToRead;
        result = result << bitsToRead | bits;
      }
      bitsRead += bitsToRead;
      this.bitOffset += bitsToRead;
      if (this.bitOffset === 8) {
        this.byteOffset++;
        this.bitOffset = 0;
      }
    }
    return result;
  }
}

function calculateImageDimension(reader, isSmallImage) {
  if (isSmallImage) {
    return 8 * (1 + reader.getBits(5));
  }
  const sizeClass = reader.getBits(2);
  const extraBits = [9, 13, 18, 30][sizeClass];
  return 1 + reader.getBits(extraBits);
}
function calculateImageWidth(reader, isSmallImage, widthMode, height) {
  if (isSmallImage && widthMode === 0) {
    return 8 * (1 + reader.getBits(5));
  }
  if (widthMode === 0) {
    return calculateImageDimension(reader, false);
  }
  const aspectRatios = [1, 1.2, 4 / 3, 1.5, 16 / 9, 5 / 4, 2];
  return Math.floor(height * aspectRatios[widthMode - 1]);
}
const JXLStream = {
  validate: (input) => {
    return toHexString(input, 0, 2) === "ff0a";
  },
  calculate(input) {
    const reader = new BitReader(input, "little-endian");
    const isSmallImage = reader.getBits(1) === 1;
    const height = calculateImageDimension(reader, isSmallImage);
    const widthMode = reader.getBits(3);
    const width = calculateImageWidth(reader, isSmallImage, widthMode, height);
    return { width, height };
  }
};

function extractCodestream(input) {
  const jxlcBox = findBox(input, "jxlc", 0);
  if (jxlcBox) {
    return input.slice(jxlcBox.offset + 8, jxlcBox.offset + jxlcBox.size);
  }
  const partialStreams = extractPartialStreams(input);
  if (partialStreams.length > 0) {
    return concatenateCodestreams(partialStreams);
  }
  return void 0;
}
function extractPartialStreams(input) {
  const partialStreams = [];
  let offset = 0;
  while (offset < input.length) {
    const jxlpBox = findBox(input, "jxlp", offset);
    if (!jxlpBox) break;
    partialStreams.push(
      input.slice(jxlpBox.offset + 12, jxlpBox.offset + jxlpBox.size)
    );
    offset = jxlpBox.offset + jxlpBox.size;
  }
  return partialStreams;
}
function concatenateCodestreams(partialCodestreams) {
  const totalLength = partialCodestreams.reduce(
    (acc, curr) => acc + curr.length,
    0
  );
  const codestream = new Uint8Array(totalLength);
  let position = 0;
  for (const partial of partialCodestreams) {
    codestream.set(partial, position);
    position += partial.length;
  }
  return codestream;
}
const JXL = {
  validate: (input) => {
    const boxType = toUTF8String(input, 4, 8);
    if (boxType !== "JXL ") return false;
    const ftypBox = findBox(input, "ftyp", 0);
    if (!ftypBox) return false;
    const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12);
    return brand === "jxl ";
  },
  calculate(input) {
    const codestream = extractCodestream(input);
    if (codestream) return JXLStream.calculate(codestream);
    throw new Error("No codestream found in JXL container");
  }
};

const KTX = {
  validate: (input) => {
    const signature = toUTF8String(input, 1, 7);
    return ["KTX 11", "KTX 20"].includes(signature);
  },
  calculate: (input) => {
    const type = input[5] === 49 ? "ktx" : "ktx2";
    const offset = type === "ktx" ? 36 : 20;
    return {
      height: readUInt32LE(input, offset + 4),
      width: readUInt32LE(input, offset),
      type
    };
  }
};

const pngSignature = "PNG\r\n\n";
const pngImageHeaderChunkName = "IHDR";
const pngFriedChunkName = "CgBI";
const PNG = {
  validate(input) {
    if (pngSignature === toUTF8String(input, 1, 8)) {
      let chunkName = toUTF8String(input, 12, 16);
      if (chunkName === pngFriedChunkName) {
        chunkName = toUTF8String(input, 28, 32);
      }
      if (chunkName !== pngImageHeaderChunkName) {
        throw new TypeError("Invalid PNG");
      }
      return true;
    }
    return false;
  },
  calculate(input) {
    if (toUTF8String(input, 12, 16) === pngFriedChunkName) {
      return {
        height: readUInt32BE(input, 36),
        width: readUInt32BE(input, 32)
      };
    }
    return {
      height: readUInt32BE(input, 20),
      width: readUInt32BE(input, 16)
    };
  }
};

const PNMTypes = {
  P1: "pbm/ascii",
  P2: "pgm/ascii",
  P3: "ppm/ascii",
  P4: "pbm",
  P5: "pgm",
  P6: "ppm",
  P7: "pam",
  PF: "pfm"
};
const handlers = {
  default: (lines) => {
    let dimensions = [];
    while (lines.length > 0) {
      const line = lines.shift();
      if (line[0] === "#") {
        continue;
      }
      dimensions = line.split(" ");
      break;
    }
    if (dimensions.length === 2) {
      return {
        height: Number.parseInt(dimensions[1], 10),
        width: Number.parseInt(dimensions[0], 10)
      };
    }
    throw new TypeError("Invalid PNM");
  },
  pam: (lines) => {
    const size = {};
    while (lines.length > 0) {
      const line = lines.shift();
      if (line.length > 16 || line.charCodeAt(0) > 128) {
        continue;
      }
      const [key, value] = line.split(" ");
      if (key && value) {
        size[key.toLowerCase()] = Number.parseInt(value, 10);
      }
      if (size.height && size.width) {
        break;
      }
    }
    if (size.height && size.width) {
      return {
        height: size.height,
        width: size.width
      };
    }
    throw new TypeError("Invalid PAM");
  }
};
const PNM = {
  validate: (input) => toUTF8String(input, 0, 2) in PNMTypes,
  calculate(input) {
    const signature = toUTF8String(input, 0, 2);
    const type = PNMTypes[signature];
    const lines = toUTF8String(input, 3).split(/[\r\n]+/);
    const handler = handlers[type] || handlers.default;
    return handler(lines);
  }
};

const PSD = {
  validate: (input) => toUTF8String(input, 0, 4) === "8BPS",
  calculate: (input) => ({
    height: readUInt32BE(input, 14),
    width: readUInt32BE(input, 18)
  })
};

const svgReg = /<svg\s([^>"']|"[^"]*"|'[^']*')*>/;
const extractorRegExps = {
  height: /\sheight=(['"])([^%]+?)\1/,
  root: svgReg,
  viewbox: /\sviewBox=(['"])(.+?)\1/i,
  width: /\swidth=(['"])([^%]+?)\1/
};
const INCH_CM = 2.54;
const units = {
  in: 96,
  cm: 96 / INCH_CM,
  em: 16,
  ex: 8,
  m: 96 / INCH_CM * 100,
  mm: 96 / INCH_CM / 10,
  pc: 96 / 72 / 12,
  pt: 96 / 72,
  px: 1
};
const unitsReg = new RegExp(
  `^([0-9.]+(?:e\\d+)?)(${Object.keys(units).join("|")})?$`
);
function parseLength(len) {
  const m = unitsReg.exec(len);
  if (!m) {
    return void 0;
  }
  return Math.round(Number(m[1]) * (units[m[2]] || 1));
}
function parseViewbox(viewbox) {
  const bounds = viewbox.split(" ");
  return {
    height: parseLength(bounds[3]),
    width: parseLength(bounds[2])
  };
}
function parseAttributes(root) {
  const width = extractorRegExps.width.exec(root);
  const height = extractorRegExps.height.exec(root);
  const viewbox = extractorRegExps.viewbox.exec(root);
  return {
    height: height && parseLength(height[2]),
    viewbox: viewbox && parseViewbox(viewbox[2]),
    width: width && parseLength(width[2])
  };
}
function calculateByDimensions(attrs) {
  return {
    height: attrs.height,
    width: attrs.width
  };
}
function calculateByViewbox(attrs, viewbox) {
  const ratio = viewbox.width / viewbox.height;
  if (attrs.width) {
    return {
      height: Math.floor(attrs.width / ratio),
      width: attrs.width
    };
  }
  if (attrs.height) {
    return {
      height: attrs.height,
      width: Math.floor(attrs.height * ratio)
    };
  }
  return {
    height: viewbox.height,
    width: viewbox.width
  };
}
const SVG = {
  // Scan only the first kilo-byte to speed up the check on larger files
  validate: (input) => svgReg.test(toUTF8String(input, 0, 1e3)),
  calculate(input) {
    const root = extractorRegExps.root.exec(toUTF8String(input));
    if (root) {
      const attrs = parseAttributes(root[0]);
      if (attrs.width && attrs.height) {
        return calculateByDimensions(attrs);
      }
      if (attrs.viewbox) {
        return calculateByViewbox(attrs, attrs.viewbox);
      }
    }
    throw new TypeError("Invalid SVG");
  }
};

const TGA = {
  validate(input) {
    return readUInt16LE(input, 0) === 0 && readUInt16LE(input, 4) === 0;
  },
  calculate(input) {
    return {
      height: readUInt16LE(input, 14),
      width: readUInt16LE(input, 12)
    };
  }
};

const CONSTANTS = {
  TAG: {
    WIDTH: 256,
    HEIGHT: 257,
    COMPRESSION: 259
  },
  TYPE: {
    SHORT: 3,
    LONG: 4,
    LONG8: 16
  },
  ENTRY_SIZE: {
    STANDARD: 12,
    BIG: 20
  },
  COUNT_SIZE: {
    STANDARD: 2,
    BIG: 8
  }
};
function readIFD(input, { isBigEndian, isBigTiff }) {
  const ifdOffset = isBigTiff ? Number(readUInt64(input, 8, isBigEndian)) : readUInt(input, 32, 4, isBigEndian);
  const entryCountSize = isBigTiff ? CONSTANTS.COUNT_SIZE.BIG : CONSTANTS.COUNT_SIZE.STANDARD;
  return input.slice(ifdOffset + entryCountSize);
}
function readTagValue(input, type, offset, isBigEndian) {
  switch (type) {
    case CONSTANTS.TYPE.SHORT:
      return readUInt(input, 16, offset, isBigEndian);
    case CONSTANTS.TYPE.LONG:
      return readUInt(input, 32, offset, isBigEndian);
    case CONSTANTS.TYPE.LONG8: {
      const value = Number(readUInt64(input, offset, isBigEndian));
      if (value > Number.MAX_SAFE_INTEGER) {
        throw new TypeError("Value too large");
      }
      return value;
    }
    default:
      return 0;
  }
}
function nextTag(input, isBigTiff) {
  const entrySize = isBigTiff ? CONSTANTS.ENTRY_SIZE.BIG : CONSTANTS.ENTRY_SIZE.STANDARD;
  if (input.length > entrySize) {
    return input.slice(entrySize);
  }
}
function extractTags(input, { isBigEndian, isBigTiff }) {
  const tags = {};
  let temp = input;
  while (temp?.length) {
    const code = readUInt(temp, 16, 0, isBigEndian);
    const type = readUInt(temp, 16, 2, isBigEndian);
    const length = isBigTiff ? Number(readUInt64(temp, 4, isBigEndian)) : readUInt(temp, 32, 4, isBigEndian);
    if (code === 0) break;
    if (length === 1 && (type === CONSTANTS.TYPE.SHORT || type === CONSTANTS.TYPE.LONG || isBigTiff && type === CONSTANTS.TYPE.LONG8)) {
      const valueOffset = isBigTiff ? 12 : 8;
      tags[code] = readTagValue(temp, type, valueOffset, isBigEndian);
    }
    temp = nextTag(temp, isBigTiff);
  }
  return tags;
}
function determineFormat(input) {
  const signature = toUTF8String(input, 0, 2);
  const version = readUInt(input, 16, 2, signature === "MM");
  return {
    isBigEndian: signature === "MM",
    isBigTiff: version === 43
  };
}
function validateBigTIFFHeader(input, isBigEndian) {
  const byteSize = readUInt(input, 16, 4, isBigEndian);
  const reserved = readUInt(input, 16, 6, isBigEndian);
  if (byteSize !== 8 || reserved !== 0) {
    throw new TypeError("Invalid BigTIFF header");
  }
}
const signatures = /* @__PURE__ */ new Set([
  "49492a00",
  // Little Endian
  "4d4d002a",
  // Big Endian
  "49492b00",
  // BigTIFF Little Endian
  "4d4d002b"
  // BigTIFF Big Endian
]);
const TIFF = {
  validate: (input) => {
    const signature = toHexString(input, 0, 4);
    return signatures.has(signature);
  },
  calculate(input) {
    const format = determineFormat(input);
    if (format.isBigTiff) {
      validateBigTIFFHeader(input, format.isBigEndian);
    }
    const ifdBuffer = readIFD(input, format);
    const tags = extractTags(ifdBuffer, format);
    const info = {
      height: tags[CONSTANTS.TAG.HEIGHT],
      width: tags[CONSTANTS.TAG.WIDTH],
      type: format.isBigTiff ? "bigtiff" : "tiff"
    };
    if (tags[CONSTANTS.TAG.COMPRESSION]) {
      info.compression = tags[CONSTANTS.TAG.COMPRESSION];
    }
    if (!info.width || !info.height) {
      throw new TypeError("Invalid Tiff. Missing tags");
    }
    return info;
  }
};

function calculateExtended(input) {
  return {
    height: 1 + readUInt24LE(input, 7),
    width: 1 + readUInt24LE(input, 4)
  };
}
function calculateLossless(input) {
  return {
    height: 1 + ((input[4] & 15) << 10 | input[3] << 2 | (input[2] & 192) >> 6),
    width: 1 + ((input[2] & 63) << 8 | input[1])
  };
}
function calculateLossy(input) {
  return {
    height: readInt16LE(input, 8) & 16383,
    width: readInt16LE(input, 6) & 16383
  };
}
const WEBP = {
  validate(input) {
    const riffHeader = "RIFF" === toUTF8String(input, 0, 4);
    const webpHeader = "WEBP" === toUTF8String(input, 8, 12);
    const vp8Header = "VP8" === toUTF8String(input, 12, 15);
    return riffHeader && webpHeader && vp8Header;
  },
  calculate(_input) {
    const chunkHeader = toUTF8String(_input, 12, 16);
    const input = _input.slice(20, 30);
    if (chunkHeader === "VP8X") {
      const extendedHeader = input[0];
      const validStart = (extendedHeader & 192) === 0;
      const validEnd = (extendedHeader & 1) === 0;
      if (validStart && validEnd) {
        return calculateExtended(input);
      }
      throw new TypeError("Invalid WebP");
    }
    if (chunkHeader === "VP8 " && input[0] !== 47) {
      return calculateLossy(input);
    }
    const signature = toHexString(input, 3, 6);
    if (chunkHeader === "VP8L" && signature !== "9d012a") {
      return calculateLossless(input);
    }
    throw new TypeError("Invalid WebP");
  }
};

const typeHandlers = /* @__PURE__ */ new Map([
  ["bmp", BMP],
  ["cur", CUR],
  ["dds", DDS],
  ["gif", GIF],
  ["heif", HEIF],
  ["icns", ICNS],
  ["ico", ICO],
  ["j2c", J2C],
  ["jp2", JP2],
  ["jpg", JPG],
  ["jxl", JXL],
  ["jxl-stream", JXLStream],
  ["ktx", KTX],
  ["png", PNG],
  ["pnm", PNM],
  ["psd", PSD],
  ["svg", SVG],
  ["tga", TGA],
  ["tiff", TIFF],
  ["webp", WEBP]
]);
Array.from(typeHandlers.keys());

function shouldAppendForwardSlash(trailingSlash, buildFormat) {
  switch (trailingSlash) {
    case "always":
      return true;
    case "never":
      return false;
    case "ignore": {
      switch (buildFormat) {
        case "directory":
          return true;
        case "preserve":
        case "file":
          return false;
      }
    }
  }
}

const ASTRO_VERSION = "6.1.2";
const ASTRO_GENERATOR = `Astro v${ASTRO_VERSION}`;
const REROUTE_DIRECTIVE_HEADER = "X-Astro-Reroute";
const REWRITE_DIRECTIVE_HEADER_KEY = "X-Astro-Rewrite";
const REWRITE_DIRECTIVE_HEADER_VALUE = "yes";
const NOOP_MIDDLEWARE_HEADER = "X-Astro-Noop";
const ROUTE_TYPE_HEADER = "X-Astro-Route-Type";
const DEFAULT_404_COMPONENT = "astro-default-404.astro";
const REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308, 300, 304];
const REROUTABLE_STATUS_CODES = [404, 500];
const clientAddressSymbol = /* @__PURE__ */ Symbol.for("astro.clientAddress");
const originPathnameSymbol = /* @__PURE__ */ Symbol.for("astro.originPathname");
const pipelineSymbol = /* @__PURE__ */ Symbol.for("astro.pipeline");
const nodeRequestAbortControllerCleanupSymbol = /* @__PURE__ */ Symbol.for(
  "astro.nodeRequestAbortControllerCleanup"
);
const responseSentSymbol$1 = /* @__PURE__ */ Symbol.for("astro.responseSent");

function computeFallbackRoute(options) {
  const {
    pathname,
    responseStatus,
    fallback,
    fallbackType,
    locales,
    defaultLocale,
    strategy,
    base
  } = options;
  if (responseStatus !== 404) {
    return { type: "none" };
  }
  if (!fallback || Object.keys(fallback).length === 0) {
    return { type: "none" };
  }
  const segments = pathname.split("/");
  const urlLocale = segments.find((segment) => {
    for (const locale of locales) {
      if (typeof locale === "string") {
        if (locale === segment) {
          return true;
        }
      } else if (locale.path === segment) {
        return true;
      }
    }
    return false;
  });
  if (!urlLocale) {
    return { type: "none" };
  }
  const fallbackKeys = Object.keys(fallback);
  if (!fallbackKeys.includes(urlLocale)) {
    return { type: "none" };
  }
  const fallbackLocale = fallback[urlLocale];
  const pathFallbackLocale = getPathByLocale(fallbackLocale, locales);
  let newPathname;
  if (pathFallbackLocale === defaultLocale && strategy === "pathname-prefix-other-locales") {
    if (pathname.includes(`${base}`)) {
      newPathname = pathname.replace(`/${urlLocale}`, ``);
    } else {
      newPathname = pathname.replace(`/${urlLocale}`, `/`);
    }
  } else {
    newPathname = pathname.replace(`/${urlLocale}`, `/${pathFallbackLocale}`);
  }
  return {
    type: fallbackType,
    pathname: newPathname
  };
}

class I18nRouter {
  #strategy;
  #defaultLocale;
  #locales;
  #base;
  #domains;
  constructor(options) {
    this.#strategy = options.strategy;
    this.#defaultLocale = options.defaultLocale;
    this.#locales = options.locales;
    this.#base = options.base === "/" ? "/" : removeTrailingForwardSlash(options.base || "");
    this.#domains = options.domains;
  }
  /**
   * Evaluate routing strategy for a pathname.
   * Returns decision object (not HTTP Response).
   */
  match(pathname, context) {
    if (this.shouldSkipProcessing(pathname, context)) {
      return { type: "continue" };
    }
    switch (this.#strategy) {
      case "manual":
        return { type: "continue" };
      case "pathname-prefix-always":
        return this.matchPrefixAlways(pathname, context);
      case "domains-prefix-always":
        if (this.localeHasntDomain(context.currentLocale, context.currentDomain)) {
          return { type: "continue" };
        }
        return this.matchPrefixAlways(pathname, context);
      case "pathname-prefix-other-locales":
        return this.matchPrefixOtherLocales(pathname, context);
      case "domains-prefix-other-locales":
        if (this.localeHasntDomain(context.currentLocale, context.currentDomain)) {
          return { type: "continue" };
        }
        return this.matchPrefixOtherLocales(pathname, context);
      case "pathname-prefix-always-no-redirect":
        return this.matchPrefixAlwaysNoRedirect(pathname, context);
      case "domains-prefix-always-no-redirect":
        if (this.localeHasntDomain(context.currentLocale, context.currentDomain)) {
          return { type: "continue" };
        }
        return this.matchPrefixAlwaysNoRedirect(pathname, context);
      default:
        return { type: "continue" };
    }
  }
  /**
   * Check if i18n processing should be skipped for this request
   */
  shouldSkipProcessing(pathname, context) {
    if (pathname.includes("/404") || pathname.includes("/500")) {
      return true;
    }
    if (pathname.includes("/_server-islands/")) {
      return true;
    }
    if (context.isReroute) {
      return true;
    }
    if (context.routeType && context.routeType !== "page" && context.routeType !== "fallback") {
      return true;
    }
    return false;
  }
  /**
   * Strategy: pathname-prefix-always
   * All locales must have a prefix, including the default locale.
   */
  matchPrefixAlways(pathname, _context) {
    const isRoot = pathname === this.#base + "/" || pathname === this.#base;
    if (isRoot) {
      const basePrefix = this.#base === "/" ? "" : this.#base;
      return {
        type: "redirect",
        location: `${basePrefix}/${this.#defaultLocale}`
      };
    }
    if (!pathHasLocale(pathname, this.#locales)) {
      return { type: "notFound" };
    }
    return { type: "continue" };
  }
  /**
   * Strategy: pathname-prefix-other-locales
   * Default locale has no prefix, other locales must have a prefix.
   */
  matchPrefixOtherLocales(pathname, _context) {
    let pathnameContainsDefaultLocale = false;
    for (const segment of pathname.split("/")) {
      if (normalizeTheLocale(segment) === normalizeTheLocale(this.#defaultLocale)) {
        pathnameContainsDefaultLocale = true;
        break;
      }
    }
    if (pathnameContainsDefaultLocale) {
      const newLocation = pathname.replace(`/${this.#defaultLocale}`, "");
      return {
        type: "notFound",
        location: newLocation
      };
    }
    return { type: "continue" };
  }
  /**
   * Strategy: pathname-prefix-always-no-redirect
   * Like prefix-always but allows root to serve instead of redirecting
   */
  matchPrefixAlwaysNoRedirect(pathname, _context) {
    const isRoot = pathname === this.#base + "/" || pathname === this.#base;
    if (isRoot) {
      return { type: "continue" };
    }
    if (!pathHasLocale(pathname, this.#locales)) {
      return { type: "notFound" };
    }
    return { type: "continue" };
  }
  /**
   * Check if the current locale doesn't belong to the configured domain.
   * Used for domain-based routing strategies.
   */
  localeHasntDomain(currentLocale, currentDomain) {
    if (!this.#domains || !currentDomain) {
      return false;
    }
    if (!currentLocale) {
      return false;
    }
    const localesForDomain = this.#domains[currentDomain];
    if (!localesForDomain) {
      return true;
    }
    return !localesForDomain.includes(currentLocale);
  }
}

function createI18nMiddleware(i18n, base, trailingSlash, format) {
  if (!i18n) return (_, next) => next();
  const i18nRouter = new I18nRouter({
    strategy: i18n.strategy,
    defaultLocale: i18n.defaultLocale,
    locales: i18n.locales,
    base,
    domains: i18n.domainLookupTable ? Object.keys(i18n.domainLookupTable).reduce(
      (acc, domain) => {
        const locale = i18n.domainLookupTable[domain];
        if (!acc[domain]) {
          acc[domain] = [];
        }
        acc[domain].push(locale);
        return acc;
      },
      {}
    ) : void 0
  });
  return async (context, next) => {
    const response = await next();
    const typeHeader = response.headers.get(ROUTE_TYPE_HEADER);
    const isReroute = response.headers.get(REROUTE_DIRECTIVE_HEADER);
    if (isReroute === "no" && typeof i18n.fallback === "undefined") {
      return response;
    }
    if (typeHeader !== "page" && typeHeader !== "fallback") {
      return response;
    }
    const routerContext = {
      currentLocale: context.currentLocale,
      currentDomain: context.url.hostname,
      routeType: typeHeader,
      isReroute: isReroute === "yes"
    };
    const routeDecision = i18nRouter.match(context.url.pathname, routerContext);
    switch (routeDecision.type) {
      case "redirect": {
        let location = routeDecision.location;
        if (shouldAppendForwardSlash(trailingSlash, format)) {
          location = appendForwardSlash(location);
        }
        return context.redirect(location, routeDecision.status);
      }
      case "notFound": {
        if (context.isPrerendered) {
          const prerenderedRes = new Response(response.body, {
            status: 404,
            headers: response.headers
          });
          prerenderedRes.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
          if (routeDecision.location) {
            prerenderedRes.headers.set("Location", routeDecision.location);
          }
          return prerenderedRes;
        }
        const headers = new Headers();
        if (routeDecision.location) {
          headers.set("Location", routeDecision.location);
        }
        return new Response(null, { status: 404, headers });
      }
    }
    if (i18n.fallback && i18n.fallbackType) {
      const fallbackDecision = computeFallbackRoute({
        pathname: context.url.pathname,
        responseStatus: response.status,
        currentLocale: context.currentLocale,
        fallback: i18n.fallback,
        fallbackType: i18n.fallbackType,
        locales: i18n.locales,
        defaultLocale: i18n.defaultLocale,
        strategy: i18n.strategy,
        base
      });
      switch (fallbackDecision.type) {
        case "redirect":
          return context.redirect(fallbackDecision.pathname + context.url.search);
        case "rewrite":
          return await context.rewrite(fallbackDecision.pathname + context.url.search);
      }
    }
    return response;
  };
}

function pathHasLocale(path, locales) {
  const segments = path.split("/").map(normalizeThePath);
  for (const segment of segments) {
    for (const locale of locales) {
      if (typeof locale === "string") {
        if (normalizeTheLocale(segment) === normalizeTheLocale(locale)) {
          return true;
        }
      } else if (segment === locale.path) {
        return true;
      }
    }
  }
  return false;
}
function getPathByLocale(locale, locales) {
  for (const loopLocale of locales) {
    if (typeof loopLocale === "string") {
      if (loopLocale === locale) {
        return loopLocale;
      }
    } else {
      for (const code of loopLocale.codes) {
        if (code === locale) {
          return loopLocale.path;
        }
      }
    }
  }
  throw new AstroError(i18nNoLocaleFoundInPath);
}
function normalizeTheLocale(locale) {
  return locale.replaceAll("_", "-").toLowerCase();
}
function normalizeThePath(path) {
  return path.endsWith(".html") ? path.slice(0, -5) : path;
}
function getAllCodes(locales) {
  const result = [];
  for (const loopLocale of locales) {
    if (typeof loopLocale === "string") {
      result.push(loopLocale);
    } else {
      result.push(...loopLocale.codes);
    }
  }
  return result;
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var dist = {};

var hasRequiredDist;

function requireDist () {
	if (hasRequiredDist) return dist;
	hasRequiredDist = 1;
	Object.defineProperty(dist, "__esModule", { value: true });
	dist.parseCookie = parseCookie;
	dist.parse = parseCookie;
	dist.stringifyCookie = stringifyCookie;
	dist.stringifySetCookie = stringifySetCookie;
	dist.serialize = stringifySetCookie;
	dist.parseSetCookie = parseSetCookie;
	dist.stringifySetCookie = stringifySetCookie;
	dist.serialize = stringifySetCookie;
	/**
	 * RegExp to match cookie-name in RFC 6265 sec 4.1.1
	 * This refers out to the obsoleted definition of token in RFC 2616 sec 2.2
	 * which has been replaced by the token definition in RFC 7230 appendix B.
	 *
	 * cookie-name       = token
	 * token             = 1*tchar
	 * tchar             = "!" / "#" / "$" / "%" / "&" / "'" /
	 *                     "*" / "+" / "-" / "." / "^" / "_" /
	 *                     "`" / "|" / "~" / DIGIT / ALPHA
	 *
	 * Note: Allowing more characters - https://github.com/jshttp/cookie/issues/191
	 * Allow same range as cookie value, except `=`, which delimits end of name.
	 */
	const cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
	/**
	 * RegExp to match cookie-value in RFC 6265 sec 4.1.1
	 *
	 * cookie-value      = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )
	 * cookie-octet      = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
	 *                     ; US-ASCII characters excluding CTLs,
	 *                     ; whitespace DQUOTE, comma, semicolon,
	 *                     ; and backslash
	 *
	 * Allowing more characters: https://github.com/jshttp/cookie/issues/191
	 * Comma, backslash, and DQUOTE are not part of the parsing algorithm.
	 */
	const cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
	/**
	 * RegExp to match domain-value in RFC 6265 sec 4.1.1
	 *
	 * domain-value      = <subdomain>
	 *                     ; defined in [RFC1034], Section 3.5, as
	 *                     ; enhanced by [RFC1123], Section 2.1
	 * <subdomain>       = <label> | <subdomain> "." <label>
	 * <label>           = <let-dig> [ [ <ldh-str> ] <let-dig> ]
	 *                     Labels must be 63 characters or less.
	 *                     'let-dig' not 'letter' in the first char, per RFC1123
	 * <ldh-str>         = <let-dig-hyp> | <let-dig-hyp> <ldh-str>
	 * <let-dig-hyp>     = <let-dig> | "-"
	 * <let-dig>         = <letter> | <digit>
	 * <letter>          = any one of the 52 alphabetic characters A through Z in
	 *                     upper case and a through z in lower case
	 * <digit>           = any one of the ten digits 0 through 9
	 *
	 * Keep support for leading dot: https://github.com/jshttp/cookie/issues/173
	 *
	 * > (Note that a leading %x2E ("."), if present, is ignored even though that
	 * character is not permitted, but a trailing %x2E ("."), if present, will
	 * cause the user agent to ignore the attribute.)
	 */
	const domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
	/**
	 * RegExp to match path-value in RFC 6265 sec 4.1.1
	 *
	 * path-value        = <any CHAR except CTLs or ";">
	 * CHAR              = %x01-7F
	 *                     ; defined in RFC 5234 appendix B.1
	 */
	const pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
	/**
	 * RegExp to match max-age-value in RFC 6265 sec 5.6.2
	 */
	const maxAgeRegExp = /^-?\d+$/;
	const __toString = Object.prototype.toString;
	const NullObject = /* @__PURE__ */ (() => {
	    const C = function () { };
	    C.prototype = Object.create(null);
	    return C;
	})();
	/**
	 * Parse a `Cookie` header.
	 *
	 * Parse the given cookie header string into an object
	 * The object has the various cookies as keys(names) => values
	 */
	function parseCookie(str, options) {
	    const obj = new NullObject();
	    const len = str.length;
	    // RFC 6265 sec 4.1.1, RFC 2616 2.2 defines a cookie name consists of one char minimum, plus '='.
	    if (len < 2)
	        return obj;
	    const dec = options?.decode || decode;
	    let index = 0;
	    do {
	        const eqIdx = eqIndex(str, index, len);
	        if (eqIdx === -1)
	            break; // No more cookie pairs.
	        const endIdx = endIndex(str, index, len);
	        if (eqIdx > endIdx) {
	            // backtrack on prior semicolon
	            index = str.lastIndexOf(";", eqIdx - 1) + 1;
	            continue;
	        }
	        const key = valueSlice(str, index, eqIdx);
	        // only assign once
	        if (obj[key] === undefined) {
	            obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
	        }
	        index = endIdx + 1;
	    } while (index < len);
	    return obj;
	}
	/**
	 * Stringifies an object into an HTTP `Cookie` header.
	 */
	function stringifyCookie(cookie, options) {
	    const enc = options?.encode || encodeURIComponent;
	    const cookieStrings = [];
	    for (const name of Object.keys(cookie)) {
	        const val = cookie[name];
	        if (val === undefined)
	            continue;
	        if (!cookieNameRegExp.test(name)) {
	            throw new TypeError(`cookie name is invalid: ${name}`);
	        }
	        const value = enc(val);
	        if (!cookieValueRegExp.test(value)) {
	            throw new TypeError(`cookie val is invalid: ${val}`);
	        }
	        cookieStrings.push(`${name}=${value}`);
	    }
	    return cookieStrings.join("; ");
	}
	function stringifySetCookie(_name, _val, _opts) {
	    const cookie = typeof _name === "object"
	        ? _name
	        : { ..._opts, name: _name, value: String(_val) };
	    const options = typeof _val === "object" ? _val : _opts;
	    const enc = options?.encode || encodeURIComponent;
	    if (!cookieNameRegExp.test(cookie.name)) {
	        throw new TypeError(`argument name is invalid: ${cookie.name}`);
	    }
	    const value = cookie.value ? enc(cookie.value) : "";
	    if (!cookieValueRegExp.test(value)) {
	        throw new TypeError(`argument val is invalid: ${cookie.value}`);
	    }
	    let str = cookie.name + "=" + value;
	    if (cookie.maxAge !== undefined) {
	        if (!Number.isInteger(cookie.maxAge)) {
	            throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
	        }
	        str += "; Max-Age=" + cookie.maxAge;
	    }
	    if (cookie.domain) {
	        if (!domainValueRegExp.test(cookie.domain)) {
	            throw new TypeError(`option domain is invalid: ${cookie.domain}`);
	        }
	        str += "; Domain=" + cookie.domain;
	    }
	    if (cookie.path) {
	        if (!pathValueRegExp.test(cookie.path)) {
	            throw new TypeError(`option path is invalid: ${cookie.path}`);
	        }
	        str += "; Path=" + cookie.path;
	    }
	    if (cookie.expires) {
	        if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) {
	            throw new TypeError(`option expires is invalid: ${cookie.expires}`);
	        }
	        str += "; Expires=" + cookie.expires.toUTCString();
	    }
	    if (cookie.httpOnly) {
	        str += "; HttpOnly";
	    }
	    if (cookie.secure) {
	        str += "; Secure";
	    }
	    if (cookie.partitioned) {
	        str += "; Partitioned";
	    }
	    if (cookie.priority) {
	        const priority = typeof cookie.priority === "string"
	            ? cookie.priority.toLowerCase()
	            : undefined;
	        switch (priority) {
	            case "low":
	                str += "; Priority=Low";
	                break;
	            case "medium":
	                str += "; Priority=Medium";
	                break;
	            case "high":
	                str += "; Priority=High";
	                break;
	            default:
	                throw new TypeError(`option priority is invalid: ${cookie.priority}`);
	        }
	    }
	    if (cookie.sameSite) {
	        const sameSite = typeof cookie.sameSite === "string"
	            ? cookie.sameSite.toLowerCase()
	            : cookie.sameSite;
	        switch (sameSite) {
	            case true:
	            case "strict":
	                str += "; SameSite=Strict";
	                break;
	            case "lax":
	                str += "; SameSite=Lax";
	                break;
	            case "none":
	                str += "; SameSite=None";
	                break;
	            default:
	                throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
	        }
	    }
	    return str;
	}
	/**
	 * Deserialize a `Set-Cookie` header into an object.
	 *
	 * deserialize('foo=bar; httpOnly')
	 *   => { name: 'foo', value: 'bar', httpOnly: true }
	 */
	function parseSetCookie(str, options) {
	    const dec = options?.decode || decode;
	    const len = str.length;
	    const endIdx = endIndex(str, 0, len);
	    const eqIdx = eqIndex(str, 0, endIdx);
	    const setCookie = eqIdx === -1
	        ? { name: "", value: dec(valueSlice(str, 0, endIdx)) }
	        : {
	            name: valueSlice(str, 0, eqIdx),
	            value: dec(valueSlice(str, eqIdx + 1, endIdx)),
	        };
	    let index = endIdx + 1;
	    while (index < len) {
	        const endIdx = endIndex(str, index, len);
	        const eqIdx = eqIndex(str, index, endIdx);
	        const attr = eqIdx === -1
	            ? valueSlice(str, index, endIdx)
	            : valueSlice(str, index, eqIdx);
	        const val = eqIdx === -1 ? undefined : valueSlice(str, eqIdx + 1, endIdx);
	        switch (attr.toLowerCase()) {
	            case "httponly":
	                setCookie.httpOnly = true;
	                break;
	            case "secure":
	                setCookie.secure = true;
	                break;
	            case "partitioned":
	                setCookie.partitioned = true;
	                break;
	            case "domain":
	                setCookie.domain = val;
	                break;
	            case "path":
	                setCookie.path = val;
	                break;
	            case "max-age":
	                if (val && maxAgeRegExp.test(val))
	                    setCookie.maxAge = Number(val);
	                break;
	            case "expires":
	                if (!val)
	                    break;
	                const date = new Date(val);
	                if (Number.isFinite(date.valueOf()))
	                    setCookie.expires = date;
	                break;
	            case "priority":
	                if (!val)
	                    break;
	                const priority = val.toLowerCase();
	                if (priority === "low" ||
	                    priority === "medium" ||
	                    priority === "high") {
	                    setCookie.priority = priority;
	                }
	                break;
	            case "samesite":
	                if (!val)
	                    break;
	                const sameSite = val.toLowerCase();
	                if (sameSite === "lax" ||
	                    sameSite === "strict" ||
	                    sameSite === "none") {
	                    setCookie.sameSite = sameSite;
	                }
	                break;
	        }
	        index = endIdx + 1;
	    }
	    return setCookie;
	}
	/**
	 * Find the `;` character between `min` and `len` in str.
	 */
	function endIndex(str, min, len) {
	    const index = str.indexOf(";", min);
	    return index === -1 ? len : index;
	}
	/**
	 * Find the `=` character between `min` and `max` in str.
	 */
	function eqIndex(str, min, max) {
	    const index = str.indexOf("=", min);
	    return index < max ? index : -1;
	}
	/**
	 * Slice out a value between startPod to max.
	 */
	function valueSlice(str, min, max) {
	    let start = min;
	    let end = max;
	    do {
	        const code = str.charCodeAt(start);
	        if (code !== 0x20 /*   */ && code !== 0x09 /* \t */)
	            break;
	    } while (++start < end);
	    while (end > start) {
	        const code = str.charCodeAt(end - 1);
	        if (code !== 0x20 /*   */ && code !== 0x09 /* \t */)
	            break;
	        end--;
	    }
	    return str.slice(start, end);
	}
	/**
	 * URL-decode string value. Optimized to skip native call when no %.
	 */
	function decode(str) {
	    if (str.indexOf("%") === -1)
	        return str;
	    try {
	        return decodeURIComponent(str);
	    }
	    catch (e) {
	        return str;
	    }
	}
	/**
	 * Determine if value is a Date.
	 */
	function isDate(val) {
	    return __toString.call(val) === "[object Date]";
	}
	
	return dist;
}

var distExports = /*@__PURE__*/ requireDist();

const DELETED_EXPIRATION = /* @__PURE__ */ new Date(0);
const DELETED_VALUE = "deleted";
const responseSentSymbol = /* @__PURE__ */ Symbol.for("astro.responseSent");
const identity = (value) => value;
class AstroCookie {
  constructor(value) {
    this.value = value;
  }
  json() {
    if (this.value === void 0) {
      throw new Error(`Cannot convert undefined to an object.`);
    }
    return JSON.parse(this.value);
  }
  number() {
    return Number(this.value);
  }
  boolean() {
    if (this.value === "false") return false;
    if (this.value === "0") return false;
    return Boolean(this.value);
  }
}
class AstroCookies {
  #request;
  #requestValues;
  #outgoing;
  #consumed;
  constructor(request) {
    this.#request = request;
    this.#requestValues = null;
    this.#outgoing = null;
    this.#consumed = false;
  }
  /**
   * Astro.cookies.delete(key) is used to delete a cookie. Using this method will result
   * in a Set-Cookie header added to the response.
   * @param key The cookie to delete
   * @param options Options related to this deletion, such as the path of the cookie.
   */
  delete(key, options) {
    const {
      // @ts-expect-error
      maxAge: _ignoredMaxAge,
      // @ts-expect-error
      expires: _ignoredExpires,
      ...sanitizedOptions
    } = options || {};
    const serializeOptions = {
      expires: DELETED_EXPIRATION,
      ...sanitizedOptions
    };
    this.#ensureOutgoingMap().set(key, [
      DELETED_VALUE,
      distExports.serialize(key, DELETED_VALUE, serializeOptions),
      false
    ]);
  }
  /**
   * Astro.cookies.get(key) is used to get a cookie value. The cookie value is read from the
   * request. If you have set a cookie via Astro.cookies.set(key, value), the value will be taken
   * from that set call, overriding any values already part of the request.
   * @param key The cookie to get.
   * @returns An object containing the cookie value as well as convenience methods for converting its value.
   */
  get(key, options = void 0) {
    if (this.#outgoing?.has(key)) {
      let [serializedValue, , isSetValue] = this.#outgoing.get(key);
      if (isSetValue) {
        return new AstroCookie(serializedValue);
      } else {
        return void 0;
      }
    }
    const decode = options?.decode ?? decodeURIComponent;
    const values = this.#ensureParsed();
    if (key in values) {
      const value = values[key];
      if (value) {
        let decodedValue;
        try {
          decodedValue = decode(value);
        } catch (_error) {
          decodedValue = value;
        }
        return new AstroCookie(decodedValue);
      }
    }
  }
  /**
   * Astro.cookies.has(key) returns a boolean indicating whether this cookie is either
   * part of the initial request or set via Astro.cookies.set(key)
   * @param key The cookie to check for.
   * @param _options This parameter is no longer used.
   * @returns
   */
  has(key, _options) {
    if (this.#outgoing?.has(key)) {
      let [, , isSetValue] = this.#outgoing.get(key);
      return isSetValue;
    }
    const values = this.#ensureParsed();
    return values[key] !== void 0;
  }
  /**
   * Astro.cookies.set(key, value) is used to set a cookie's value. If provided
   * an object it will be stringified via JSON.stringify(value). Additionally you
   * can provide options customizing how this cookie will be set, such as setting httpOnly
   * in order to prevent the cookie from being read in client-side JavaScript.
   * @param key The name of the cookie to set.
   * @param value A value, either a string or other primitive or an object.
   * @param options Options for the cookie, such as the path and security settings.
   */
  set(key, value, options) {
    if (this.#consumed) {
      const warning = new Error(
        "Astro.cookies.set() was called after the cookies had already been sent to the browser.\nThis may have happened if this method was called in an imported component.\nPlease make sure that Astro.cookies.set() is only called in the frontmatter of the main page."
      );
      warning.name = "Warning";
      console.warn(warning);
    }
    let serializedValue;
    if (typeof value === "string") {
      serializedValue = value;
    } else {
      let toStringValue = value.toString();
      if (toStringValue === Object.prototype.toString.call(value)) {
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = toStringValue;
      }
    }
    const serializeOptions = {};
    if (options) {
      Object.assign(serializeOptions, options);
    }
    this.#ensureOutgoingMap().set(key, [
      serializedValue,
      distExports.serialize(key, serializedValue, serializeOptions),
      true
    ]);
    if (this.#request[responseSentSymbol]) {
      throw new AstroError({
        ...ResponseSentError
      });
    }
  }
  /**
   * Merges a new AstroCookies instance into the current instance. Any new cookies
   * will be added to the current instance, overwriting any existing cookies with the same name.
   */
  merge(cookies) {
    const outgoing = cookies.#outgoing;
    if (outgoing) {
      for (const [key, value] of outgoing) {
        this.#ensureOutgoingMap().set(key, value);
      }
    }
  }
  /**
   * Astro.cookies.header() returns an iterator for the cookies that have previously
   * been set by either Astro.cookies.set() or Astro.cookies.delete().
   * This method is primarily used by adapters to set the header on outgoing responses.
   * @returns
   */
  *headers() {
    if (this.#outgoing == null) return;
    for (const [, value] of this.#outgoing) {
      yield value[1];
    }
  }
  /**
   * Behaves the same as AstroCookies.prototype.headers(),
   * but allows a warning when cookies are set after the instance is consumed.
   */
  static consume(cookies) {
    cookies.#consumed = true;
    return cookies.headers();
  }
  #ensureParsed() {
    if (!this.#requestValues) {
      this.#parse();
    }
    if (!this.#requestValues) {
      this.#requestValues = /* @__PURE__ */ Object.create(null);
    }
    return this.#requestValues;
  }
  #ensureOutgoingMap() {
    if (!this.#outgoing) {
      this.#outgoing = /* @__PURE__ */ new Map();
    }
    return this.#outgoing;
  }
  #parse() {
    const raw = this.#request.headers.get("cookie");
    if (!raw) {
      return;
    }
    this.#requestValues = distExports.parse(raw, { decode: identity });
  }
}

const astroCookiesSymbol = /* @__PURE__ */ Symbol.for("astro.cookies");
function attachCookiesToResponse(response, cookies) {
  Reflect.set(response, astroCookiesSymbol, cookies);
}
function getCookiesFromResponse(response) {
  let cookies = Reflect.get(response, astroCookiesSymbol);
  if (cookies != null) {
    return cookies;
  } else {
    return void 0;
  }
}
function* getSetCookiesFromResponse(response) {
  const cookies = getCookiesFromResponse(response);
  if (!cookies) {
    return [];
  }
  for (const headerValue of AstroCookies.consume(cookies)) {
    yield headerValue;
  }
  return [];
}

let e=globalThis.process||{},t=e.argv||[],n=e.env||{},r$1=!(n.NO_COLOR||t.includes(`--no-color`))&&(!!n.FORCE_COLOR||t.includes(`--color`)||e.platform===`win32`||(e.stdout||{}).isTTY&&n.TERM!==`dumb`||!!n.CI),i=(e,t,n=e)=>r=>{let i=``+r,o=i.indexOf(t,e.length);return ~o?e+a(i,t,n,o)+t:e+i+t},a=(e,t,n,r)=>{let i=``,a=0;do i+=e.substring(a,r)+n,a=r+t.length,r=e.indexOf(t,a);while(~r);return i+e.substring(a)},o=(e=r$1)=>{let t=e?i:()=>String;return {isColorSupported:e,reset:t(`\x1B[0m`,`\x1B[0m`),bold:t(`\x1B[1m`,`\x1B[22m`,`\x1B[22m\x1B[1m`),dim:t(`\x1B[2m`,`\x1B[22m`,`\x1B[22m\x1B[2m`),italic:t(`\x1B[3m`,`\x1B[23m`),underline:t(`\x1B[4m`,`\x1B[24m`),inverse:t(`\x1B[7m`,`\x1B[27m`),hidden:t(`\x1B[8m`,`\x1B[28m`),strikethrough:t(`\x1B[9m`,`\x1B[29m`),black:t(`\x1B[30m`,`\x1B[39m`),red:t(`\x1B[31m`,`\x1B[39m`),green:t(`\x1B[32m`,`\x1B[39m`),yellow:t(`\x1B[33m`,`\x1B[39m`),blue:t(`\x1B[34m`,`\x1B[39m`),magenta:t(`\x1B[35m`,`\x1B[39m`),cyan:t(`\x1B[36m`,`\x1B[39m`),white:t(`\x1B[37m`,`\x1B[39m`),gray:t(`\x1B[90m`,`\x1B[39m`),bgBlack:t(`\x1B[40m`,`\x1B[49m`),bgRed:t(`\x1B[41m`,`\x1B[49m`),bgGreen:t(`\x1B[42m`,`\x1B[49m`),bgYellow:t(`\x1B[43m`,`\x1B[49m`),bgBlue:t(`\x1B[44m`,`\x1B[49m`),bgMagenta:t(`\x1B[45m`,`\x1B[49m`),bgCyan:t(`\x1B[46m`,`\x1B[49m`),bgWhite:t(`\x1B[47m`,`\x1B[49m`),blackBright:t(`\x1B[90m`,`\x1B[39m`),redBright:t(`\x1B[91m`,`\x1B[39m`),greenBright:t(`\x1B[92m`,`\x1B[39m`),yellowBright:t(`\x1B[93m`,`\x1B[39m`),blueBright:t(`\x1B[94m`,`\x1B[39m`),magentaBright:t(`\x1B[95m`,`\x1B[39m`),cyanBright:t(`\x1B[96m`,`\x1B[39m`),whiteBright:t(`\x1B[97m`,`\x1B[39m`),bgBlackBright:t(`\x1B[100m`,`\x1B[49m`),bgRedBright:t(`\x1B[101m`,`\x1B[49m`),bgGreenBright:t(`\x1B[102m`,`\x1B[49m`),bgYellowBright:t(`\x1B[103m`,`\x1B[49m`),bgBlueBright:t(`\x1B[104m`,`\x1B[49m`),bgMagentaBright:t(`\x1B[105m`,`\x1B[49m`),bgCyanBright:t(`\x1B[106m`,`\x1B[49m`),bgWhiteBright:t(`\x1B[107m`,`\x1B[49m`)}};var s=o();

const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});
const levels = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 90
};
function log(opts, level, label, message, newLine = true) {
  const logLevel = opts.level;
  const dest = opts.dest;
  const event = {
    label,
    level,
    message,
    newLine
  };
  if (!isLogLevelEnabled(logLevel, level)) {
    return;
  }
  dest.write(event);
}
function isLogLevelEnabled(configuredLogLevel, level) {
  return levels[configuredLogLevel] <= levels[level];
}
function info(opts, label, message, newLine = true) {
  return log(opts, "info", label, message, newLine);
}
function warn(opts, label, message, newLine = true) {
  return log(opts, "warn", label, message, newLine);
}
function error(opts, label, message, newLine = true) {
  return log(opts, "error", label, message, newLine);
}
function debug(...args) {
  if ("_astroGlobalDebug" in globalThis) {
    globalThis._astroGlobalDebug(...args);
  }
}
function getEventPrefix({ level, label }) {
  const timestamp = `${dateTimeFormat.format(/* @__PURE__ */ new Date())}`;
  const prefix = [];
  if (level === "error" || level === "warn") {
    prefix.push(s.bold(timestamp));
    prefix.push(`[${level.toUpperCase()}]`);
  } else {
    prefix.push(timestamp);
  }
  if (label) {
    prefix.push(`[${label}]`);
  }
  if (level === "error") {
    return s.red(prefix.join(" "));
  }
  if (level === "warn") {
    return s.yellow(prefix.join(" "));
  }
  if (prefix.length === 1) {
    return s.dim(prefix[0]);
  }
  return s.dim(prefix[0]) + " " + s.blue(prefix.splice(1).join(" "));
}
class Logger {
  options;
  constructor(options) {
    this.options = options;
  }
  info(label, message, newLine = true) {
    info(this.options, label, message, newLine);
  }
  warn(label, message, newLine = true) {
    warn(this.options, label, message, newLine);
  }
  error(label, message, newLine = true) {
    error(this.options, label, message, newLine);
  }
  debug(label, ...messages) {
    debug(label, ...messages);
  }
  level() {
    return this.options.level;
  }
  forkIntegrationLogger(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
}
class AstroIntegrationLogger {
  options;
  label;
  constructor(logging, label) {
    this.options = logging;
    this.label = label;
  }
  /**
   * Creates a new logger instance with a new label, but the same log options.
   */
  fork(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
  info(message) {
    info(this.options, this.label, message);
  }
  warn(message) {
    warn(this.options, this.label, message);
  }
  error(message) {
    error(this.options, this.label, message);
  }
  debug(message) {
    debug(this.label, message);
  }
}

const consoleLogDestination = {
  write(event) {
    let dest = console.error;
    if (levels[event.level] < levels["error"]) {
      dest = console.info;
    }
    if (event.label === "SKIP_FORMAT") {
      dest(event.message);
    } else {
      dest(getEventPrefix(event) + " " + event.message);
    }
    return true;
  }
};

/** @type {Record<string, string>} */

class DevalueError extends Error {
	/**
	 * @param {string} message
	 * @param {string[]} keys
	 * @param {any} [value] - The value that failed to be serialized
	 * @param {any} [root] - The root value being serialized
	 */
	constructor(message, keys, value, root) {
		super(message);
		this.name = 'DevalueError';
		this.path = keys.join('');
		this.value = value;
		this.root = root;
	}
}

/** @param {any} thing */
function is_primitive(thing) {
	return Object(thing) !== thing;
}

const object_proto_names = /* @__PURE__ */ Object.getOwnPropertyNames(
	Object.prototype
)
	.sort()
	.join('\0');

/** @param {any} thing */
function is_plain_object(thing) {
	const proto = Object.getPrototypeOf(thing);

	return (
		proto === Object.prototype ||
		proto === null ||
		Object.getPrototypeOf(proto) === null ||
		Object.getOwnPropertyNames(proto).sort().join('\0') === object_proto_names
	);
}

/** @param {any} thing */
function get_type(thing) {
	return Object.prototype.toString.call(thing).slice(8, -1);
}

/** @param {string} char */
function get_escaped_char(char) {
	switch (char) {
		case '"':
			return '\\"';
		case '<':
			return '\\u003C';
		case '\\':
			return '\\\\';
		case '\n':
			return '\\n';
		case '\r':
			return '\\r';
		case '\t':
			return '\\t';
		case '\b':
			return '\\b';
		case '\f':
			return '\\f';
		case '\u2028':
			return '\\u2028';
		case '\u2029':
			return '\\u2029';
		default:
			return char < ' '
				? `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
				: '';
	}
}

/** @param {string} str */
function stringify_string(str) {
	let result = '';
	let last_pos = 0;
	const len = str.length;

	for (let i = 0; i < len; i += 1) {
		const char = str[i];
		const replacement = get_escaped_char(char);
		if (replacement) {
			result += str.slice(last_pos, i) + replacement;
			last_pos = i + 1;
		}
	}

	return `"${last_pos === 0 ? str : result + str.slice(last_pos)}"`;
}

/** @param {Record<string | symbol, any>} object */
function enumerable_symbols(object) {
	return Object.getOwnPropertySymbols(object).filter(
		(symbol) => Object.getOwnPropertyDescriptor(object, symbol).enumerable
	);
}

const is_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;

/** @param {string} key */
function stringify_key(key) {
	return is_identifier.test(key) ? '.' + key : '[' + JSON.stringify(key) + ']';
}

/** @param {string} s */
function is_valid_array_index(s) {
	if (s.length === 0) return false;
	if (s.length > 1 && s.charCodeAt(0) === 48) return false; // leading zero
	for (let i = 0; i < s.length; i++) {
		const c = s.charCodeAt(i);
		if (c < 48 || c > 57) return false;
	}
	// by this point we know it's a string of digits, but it has to be within the range of valid array indices
	const n = +s;
	if (n >= 2 ** 32 - 1) return false;
	if (n < 0) return false;
	return true;
}

/**
 * Finds the populated indices of an array.
 * @param {unknown[]} array
 */
function valid_array_indices(array) {
	const keys = Object.keys(array);
	for (var i = keys.length - 1; i >= 0; i--) {
		if (is_valid_array_index(keys[i])) {
			break;
		}
	}
	keys.length = i + 1;
	return keys;
}

/**
 * Base64 Encodes an arraybuffer
 * @param {ArrayBuffer} arraybuffer
 * @returns {string}
 */
function encode64(arraybuffer) {
  const dv = new DataView(arraybuffer);
  let binaryString = "";

  for (let i = 0; i < arraybuffer.byteLength; i++) {
    binaryString += String.fromCharCode(dv.getUint8(i));
  }

  return binaryToAscii(binaryString);
}

/**
 * Decodes a base64 string into an arraybuffer
 * @param {string} string
 * @returns {ArrayBuffer}
 */
function decode64(string) {
  const binaryString = asciiToBinary(string);
  const arraybuffer = new ArrayBuffer(binaryString.length);
  const dv = new DataView(arraybuffer);

  for (let i = 0; i < arraybuffer.byteLength; i++) {
    dv.setUint8(i, binaryString.charCodeAt(i));
  }

  return arraybuffer;
}

const KEY_STRING =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Substitute for atob since it's deprecated in node.
 * Does not do any input validation.
 *
 * @see https://github.com/jsdom/abab/blob/master/lib/atob.js
 *
 * @param {string} data
 * @returns {string}
 */
function asciiToBinary(data) {
  if (data.length % 4 === 0) {
    data = data.replace(/==?$/, "");
  }

  let output = "";
  let buffer = 0;
  let accumulatedBits = 0;

  for (let i = 0; i < data.length; i++) {
    buffer <<= 6;
    buffer |= KEY_STRING.indexOf(data[i]);
    accumulatedBits += 6;
    if (accumulatedBits === 24) {
      output += String.fromCharCode((buffer & 0xff0000) >> 16);
      output += String.fromCharCode((buffer & 0xff00) >> 8);
      output += String.fromCharCode(buffer & 0xff);
      buffer = accumulatedBits = 0;
    }
  }
  if (accumulatedBits === 12) {
    buffer >>= 4;
    output += String.fromCharCode(buffer);
  } else if (accumulatedBits === 18) {
    buffer >>= 2;
    output += String.fromCharCode((buffer & 0xff00) >> 8);
    output += String.fromCharCode(buffer & 0xff);
  }
  return output;
}

/**
 * Substitute for btoa since it's deprecated in node.
 * Does not do any input validation.
 *
 * @see https://github.com/jsdom/abab/blob/master/lib/btoa.js
 *
 * @param {string} str
 * @returns {string}
 */
function binaryToAscii(str) {
  let out = "";
  for (let i = 0; i < str.length; i += 3) {
    /** @type {[number, number, number, number]} */
    const groupsOfSix = [undefined, undefined, undefined, undefined];
    groupsOfSix[0] = str.charCodeAt(i) >> 2;
    groupsOfSix[1] = (str.charCodeAt(i) & 0x03) << 4;
    if (str.length > i + 1) {
      groupsOfSix[1] |= str.charCodeAt(i + 1) >> 4;
      groupsOfSix[2] = (str.charCodeAt(i + 1) & 0x0f) << 2;
    }
    if (str.length > i + 2) {
      groupsOfSix[2] |= str.charCodeAt(i + 2) >> 6;
      groupsOfSix[3] = str.charCodeAt(i + 2) & 0x3f;
    }
    for (let j = 0; j < groupsOfSix.length; j++) {
      if (typeof groupsOfSix[j] === "undefined") {
        out += "=";
      } else {
        out += KEY_STRING[groupsOfSix[j]];
      }
    }
  }
  return out;
}

const UNDEFINED = -1;
const HOLE = -2;
const NAN = -3;
const POSITIVE_INFINITY = -4;
const NEGATIVE_INFINITY = -5;
const NEGATIVE_ZERO = -6;
const SPARSE = -7;

/**
 * Revive a value serialized with `devalue.stringify`
 * @param {string} serialized
 * @param {Record<string, (value: any) => any>} [revivers]
 */
function parse$1(serialized, revivers) {
	return unflatten$1(JSON.parse(serialized), revivers);
}

/**
 * Revive a value flattened with `devalue.stringify`
 * @param {number | any[]} parsed
 * @param {Record<string, (value: any) => any>} [revivers]
 */
function unflatten$1(parsed, revivers) {
	if (typeof parsed === 'number') return hydrate(parsed, true);

	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error('Invalid input');
	}

	const values = /** @type {any[]} */ (parsed);

	const hydrated = Array(values.length);

	/**
	 * A set of values currently being hydrated with custom revivers,
	 * used to detect invalid cyclical dependencies
	 * @type {Set<number> | null}
	 */
	let hydrating = null;

	/**
	 * @param {number} index
	 * @returns {any}
	 */
	function hydrate(index, standalone = false) {
		if (index === UNDEFINED) return undefined;
		if (index === NAN) return NaN;
		if (index === POSITIVE_INFINITY) return Infinity;
		if (index === NEGATIVE_INFINITY) return -Infinity;
		if (index === NEGATIVE_ZERO) return -0;

		if (standalone || typeof index !== 'number') {
			throw new Error(`Invalid input`);
		}

		if (index in hydrated) return hydrated[index];

		const value = values[index];

		if (!value || typeof value !== 'object') {
			hydrated[index] = value;
		} else if (Array.isArray(value)) {
			if (typeof value[0] === 'string') {
				const type = value[0];

				const reviver =
					revivers && Object.hasOwn(revivers, type)
						? revivers[type]
						: undefined;

				if (reviver) {
					let i = value[1];
					if (typeof i !== 'number') {
						// if it's not a number, it was serialized by a builtin reviver
						// so we need to munge it into the format expected by a custom reviver
						i = values.push(value[1]) - 1;
					}

					hydrating ??= new Set();

					if (hydrating.has(i)) {
						throw new Error('Invalid circular reference');
					}

					hydrating.add(i);
					hydrated[index] = reviver(hydrate(i));
					hydrating.delete(i);

					return hydrated[index];
				}

				switch (type) {
					case 'Date':
						hydrated[index] = new Date(value[1]);
						break;

					case 'Set':
						const set = new Set();
						hydrated[index] = set;
						for (let i = 1; i < value.length; i += 1) {
							set.add(hydrate(value[i]));
						}
						break;

					case 'Map':
						const map = new Map();
						hydrated[index] = map;
						for (let i = 1; i < value.length; i += 2) {
							map.set(hydrate(value[i]), hydrate(value[i + 1]));
						}
						break;

					case 'RegExp':
						hydrated[index] = new RegExp(value[1], value[2]);
						break;

					case 'Object':
						const object = Object(value[1]);

						if (Object.hasOwn(object, '__proto__')) {
							throw new Error('Cannot parse an object with a `__proto__` property');
						}

						hydrated[index] = object;
						break;

					case 'BigInt':
						hydrated[index] = BigInt(value[1]);
						break;

					case 'null':
						const obj = Object.create(null);
						hydrated[index] = obj;
						for (let i = 1; i < value.length; i += 2) {
							if (value[i] === '__proto__') {
								throw new Error('Cannot parse an object with a `__proto__` property');
							}

							obj[value[i]] = hydrate(value[i + 1]);
						}
						break;

					case 'Int8Array':
					case 'Uint8Array':
					case 'Uint8ClampedArray':
					case 'Int16Array':
					case 'Uint16Array':
					case 'Int32Array':
					case 'Uint32Array':
					case 'Float32Array':
					case 'Float64Array':
					case 'BigInt64Array':
					case 'BigUint64Array': {
						if (values[value[1]][0] !== 'ArrayBuffer') {
							// without this, if we receive malformed input we could
							// end up trying to hydrate in a circle or allocate
							// huge amounts of memory when we call `new TypedArrayConstructor(buffer)`
							throw new Error('Invalid data');
						}

						const TypedArrayConstructor = globalThis[type];
						const buffer = hydrate(value[1]);
						const typedArray = new TypedArrayConstructor(buffer);

						hydrated[index] =
							value[2] !== undefined
								? typedArray.subarray(value[2], value[3])
								: typedArray;

						break;
					}

					case 'ArrayBuffer': {
						const base64 = value[1];
						if (typeof base64 !== 'string') {
							throw new Error('Invalid ArrayBuffer encoding');
						}
						const arraybuffer = decode64(base64);
						hydrated[index] = arraybuffer;
						break;
					}

					case 'Temporal.Duration':
					case 'Temporal.Instant':
					case 'Temporal.PlainDate':
					case 'Temporal.PlainTime':
					case 'Temporal.PlainDateTime':
					case 'Temporal.PlainMonthDay':
					case 'Temporal.PlainYearMonth':
					case 'Temporal.ZonedDateTime': {
						const temporalName = type.slice(9);
						// @ts-expect-error TS doesn't know about Temporal yet
						hydrated[index] = Temporal[temporalName].from(value[1]);
						break;
					}

					case 'URL': {
						const url = new URL(value[1]);
						hydrated[index] = url;
						break;
					}

					case 'URLSearchParams': {
						const url = new URLSearchParams(value[1]);
						hydrated[index] = url;
						break;
					}

					default:
						throw new Error(`Unknown type ${type}`);
				}
			} else if (value[0] === SPARSE) {
				// Sparse array encoding: [SPARSE, length, idx, val, idx, val, ...]
				const len = value[1];

				if (!Number.isInteger(len) || len < 0) {
					throw new Error('Invalid input');
				}

				const array = new Array(len);
				hydrated[index] = array;

				for (let i = 2; i < value.length; i += 2) {
					const idx = value[i];

					if (!Number.isInteger(idx) || idx < 0 || idx >= len) {
						throw new Error('Invalid input');
					}

					array[idx] = hydrate(value[i + 1]);
				}
			} else {
				const array = new Array(value.length);
				hydrated[index] = array;

				for (let i = 0; i < value.length; i += 1) {
					const n = value[i];
					if (n === HOLE) continue;

					array[i] = hydrate(n);
				}
			}
		} else {
			/** @type {Record<string, any>} */
			const object = {};
			hydrated[index] = object;

			for (const key of Object.keys(value)) {
				if (key === '__proto__') {
					throw new Error('Cannot parse an object with a `__proto__` property');
				}

				const n = value[key];
				object[key] = hydrate(n);
			}
		}

		return hydrated[index];
	}

	return hydrate(0);
}

/**
 * Turn a value into a JSON string that can be parsed with `devalue.parse`
 * @param {any} value
 * @param {Record<string, (value: any) => any>} [reducers]
 */
function stringify$2(value, reducers) {
	/** @type {any[]} */
	const stringified = [];

	/** @type {Map<any, number>} */
	const indexes = new Map();

	/** @type {Array<{ key: string, fn: (value: any) => any }>} */
	const custom = [];
	if (reducers) {
		for (const key of Object.getOwnPropertyNames(reducers)) {
			custom.push({ key, fn: reducers[key] });
		}
	}

	/** @type {string[]} */
	const keys = [];

	let p = 0;

	/** @param {any} thing */
	function flatten(thing) {
		if (thing === undefined) return UNDEFINED;
		if (Number.isNaN(thing)) return NAN;
		if (thing === Infinity) return POSITIVE_INFINITY;
		if (thing === -Infinity) return NEGATIVE_INFINITY;
		if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO;

		if (indexes.has(thing)) return indexes.get(thing);

		const index = p++;
		indexes.set(thing, index);

		for (const { key, fn } of custom) {
			const value = fn(thing);
			if (value) {
				stringified[index] = `["${key}",${flatten(value)}]`;
				return index;
			}
		}

		if (typeof thing === 'function') {
			throw new DevalueError(`Cannot stringify a function`, keys, thing, value);
		}

		let str = '';

		if (is_primitive(thing)) {
			str = stringify_primitive(thing);
		} else {
			const type = get_type(thing);

			switch (type) {
				case 'Number':
				case 'String':
				case 'Boolean':
					str = `["Object",${stringify_primitive(thing)}]`;
					break;

				case 'BigInt':
					str = `["BigInt",${thing}]`;
					break;

				case 'Date':
					const valid = !isNaN(thing.getDate());
					str = `["Date","${valid ? thing.toISOString() : ''}"]`;
					break;

				case 'URL':
					str = `["URL",${stringify_string(thing.toString())}]`;
					break;

				case 'URLSearchParams':
					str = `["URLSearchParams",${stringify_string(thing.toString())}]`;
					break;

				case 'RegExp':
					const { source, flags } = thing;
					str = flags
						? `["RegExp",${stringify_string(source)},"${flags}"]`
						: `["RegExp",${stringify_string(source)}]`;
					break;

				case 'Array': {
					// For dense arrays (no holes), we iterate normally.
					// When we encounter the first hole, we call Object.keys
					// to determine the sparseness, then decide between:
					//   - HOLE encoding: [-2, val, -2, ...] (default)
					//   - Sparse encoding: [-7, length, idx, val, ...] (for very sparse arrays)
					// Only the sparse path avoids iterating every slot, which
					// is what protects against the DoS of e.g. `arr[1000000] = 1`.
					let mostly_dense = false;

					str = '[';

					for (let i = 0; i < thing.length; i += 1) {
						if (i > 0) str += ',';

						if (Object.hasOwn(thing, i)) {
							keys.push(`[${i}]`);
							str += flatten(thing[i]);
							keys.pop();
						} else if (mostly_dense) {
							// Use dense encoding. The heuristic guarantees the
							// array is only mildly sparse, so iterating over every
							// slot is fine.
							str += HOLE;
						} else {
							// Decide between HOLE encoding and sparse encoding.
							//
							// HOLE encoding: each hole is serialized as the HOLE
							// sentinel (-2). For example, [, "a", ,] becomes
							// [-2, 0, -2]. Each hole costs 3 chars ("-2" + comma).
							//
							// Sparse encoding: lists only populated indices.
							// For example, [, "a", ,] becomes [-7, 3, 1, 0] — the
							// -7 sentinel, the array length (3), then index-value
							// pairs. This avoids paying per-hole, but each element
							// costs extra chars to write its index.
							//
							// The values are the same size either way, so the
							// choice comes down to structural overhead:
							//
							//   HOLE overhead:
							//     3 chars per hole ("-2" + comma)
							//     = (L - P) * 3
							//
							//   Sparse overhead:
							//     "-7,"          — 3 chars (sparse sentinel + comma)
							//     + length + "," — (d + 1) chars (array length + comma)
							//     + per element: index + "," — (d + 1) chars
							//     = (4 + d) + P * (d + 1)
							//
							// where L is the array length, P is the number of
							// populated elements, and d is the number of digits
							// in L (an upper bound on the digits in any index).
							//
							// Sparse encoding is cheaper when:
							//   (4 + d) + P * (d + 1) < (L - P) * 3
							const populated_keys = valid_array_indices(/** @type {any[]} */ (thing));
							const population = populated_keys.length;
							const d = String(thing.length).length;

							const hole_cost = (thing.length - population) * 3;
							const sparse_cost = 4 + d + population * (d + 1);

							if (hole_cost > sparse_cost) {
								str = '[' + SPARSE + ',' + thing.length;
								for (let j = 0; j < populated_keys.length; j++) {
									const key = populated_keys[j];
									keys.push(`[${key}]`);
									str += ',' + key + ',' + flatten(thing[key]);
									keys.pop();
								}
								break;
							} else {
								mostly_dense = true;
								str += HOLE;
							}
						}
					}

					str += ']';

					break;
				}

				case 'Set':
					str = '["Set"';

					for (const value of thing) {
						str += `,${flatten(value)}`;
					}

					str += ']';
					break;

				case 'Map':
					str = '["Map"';

					for (const [key, value] of thing) {
						keys.push(
							`.get(${is_primitive(key) ? stringify_primitive(key) : '...'})`
						);
						str += `,${flatten(key)},${flatten(value)}`;
						keys.pop();
					}

					str += ']';
					break;

				case 'Int8Array':
				case 'Uint8Array':
				case 'Uint8ClampedArray':
				case 'Int16Array':
				case 'Uint16Array':
				case 'Int32Array':
				case 'Uint32Array':
				case 'Float32Array':
				case 'Float64Array':
				case 'BigInt64Array':
				case 'BigUint64Array': {
					/** @type {import("./types.js").TypedArray} */
					const typedArray = thing;
					str = '["' + type + '",' + flatten(typedArray.buffer);

					const a = thing.byteOffset;
					const b = a + thing.byteLength;

					// handle subarrays
					if (a > 0 || b !== typedArray.buffer.byteLength) {
						const m = +/(\d+)/.exec(type)[1] / 8;
						str += `,${a / m},${b / m}`;
					}

					str += ']';
					break;
				}

				case 'ArrayBuffer': {
					/** @type {ArrayBuffer} */
					const arraybuffer = thing;
					const base64 = encode64(arraybuffer);

					str = `["ArrayBuffer","${base64}"]`;
					break;
				}

				case 'Temporal.Duration':
				case 'Temporal.Instant':
				case 'Temporal.PlainDate':
				case 'Temporal.PlainTime':
				case 'Temporal.PlainDateTime':
				case 'Temporal.PlainMonthDay':
				case 'Temporal.PlainYearMonth':
				case 'Temporal.ZonedDateTime':
					str = `["${type}",${stringify_string(thing.toString())}]`;
					break;

				default:
					if (!is_plain_object(thing)) {
						throw new DevalueError(
							`Cannot stringify arbitrary non-POJOs`,
							keys,
							thing,
							value
						);
					}

					if (enumerable_symbols(thing).length > 0) {
						throw new DevalueError(
							`Cannot stringify POJOs with symbolic keys`,
							keys,
							thing,
							value
						);
					}

					if (Object.getPrototypeOf(thing) === null) {
						str = '["null"';
						for (const key of Object.keys(thing)) {
							if (key === '__proto__') {
								throw new DevalueError(
									`Cannot stringify objects with __proto__ keys`,
									keys,
									thing,
									value
								);
							}

							keys.push(stringify_key(key));
							str += `,${stringify_string(key)},${flatten(thing[key])}`;
							keys.pop();
						}
						str += ']';
					} else {
						str = '{';
						let started = false;
						for (const key of Object.keys(thing)) {
							if (key === '__proto__') {
								throw new DevalueError(
									`Cannot stringify objects with __proto__ keys`,
									keys,
									thing,
									value
								);
							}

							if (started) str += ',';
							started = true;
							keys.push(stringify_key(key));
							str += `${stringify_string(key)}:${flatten(thing[key])}`;
							keys.pop();
						}
						str += '}';
					}
			}
		}

		stringified[index] = str;
		return index;
	}

	const index = flatten(value);

	// special case — value is represented as a negative index
	if (index < 0) return `${index}`;

	return `[${stringified.join(',')}]`;
}

/**
 * @param {any} thing
 * @returns {string}
 */
function stringify_primitive(thing) {
	const type = typeof thing;
	if (type === 'string') return stringify_string(thing);
	if (thing instanceof String) return stringify_string(thing.toString());
	if (thing === void 0) return UNDEFINED.toString();
	if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO.toString();
	if (type === 'bigint') return `["BigInt","${thing}"]`;
	return String(thing);
}

const ACTION_QUERY_PARAMS = {
  actionName: "_action"};
const ACTION_RPC_ROUTE_PATTERN = "/_actions/[...path]";

const __vite_import_meta_env__$1 = {"ASSETS_PREFIX": undefined, "BASE_URL": "/new-base", "DEV": false, "MODE": "production", "PROD": true, "SITE": undefined, "SSR": true};
const codeToStatusMap = {
  // Implemented from IANA HTTP Status Code Registry
  // https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  CONTENT_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_CONTENT: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NETWORK_AUTHENTICATION_REQUIRED: 511
};
const statusToCodeMap = Object.fromEntries(
  Object.entries(codeToStatusMap).map(([key, value]) => [value, key])
);
class ActionError extends Error {
  type = "AstroActionError";
  code = "INTERNAL_SERVER_ERROR";
  status = 500;
  constructor(params) {
    super(params.message);
    this.code = params.code;
    this.status = ActionError.codeToStatus(params.code);
    if (params.stack) {
      this.stack = params.stack;
    }
  }
  static codeToStatus(code) {
    return codeToStatusMap[code];
  }
  static statusToCode(status) {
    return statusToCodeMap[status] ?? "INTERNAL_SERVER_ERROR";
  }
  static fromJson(body) {
    if (isInputError(body)) {
      return new ActionInputError(body.issues);
    }
    if (isActionError(body)) {
      return new ActionError(body);
    }
    return new ActionError({
      code: "INTERNAL_SERVER_ERROR"
    });
  }
}
function isActionError(error) {
  return typeof error === "object" && error != null && "type" in error && error.type === "AstroActionError";
}
function isInputError(error) {
  return typeof error === "object" && error != null && "type" in error && error.type === "AstroActionInputError" && "issues" in error && Array.isArray(error.issues);
}
class ActionInputError extends ActionError {
  type = "AstroActionInputError";
  // We don't expose all ZodError properties.
  // Not all properties will serialize from server to client,
  // and we don't want to import the full ZodError object into the client.
  issues;
  fields;
  constructor(issues) {
    super({
      message: `Failed to validate: ${JSON.stringify(issues, null, 2)}`,
      code: "BAD_REQUEST"
    });
    this.issues = issues;
    this.fields = {};
    for (const issue of issues) {
      if (issue.path.length > 0) {
        const key = issue.path[0].toString();
        this.fields[key] ??= [];
        this.fields[key]?.push(issue.message);
      }
    }
  }
}
function deserializeActionResult(res) {
  if (res.type === "error") {
    let json;
    try {
      json = JSON.parse(res.body);
    } catch {
      return {
        data: void 0,
        error: new ActionError({
          message: res.body,
          code: "INTERNAL_SERVER_ERROR"
        })
      };
    }
    if (Object.assign(__vite_import_meta_env__$1, { _: "/home/felixicaza/.local/share/pnpm/pnpm" })?.PROD) {
      return { error: ActionError.fromJson(json), data: void 0 };
    } else {
      const error = ActionError.fromJson(json);
      error.stack = actionResultErrorStack.get();
      return {
        error,
        data: void 0
      };
    }
  }
  if (res.type === "empty") {
    return { data: void 0, error: void 0 };
  }
  return {
    data: parse$1(res.body, {
      URL: (href) => new URL(href)
    }),
    error: void 0
  };
}
const actionResultErrorStack = /* @__PURE__ */ (function actionResultErrorStackFn() {
  let errorStack;
  return {
    set(stack) {
      errorStack = stack;
    },
    get() {
      return errorStack;
    }
  };
})();
function getActionQueryString(name) {
  const searchParams = new URLSearchParams({ [ACTION_QUERY_PARAMS.actionName]: name });
  return `?${searchParams.toString()}`;
}

/** A special constant with type `never` */
function $constructor(name, initializer, params) {
    function init(inst, def) {
        if (!inst._zod) {
            Object.defineProperty(inst, "_zod", {
                value: {
                    def,
                    constr: _,
                    traits: new Set(),
                },
                enumerable: false,
            });
        }
        if (inst._zod.traits.has(name)) {
            return;
        }
        inst._zod.traits.add(name);
        initializer(inst, def);
        // support prototype modifications
        const proto = _.prototype;
        const keys = Object.keys(proto);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (!(k in inst)) {
                inst[k] = proto[k].bind(inst);
            }
        }
    }
    // doesn't work if Parent has a constructor with arguments
    const Parent = params?.Parent ?? Object;
    class Definition extends Parent {
    }
    Object.defineProperty(Definition, "name", { value: name });
    function _(def) {
        var _a;
        const inst = params?.Parent ? new Definition() : this;
        init(inst, def);
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        for (const fn of inst._zod.deferred) {
            fn();
        }
        return inst;
    }
    Object.defineProperty(_, "init", { value: init });
    Object.defineProperty(_, Symbol.hasInstance, {
        value: (inst) => {
            if (params?.Parent && inst instanceof params.Parent)
                return true;
            return inst?._zod?.traits?.has(name);
        },
    });
    Object.defineProperty(_, "name", { value: name });
    return _;
}
class $ZodAsyncError extends Error {
    constructor() {
        super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
    }
}
class $ZodEncodeError extends Error {
    constructor(name) {
        super(`Encountered unidirectional transform during encode: ${name}`);
        this.name = "ZodEncodeError";
    }
}
const globalConfig = {};
function config(newConfig) {
    return globalConfig;
}

// functions
function getEnumValues(entries) {
    const numericValues = Object.values(entries).filter((v) => typeof v === "number");
    const values = Object.entries(entries)
        .filter(([k, _]) => numericValues.indexOf(+k) === -1)
        .map(([_, v]) => v);
    return values;
}
function jsonStringifyReplacer(_, value) {
    if (typeof value === "bigint")
        return value.toString();
    return value;
}
function nullish(input) {
    return input === null || input === undefined;
}
function cleanRegex(source) {
    const start = source.startsWith("^") ? 1 : 0;
    const end = source.endsWith("$") ? source.length - 1 : source.length;
    return source.slice(start, end);
}
const EVALUATING = Symbol("evaluating");
function defineLazy(object, key, getter) {
    let value = undefined;
    Object.defineProperty(object, key, {
        get() {
            if (value === EVALUATING) {
                // Circular reference detected, return undefined to break the cycle
                return undefined;
            }
            if (value === undefined) {
                value = EVALUATING;
                value = getter();
            }
            return value;
        },
        set(v) {
            Object.defineProperty(object, key, {
                value: v,
                // configurable: true,
            });
            // object[key] = v;
        },
        configurable: true,
    });
}
function mergeDefs(...defs) {
    const mergedDescriptors = {};
    for (const def of defs) {
        const descriptors = Object.getOwnPropertyDescriptors(def);
        Object.assign(mergedDescriptors, descriptors);
    }
    return Object.defineProperties({}, mergedDescriptors);
}
const captureStackTrace = ("captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => { });
function isObject(data) {
    return typeof data === "object" && data !== null && !Array.isArray(data);
}
function isPlainObject(o) {
    if (isObject(o) === false)
        return false;
    // modified constructor
    const ctor = o.constructor;
    if (ctor === undefined)
        return true;
    if (typeof ctor !== "function")
        return true;
    // modified prototype
    const prot = ctor.prototype;
    if (isObject(prot) === false)
        return false;
    // ctor doesn't have static `isPrototypeOf`
    if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
        return false;
    }
    return true;
}
function shallowClone(o) {
    if (isPlainObject(o))
        return { ...o };
    if (Array.isArray(o))
        return [...o];
    return o;
}
const propertyKeyTypes = new Set(["string", "number", "symbol"]);
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// zod-specific utils
function clone(inst, def, params) {
    const cl = new inst._zod.constr(def ?? inst._zod.def);
    if (!def || params?.parent)
        cl._zod.parent = inst;
    return cl;
}
function normalizeParams(_params) {
    const params = _params;
    if (!params)
        return {};
    if (typeof params === "string")
        return { error: () => params };
    if (params?.message !== undefined) {
        if (params?.error !== undefined)
            throw new Error("Cannot specify both `message` and `error` params");
        params.error = params.message;
    }
    delete params.message;
    if (typeof params.error === "string")
        return { ...params, error: () => params.error };
    return params;
}
// invalid_type | too_big | too_small | invalid_format | not_multiple_of | unrecognized_keys | invalid_union | invalid_key | invalid_element | invalid_value | custom
function aborted(x, startIndex = 0) {
    if (x.aborted === true)
        return true;
    for (let i = startIndex; i < x.issues.length; i++) {
        if (x.issues[i]?.continue !== true) {
            return true;
        }
    }
    return false;
}
function prefixIssues(path, issues) {
    return issues.map((iss) => {
        var _a;
        (_a = iss).path ?? (_a.path = []);
        iss.path.unshift(path);
        return iss;
    });
}
function unwrapMessage(message) {
    return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config) {
    const full = { ...iss, path: iss.path ?? [] };
    // for backwards compatibility
    if (!iss.message) {
        const message = unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ??
            unwrapMessage(ctx?.error?.(iss)) ??
            unwrapMessage(config.customError?.(iss)) ??
            unwrapMessage(config.localeError?.(iss)) ??
            "Invalid input";
        full.message = message;
    }
    // delete (full as any).def;
    delete full.inst;
    delete full.continue;
    if (!ctx?.reportInput) {
        delete full.input;
    }
    return full;
}
function getLengthableOrigin(input) {
    if (Array.isArray(input))
        return "array";
    if (typeof input === "string")
        return "string";
    return "unknown";
}
function issue(...args) {
    const [iss, input, inst] = args;
    if (typeof iss === "string") {
        return {
            message: iss,
            code: "custom",
            input,
            inst,
        };
    }
    return { ...iss };
}

const initializer$1 = (inst, def) => {
    inst.name = "$ZodError";
    Object.defineProperty(inst, "_zod", {
        value: inst._zod,
        enumerable: false,
    });
    Object.defineProperty(inst, "issues", {
        value: def,
        enumerable: false,
    });
    inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
    Object.defineProperty(inst, "toString", {
        value: () => inst.message,
        enumerable: false,
    });
};
const $ZodError = $constructor("$ZodError", initializer$1);
const $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
function flattenError(error, mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of error.issues) {
        if (sub.path.length > 0) {
            fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
            fieldErrors[sub.path[0]].push(mapper(sub));
        }
        else {
            formErrors.push(mapper(sub));
        }
    }
    return { formErrors, fieldErrors };
}
function formatError(error, mapper = (issue) => issue.message) {
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
        for (const issue of error.issues) {
            if (issue.code === "invalid_union" && issue.errors.length) {
                issue.errors.map((issues) => processError({ issues }));
            }
            else if (issue.code === "invalid_key") {
                processError({ issues: issue.issues });
            }
            else if (issue.code === "invalid_element") {
                processError({ issues: issue.issues });
            }
            else if (issue.path.length === 0) {
                fieldErrors._errors.push(mapper(issue));
            }
            else {
                let curr = fieldErrors;
                let i = 0;
                while (i < issue.path.length) {
                    const el = issue.path[i];
                    const terminal = i === issue.path.length - 1;
                    if (!terminal) {
                        curr[el] = curr[el] || { _errors: [] };
                    }
                    else {
                        curr[el] = curr[el] || { _errors: [] };
                        curr[el]._errors.push(mapper(issue));
                    }
                    curr = curr[el];
                    i++;
                }
            }
        }
    };
    processError(error);
    return fieldErrors;
}

const _parse = (_Err) => (schema, value, _ctx, _params) => {
    const ctx = _ctx ? Object.assign(_ctx, { async: false }) : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
        throw new $ZodAsyncError();
    }
    if (result.issues.length) {
        const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
        captureStackTrace(e, _params?.callee);
        throw e;
    }
    return result.value;
};
const _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
    const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
        result = await result;
    if (result.issues.length) {
        const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
        captureStackTrace(e, params?.callee);
        throw e;
    }
    return result.value;
};
const _safeParse = (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
        throw new $ZodAsyncError();
    }
    return result.issues.length
        ? {
            success: false,
            error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config()))),
        }
        : { success: true, data: result.value };
};
const safeParse$1 = /* @__PURE__*/ _safeParse($ZodRealError);
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
        result = await result;
    return result.issues.length
        ? {
            success: false,
            error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config()))),
        }
        : { success: true, data: result.value };
};
const safeParseAsync$1 = /* @__PURE__*/ _safeParseAsync($ZodRealError);
const _encode = (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
    return _parse(_Err)(schema, value, ctx);
};
const _decode = (_Err) => (schema, value, _ctx) => {
    return _parse(_Err)(schema, value, _ctx);
};
const _encodeAsync = (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
    return _parseAsync(_Err)(schema, value, ctx);
};
const _decodeAsync = (_Err) => async (schema, value, _ctx) => {
    return _parseAsync(_Err)(schema, value, _ctx);
};
const _safeEncode = (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
    return _safeParse(_Err)(schema, value, ctx);
};
const _safeDecode = (_Err) => (schema, value, _ctx) => {
    return _safeParse(_Err)(schema, value, _ctx);
};
const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
    return _safeParseAsync(_Err)(schema, value, ctx);
};
const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
    return _safeParseAsync(_Err)(schema, value, _ctx);
};

// import { $ZodType } from "./schemas.js";
const $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
    var _a;
    inst._zod ?? (inst._zod = {});
    inst._zod.def = def;
    (_a = inst._zod).onattach ?? (_a.onattach = []);
});
const $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== undefined;
    });
    inst._zod.onattach.push((inst) => {
        const curr = (inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY);
        if (def.maximum < curr)
            inst._zod.bag.maximum = def.maximum;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length <= def.maximum)
            return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
            origin,
            code: "too_big",
            maximum: def.maximum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== undefined;
    });
    inst._zod.onattach.push((inst) => {
        const curr = (inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY);
        if (def.minimum > curr)
            inst._zod.bag.minimum = def.minimum;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length >= def.minimum)
            return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
            origin,
            code: "too_small",
            minimum: def.minimum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== undefined;
    });
    inst._zod.onattach.push((inst) => {
        const bag = inst._zod.bag;
        bag.minimum = def.length;
        bag.maximum = def.length;
        bag.length = def.length;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length === def.length)
            return;
        const origin = getLengthableOrigin(input);
        const tooBig = length > def.length;
        payload.issues.push({
            origin,
            ...(tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length }),
            inclusive: true,
            exact: true,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload) => {
        payload.value = def.tx(payload.value);
    };
});

const version = {
    major: 4,
    minor: 3,
    patch: 6,
};

const $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
    var _a;
    inst ?? (inst = {});
    inst._zod.def = def; // set _def property
    inst._zod.bag = inst._zod.bag || {}; // initialize _bag object
    inst._zod.version = version;
    const checks = [...(inst._zod.def.checks ?? [])];
    // if inst is itself a checks.$ZodCheck, run it as a check
    if (inst._zod.traits.has("$ZodCheck")) {
        checks.unshift(inst);
    }
    for (const ch of checks) {
        for (const fn of ch._zod.onattach) {
            fn(inst);
        }
    }
    if (checks.length === 0) {
        // deferred initializer
        // inst._zod.parse is not yet defined
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred?.push(() => {
            inst._zod.run = inst._zod.parse;
        });
    }
    else {
        const runChecks = (payload, checks, ctx) => {
            let isAborted = aborted(payload);
            let asyncResult;
            for (const ch of checks) {
                if (ch._zod.def.when) {
                    const shouldRun = ch._zod.def.when(payload);
                    if (!shouldRun)
                        continue;
                }
                else if (isAborted) {
                    continue;
                }
                const currLen = payload.issues.length;
                const _ = ch._zod.check(payload);
                if (_ instanceof Promise && ctx?.async === false) {
                    throw new $ZodAsyncError();
                }
                if (asyncResult || _ instanceof Promise) {
                    asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
                        await _;
                        const nextLen = payload.issues.length;
                        if (nextLen === currLen)
                            return;
                        if (!isAborted)
                            isAborted = aborted(payload, currLen);
                    });
                }
                else {
                    const nextLen = payload.issues.length;
                    if (nextLen === currLen)
                        continue;
                    if (!isAborted)
                        isAborted = aborted(payload, currLen);
                }
            }
            if (asyncResult) {
                return asyncResult.then(() => {
                    return payload;
                });
            }
            return payload;
        };
        const handleCanaryResult = (canary, payload, ctx) => {
            // abort if the canary is aborted
            if (aborted(canary)) {
                canary.aborted = true;
                return canary;
            }
            // run checks first, then
            const checkResult = runChecks(payload, checks, ctx);
            if (checkResult instanceof Promise) {
                if (ctx.async === false)
                    throw new $ZodAsyncError();
                return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
            }
            return inst._zod.parse(checkResult, ctx);
        };
        inst._zod.run = (payload, ctx) => {
            if (ctx.skipChecks) {
                return inst._zod.parse(payload, ctx);
            }
            if (ctx.direction === "backward") {
                // run canary
                // initial pass (no checks)
                const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
                if (canary instanceof Promise) {
                    return canary.then((canary) => {
                        return handleCanaryResult(canary, payload, ctx);
                    });
                }
                return handleCanaryResult(canary, payload, ctx);
            }
            // forward
            const result = inst._zod.parse(payload, ctx);
            if (result instanceof Promise) {
                if (ctx.async === false)
                    throw new $ZodAsyncError();
                return result.then((result) => runChecks(result, checks, ctx));
            }
            return runChecks(result, checks, ctx);
        };
    }
    // Lazy initialize ~standard to avoid creating objects for every schema
    defineLazy(inst, "~standard", () => ({
        validate: (value) => {
            try {
                const r = safeParse$1(inst, value);
                return r.success ? { value: r.data } : { issues: r.error?.issues };
            }
            catch (_) {
                return safeParseAsync$1(inst, value).then((r) => (r.success ? { value: r.data } : { issues: r.error?.issues }));
            }
        },
        vendor: "zod",
        version: 1,
    }));
});
function handleArrayResult(result, final, index) {
    if (result.issues.length) {
        final.issues.push(...prefixIssues(index, result.issues));
    }
    final.value[index] = result.value;
}
const $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!Array.isArray(input)) {
            payload.issues.push({
                expected: "array",
                code: "invalid_type",
                input,
                inst,
            });
            return payload;
        }
        payload.value = Array(input.length);
        const proms = [];
        for (let i = 0; i < input.length; i++) {
            const item = input[i];
            const result = def.element._zod.run({
                value: item,
                issues: [],
            }, ctx);
            if (result instanceof Promise) {
                proms.push(result.then((result) => handleArrayResult(result, payload, i)));
            }
            else {
                handleArrayResult(result, payload, i);
            }
        }
        if (proms.length) {
            return Promise.all(proms).then(() => payload);
        }
        return payload; //handleArrayResultsAsync(parseResults, final);
    };
});
function handleUnionResults(results, final, inst, ctx) {
    for (const result of results) {
        if (result.issues.length === 0) {
            final.value = result.value;
            return final;
        }
    }
    const nonaborted = results.filter((r) => !aborted(r));
    if (nonaborted.length === 1) {
        final.value = nonaborted[0].value;
        return nonaborted[0];
    }
    final.issues.push({
        code: "invalid_union",
        input: final.value,
        inst,
        errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config()))),
    });
    return final;
}
const $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : undefined);
    defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : undefined);
    defineLazy(inst._zod, "values", () => {
        if (def.options.every((o) => o._zod.values)) {
            return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
        }
        return undefined;
    });
    defineLazy(inst._zod, "pattern", () => {
        if (def.options.every((o) => o._zod.pattern)) {
            const patterns = def.options.map((o) => o._zod.pattern);
            return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
        }
        return undefined;
    });
    const single = def.options.length === 1;
    const first = def.options[0]._zod.run;
    inst._zod.parse = (payload, ctx) => {
        if (single) {
            return first(payload, ctx);
        }
        let async = false;
        const results = [];
        for (const option of def.options) {
            const result = option._zod.run({
                value: payload.value,
                issues: [],
            }, ctx);
            if (result instanceof Promise) {
                results.push(result);
                async = true;
            }
            else {
                if (result.issues.length === 0)
                    return result;
                results.push(result);
            }
        }
        if (!async)
            return handleUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results) => {
            return handleUnionResults(results, payload, inst, ctx);
        });
    };
});
const $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        const left = def.left._zod.run({ value: input, issues: [] }, ctx);
        const right = def.right._zod.run({ value: input, issues: [] }, ctx);
        const async = left instanceof Promise || right instanceof Promise;
        if (async) {
            return Promise.all([left, right]).then(([left, right]) => {
                return handleIntersectionResults(payload, left, right);
            });
        }
        return handleIntersectionResults(payload, left, right);
    };
});
function mergeValues(a, b) {
    // const aType = parse.t(a);
    // const bType = parse.t(b);
    if (a === b) {
        return { valid: true, data: a };
    }
    if (a instanceof Date && b instanceof Date && +a === +b) {
        return { valid: true, data: a };
    }
    if (isPlainObject(a) && isPlainObject(b)) {
        const bKeys = Object.keys(b);
        const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        for (const key of sharedKeys) {
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return {
                    valid: false,
                    mergeErrorPath: [key, ...sharedValue.mergeErrorPath],
                };
            }
            newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return { valid: false, mergeErrorPath: [] };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return {
                    valid: false,
                    mergeErrorPath: [index, ...sharedValue.mergeErrorPath],
                };
            }
            newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
    }
    return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
    // Track which side(s) report each key as unrecognized
    const unrecKeys = new Map();
    let unrecIssue;
    for (const iss of left.issues) {
        if (iss.code === "unrecognized_keys") {
            unrecIssue ?? (unrecIssue = iss);
            for (const k of iss.keys) {
                if (!unrecKeys.has(k))
                    unrecKeys.set(k, {});
                unrecKeys.get(k).l = true;
            }
        }
        else {
            result.issues.push(iss);
        }
    }
    for (const iss of right.issues) {
        if (iss.code === "unrecognized_keys") {
            for (const k of iss.keys) {
                if (!unrecKeys.has(k))
                    unrecKeys.set(k, {});
                unrecKeys.get(k).r = true;
            }
        }
        else {
            result.issues.push(iss);
        }
    }
    // Report only keys unrecognized by BOTH sides
    const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
    if (bothKeys.length && unrecIssue) {
        result.issues.push({ ...unrecIssue, keys: bothKeys });
    }
    if (aborted(result))
        return result;
    const merged = mergeValues(left.value, right.value);
    if (!merged.valid) {
        throw new Error(`Unmergable intersection. Error path: ` + `${JSON.stringify(merged.mergeErrorPath)}`);
    }
    result.value = merged.data;
    return result;
}
const $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
    $ZodType.init(inst, def);
    const values = getEnumValues(def.entries);
    const valuesSet = new Set(values);
    inst._zod.values = valuesSet;
    inst._zod.pattern = new RegExp(`^(${values
        .filter((k) => propertyKeyTypes.has(typeof k))
        .map((o) => (typeof o === "string" ? escapeRegex(o) : o.toString()))
        .join("|")})$`);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (valuesSet.has(input)) {
            return payload;
        }
        payload.issues.push({
            code: "invalid_value",
            values,
            input,
            inst,
        });
        return payload;
    };
});
const $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            throw new $ZodEncodeError(inst.constructor.name);
        }
        const _out = def.transform(payload.value, payload);
        if (ctx.async) {
            const output = _out instanceof Promise ? _out : Promise.resolve(_out);
            return output.then((output) => {
                payload.value = output;
                return payload;
            });
        }
        if (_out instanceof Promise) {
            throw new $ZodAsyncError();
        }
        payload.value = _out;
        return payload;
    };
});
function handleOptionalResult(result, input) {
    if (result.issues.length && input === undefined) {
        return { issues: [], value: undefined };
    }
    return result;
}
const $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    inst._zod.optout = "optional";
    defineLazy(inst._zod, "values", () => {
        return def.innerType._zod.values ? new Set([...def.innerType._zod.values, undefined]) : undefined;
    });
    defineLazy(inst._zod, "pattern", () => {
        const pattern = def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : undefined;
    });
    inst._zod.parse = (payload, ctx) => {
        if (def.innerType._zod.optin === "optional") {
            const result = def.innerType._zod.run(payload, ctx);
            if (result instanceof Promise)
                return result.then((r) => handleOptionalResult(r, payload.value));
            return handleOptionalResult(result, payload.value);
        }
        if (payload.value === undefined) {
            return payload;
        }
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
    // Call parent init - inherits optin/optout = "optional"
    $ZodOptional.init(inst, def);
    // Override values/pattern to NOT add undefined
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
    // Override parse to just delegate (no undefined handling)
    inst._zod.parse = (payload, ctx) => {
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
    defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
    defineLazy(inst._zod, "pattern", () => {
        const pattern = def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : undefined;
    });
    defineLazy(inst._zod, "values", () => {
        return def.innerType._zod.values ? new Set([...def.innerType._zod.values, null]) : undefined;
    });
    inst._zod.parse = (payload, ctx) => {
        // Forward direction (decode): allow null to pass through
        if (payload.value === null)
            return payload;
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
    $ZodType.init(inst, def);
    // inst._zod.qin = "true";
    inst._zod.optin = "optional";
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        // Forward direction (decode): apply defaults for undefined input
        if (payload.value === undefined) {
            payload.value = def.defaultValue;
            /**
             * $ZodDefault returns the default value immediately in forward direction.
             * It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
            return payload;
        }
        // Forward direction: continue with default handling
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => handleDefaultResult(result, def));
        }
        return handleDefaultResult(result, def);
    };
});
function handleDefaultResult(payload, def) {
    if (payload.value === undefined) {
        payload.value = def.defaultValue;
    }
    return payload;
}
const $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        // Forward direction (decode): apply prefault for undefined input
        if (payload.value === undefined) {
            payload.value = def.defaultValue;
        }
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "values", () => {
        const v = def.innerType._zod.values;
        return v ? new Set([...v].filter((x) => x !== undefined)) : undefined;
    });
    inst._zod.parse = (payload, ctx) => {
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => handleNonOptionalResult(result, inst));
        }
        return handleNonOptionalResult(result, inst);
    };
});
function handleNonOptionalResult(payload, inst) {
    if (!payload.issues.length && payload.value === undefined) {
        payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: payload.value,
            inst,
        });
    }
    return payload;
}
const $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
    defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        // Forward direction (decode): apply catch logic
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => {
                payload.value = result.value;
                if (result.issues.length) {
                    payload.value = def.catchValue({
                        ...payload,
                        error: {
                            issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())),
                        },
                        input: payload.value,
                    });
                    payload.issues = [];
                }
                return payload;
            });
        }
        payload.value = result.value;
        if (result.issues.length) {
            payload.value = def.catchValue({
                ...payload,
                error: {
                    issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())),
                },
                input: payload.value,
            });
            payload.issues = [];
        }
        return payload;
    };
});
const $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "values", () => def.in._zod.values);
    defineLazy(inst._zod, "optin", () => def.in._zod.optin);
    defineLazy(inst._zod, "optout", () => def.out._zod.optout);
    defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            const right = def.out._zod.run(payload, ctx);
            if (right instanceof Promise) {
                return right.then((right) => handlePipeResult(right, def.in, ctx));
            }
            return handlePipeResult(right, def.in, ctx);
        }
        const left = def.in._zod.run(payload, ctx);
        if (left instanceof Promise) {
            return left.then((left) => handlePipeResult(left, def.out, ctx));
        }
        return handlePipeResult(left, def.out, ctx);
    };
});
function handlePipeResult(left, next, ctx) {
    if (left.issues.length) {
        // prevent further checks
        left.aborted = true;
        return left;
    }
    return next._zod.run({ value: left.value, issues: left.issues }, ctx);
}
const $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
    defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then(handleReadonlyResult);
        }
        return handleReadonlyResult(result);
    };
});
function handleReadonlyResult(payload) {
    payload.value = Object.freeze(payload.value);
    return payload;
}
const $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
    $ZodCheck.init(inst, def);
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _) => {
        return payload;
    };
    inst._zod.check = (payload) => {
        const input = payload.value;
        const r = def.fn(input);
        if (r instanceof Promise) {
            return r.then((r) => handleRefineResult(r, payload, input, inst));
        }
        handleRefineResult(r, payload, input, inst);
        return;
    };
});
function handleRefineResult(result, payload, input, inst) {
    if (!result) {
        const _iss = {
            code: "custom",
            input,
            inst, // incorporates params.error into issue reporting
            path: [...(inst._zod.def.path ?? [])], // incorporates params.error into issue reporting
            continue: !inst._zod.def.abort,
            // params: inst._zod.def.params,
        };
        if (inst._zod.def.params)
            _iss.params = inst._zod.def.params;
        payload.issues.push(issue(_iss));
    }
}

var _a;
class $ZodRegistry {
    constructor() {
        this._map = new WeakMap();
        this._idmap = new Map();
    }
    add(schema, ..._meta) {
        const meta = _meta[0];
        this._map.set(schema, meta);
        if (meta && typeof meta === "object" && "id" in meta) {
            this._idmap.set(meta.id, schema);
        }
        return this;
    }
    clear() {
        this._map = new WeakMap();
        this._idmap = new Map();
        return this;
    }
    remove(schema) {
        const meta = this._map.get(schema);
        if (meta && typeof meta === "object" && "id" in meta) {
            this._idmap.delete(meta.id);
        }
        this._map.delete(schema);
        return this;
    }
    get(schema) {
        // return this._map.get(schema) as any;
        // inherit metadata
        const p = schema._zod.parent;
        if (p) {
            const pm = { ...(this.get(p) ?? {}) };
            delete pm.id; // do not inherit id
            const f = { ...pm, ...this._map.get(schema) };
            return Object.keys(f).length ? f : undefined;
        }
        return this._map.get(schema);
    }
    has(schema) {
        return this._map.has(schema);
    }
}
// registries
function registry() {
    return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;

// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
    const ch = new $ZodCheckMaxLength({
        check: "max_length",
        ...normalizeParams(params),
        maximum,
    });
    return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
    return new $ZodCheckMinLength({
        check: "min_length",
        ...normalizeParams(params),
        minimum,
    });
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
    return new $ZodCheckLengthEquals({
        check: "length_equals",
        ...normalizeParams(params),
        length,
    });
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
    return new $ZodCheckOverwrite({
        check: "overwrite",
        tx,
    });
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
    return new Class({
        type: "array",
        element,
        // get element() {
        //   return element;
        // },
        ...normalizeParams(params),
    });
}
// same as _custom but defaults to abort:false
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
    const schema = new Class({
        type: "custom",
        check: "custom",
        fn: fn,
        ...normalizeParams(_params),
    });
    return schema;
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn) {
    const ch = _check((payload) => {
        payload.addIssue = (issue$1) => {
            if (typeof issue$1 === "string") {
                payload.issues.push(issue(issue$1, payload.value, ch._zod.def));
            }
            else {
                // for Zod 3 backwards compatibility
                const _issue = issue$1;
                if (_issue.fatal)
                    _issue.continue = false;
                _issue.code ?? (_issue.code = "custom");
                _issue.input ?? (_issue.input = payload.value);
                _issue.inst ?? (_issue.inst = ch);
                _issue.continue ?? (_issue.continue = !ch._zod.def.abort); // abort is always undefined, so this is always true...
                payload.issues.push(issue(_issue));
            }
        };
        return fn(payload.value, payload);
    });
    return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
    const ch = new $ZodCheck({
        check: "custom",
        ...normalizeParams(params),
    });
    ch._zod.check = fn;
    return ch;
}

// function initializeContext<T extends schemas.$ZodType>(inputs: JSONSchemaGeneratorParams<T>): ToJSONSchemaContext<T> {
//   return {
//     processor: inputs.processor,
//     metadataRegistry: inputs.metadata ?? globalRegistry,
//     target: inputs.target ?? "draft-2020-12",
//     unrepresentable: inputs.unrepresentable ?? "throw",
//   };
// }
function initializeContext(params) {
    // Normalize target: convert old non-hyphenated versions to hyphenated versions
    let target = params?.target ?? "draft-2020-12";
    if (target === "draft-4")
        target = "draft-04";
    if (target === "draft-7")
        target = "draft-07";
    return {
        processors: params.processors ?? {},
        metadataRegistry: params?.metadata ?? globalRegistry,
        target,
        unrepresentable: params?.unrepresentable ?? "throw",
        override: params?.override ?? (() => { }),
        io: params?.io ?? "output",
        counter: 0,
        seen: new Map(),
        cycles: params?.cycles ?? "ref",
        reused: params?.reused ?? "inline",
        external: params?.external ?? undefined,
    };
}
function process$1(schema, ctx, _params = { path: [], schemaPath: [] }) {
    var _a;
    const def = schema._zod.def;
    // check for schema in seens
    const seen = ctx.seen.get(schema);
    if (seen) {
        seen.count++;
        // check if cycle
        const isCycle = _params.schemaPath.includes(schema);
        if (isCycle) {
            seen.cycle = _params.path;
        }
        return seen.schema;
    }
    // initialize
    const result = { schema: {}, count: 1, cycle: undefined, path: _params.path };
    ctx.seen.set(schema, result);
    // custom method overrides default behavior
    const overrideSchema = schema._zod.toJSONSchema?.();
    if (overrideSchema) {
        result.schema = overrideSchema;
    }
    else {
        const params = {
            ..._params,
            schemaPath: [..._params.schemaPath, schema],
            path: _params.path,
        };
        if (schema._zod.processJSONSchema) {
            schema._zod.processJSONSchema(ctx, result.schema, params);
        }
        else {
            const _json = result.schema;
            const processor = ctx.processors[def.type];
            if (!processor) {
                throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
            }
            processor(schema, ctx, _json, params);
        }
        const parent = schema._zod.parent;
        if (parent) {
            // Also set ref if processor didn't (for inheritance)
            if (!result.ref)
                result.ref = parent;
            process$1(parent, ctx, params);
            ctx.seen.get(parent).isParent = true;
        }
    }
    // metadata
    const meta = ctx.metadataRegistry.get(schema);
    if (meta)
        Object.assign(result.schema, meta);
    if (ctx.io === "input" && isTransforming(schema)) {
        // examples/defaults only apply to output type of pipe
        delete result.schema.examples;
        delete result.schema.default;
    }
    // set prefault as default
    if (ctx.io === "input" && result.schema._prefault)
        (_a = result.schema).default ?? (_a.default = result.schema._prefault);
    delete result.schema._prefault;
    // pulling fresh from ctx.seen in case it was overwritten
    const _result = ctx.seen.get(schema);
    return _result.schema;
}
function extractDefs(ctx, schema
// params: EmitParams
) {
    // iterate over seen map;
    const root = ctx.seen.get(schema);
    if (!root)
        throw new Error("Unprocessed schema. This is a bug in Zod.");
    // Track ids to detect duplicates across different schemas
    const idToSchema = new Map();
    for (const entry of ctx.seen.entries()) {
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
            const existing = idToSchema.get(id);
            if (existing && existing !== entry[0]) {
                throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
            }
            idToSchema.set(id, entry[0]);
        }
    }
    // returns a ref to the schema
    // defId will be empty if the ref points to an external schema (or #)
    const makeURI = (entry) => {
        // comparing the seen objects because sometimes
        // multiple schemas map to the same seen object.
        // e.g. lazy
        // external is configured
        const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
        if (ctx.external) {
            const externalId = ctx.external.registry.get(entry[0])?.id; // ?? "__shared";// `__schema${ctx.counter++}`;
            // check if schema is in the external registry
            const uriGenerator = ctx.external.uri ?? ((id) => id);
            if (externalId) {
                return { ref: uriGenerator(externalId) };
            }
            // otherwise, add to __shared
            const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
            entry[1].defId = id; // set defId so it will be reused if needed
            return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
        }
        if (entry[1] === root) {
            return { ref: "#" };
        }
        // self-contained schema
        const uriPrefix = `#`;
        const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
        const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
        return { defId, ref: defUriPrefix + defId };
    };
    // stored cached version in `def` property
    // remove all properties, set $ref
    const extractToDef = (entry) => {
        // if the schema is already a reference, do not extract it
        if (entry[1].schema.$ref) {
            return;
        }
        const seen = entry[1];
        const { ref, defId } = makeURI(entry);
        seen.def = { ...seen.schema };
        // defId won't be set if the schema is a reference to an external schema
        // or if the schema is the root schema
        if (defId)
            seen.defId = defId;
        // wipe away all properties except $ref
        const schema = seen.schema;
        for (const key in schema) {
            delete schema[key];
        }
        schema.$ref = ref;
    };
    // throw on cycles
    // break cycles
    if (ctx.cycles === "throw") {
        for (const entry of ctx.seen.entries()) {
            const seen = entry[1];
            if (seen.cycle) {
                throw new Error("Cycle detected: " +
                    `#/${seen.cycle?.join("/")}/<root>` +
                    '\n\nSet the `cycles` parameter to `"ref"` to resolve cyclical schemas with defs.');
            }
        }
    }
    // extract schemas into $defs
    for (const entry of ctx.seen.entries()) {
        const seen = entry[1];
        // convert root schema to # $ref
        if (schema === entry[0]) {
            extractToDef(entry); // this has special handling for the root schema
            continue;
        }
        // extract schemas that are in the external registry
        if (ctx.external) {
            const ext = ctx.external.registry.get(entry[0])?.id;
            if (schema !== entry[0] && ext) {
                extractToDef(entry);
                continue;
            }
        }
        // extract schemas with `id` meta
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
            extractToDef(entry);
            continue;
        }
        // break cycles
        if (seen.cycle) {
            // any
            extractToDef(entry);
            continue;
        }
        // extract reused schemas
        if (seen.count > 1) {
            if (ctx.reused === "ref") {
                extractToDef(entry);
                // biome-ignore lint:
                continue;
            }
        }
    }
}
function finalize(ctx, schema) {
    const root = ctx.seen.get(schema);
    if (!root)
        throw new Error("Unprocessed schema. This is a bug in Zod.");
    // flatten refs - inherit properties from parent schemas
    const flattenRef = (zodSchema) => {
        const seen = ctx.seen.get(zodSchema);
        // already processed
        if (seen.ref === null)
            return;
        const schema = seen.def ?? seen.schema;
        const _cached = { ...schema };
        const ref = seen.ref;
        seen.ref = null; // prevent infinite recursion
        if (ref) {
            flattenRef(ref);
            const refSeen = ctx.seen.get(ref);
            const refSchema = refSeen.schema;
            // merge referenced schema into current
            if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
                // older drafts can't combine $ref with other properties
                schema.allOf = schema.allOf ?? [];
                schema.allOf.push(refSchema);
            }
            else {
                Object.assign(schema, refSchema);
            }
            // restore child's own properties (child wins)
            Object.assign(schema, _cached);
            const isParentRef = zodSchema._zod.parent === ref;
            // For parent chain, child is a refinement - remove parent-only properties
            if (isParentRef) {
                for (const key in schema) {
                    if (key === "$ref" || key === "allOf")
                        continue;
                    if (!(key in _cached)) {
                        delete schema[key];
                    }
                }
            }
            // When ref was extracted to $defs, remove properties that match the definition
            if (refSchema.$ref && refSeen.def) {
                for (const key in schema) {
                    if (key === "$ref" || key === "allOf")
                        continue;
                    if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) {
                        delete schema[key];
                    }
                }
            }
        }
        // If parent was extracted (has $ref), propagate $ref to this schema
        // This handles cases like: readonly().meta({id}).describe()
        // where processor sets ref to innerType but parent should be referenced
        const parent = zodSchema._zod.parent;
        if (parent && parent !== ref) {
            // Ensure parent is processed first so its def has inherited properties
            flattenRef(parent);
            const parentSeen = ctx.seen.get(parent);
            if (parentSeen?.schema.$ref) {
                schema.$ref = parentSeen.schema.$ref;
                // De-duplicate with parent's definition
                if (parentSeen.def) {
                    for (const key in schema) {
                        if (key === "$ref" || key === "allOf")
                            continue;
                        if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) {
                            delete schema[key];
                        }
                    }
                }
            }
        }
        // execute overrides
        ctx.override({
            zodSchema: zodSchema,
            jsonSchema: schema,
            path: seen.path ?? [],
        });
    };
    for (const entry of [...ctx.seen.entries()].reverse()) {
        flattenRef(entry[0]);
    }
    const result = {};
    if (ctx.target === "draft-2020-12") {
        result.$schema = "https://json-schema.org/draft/2020-12/schema";
    }
    else if (ctx.target === "draft-07") {
        result.$schema = "http://json-schema.org/draft-07/schema#";
    }
    else if (ctx.target === "draft-04") {
        result.$schema = "http://json-schema.org/draft-04/schema#";
    }
    else if (ctx.target === "openapi-3.0") ;
    else ;
    if (ctx.external?.uri) {
        const id = ctx.external.registry.get(schema)?.id;
        if (!id)
            throw new Error("Schema is missing an `id` property");
        result.$id = ctx.external.uri(id);
    }
    Object.assign(result, root.def ?? root.schema);
    // build defs object
    const defs = ctx.external?.defs ?? {};
    for (const entry of ctx.seen.entries()) {
        const seen = entry[1];
        if (seen.def && seen.defId) {
            defs[seen.defId] = seen.def;
        }
    }
    // set definitions in result
    if (ctx.external) ;
    else {
        if (Object.keys(defs).length > 0) {
            if (ctx.target === "draft-2020-12") {
                result.$defs = defs;
            }
            else {
                result.definitions = defs;
            }
        }
    }
    try {
        // this "finalizes" this schema and ensures all cycles are removed
        // each call to finalize() is functionally independent
        // though the seen map is shared
        const finalized = JSON.parse(JSON.stringify(result));
        Object.defineProperty(finalized, "~standard", {
            value: {
                ...schema["~standard"],
                jsonSchema: {
                    input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
                    output: createStandardJSONSchemaMethod(schema, "output", ctx.processors),
                },
            },
            enumerable: false,
            writable: false,
        });
        return finalized;
    }
    catch (_err) {
        throw new Error("Error converting schema to JSON.");
    }
}
function isTransforming(_schema, _ctx) {
    const ctx = _ctx ?? { seen: new Set() };
    if (ctx.seen.has(_schema))
        return false;
    ctx.seen.add(_schema);
    const def = _schema._zod.def;
    if (def.type === "transform")
        return true;
    if (def.type === "array")
        return isTransforming(def.element, ctx);
    if (def.type === "set")
        return isTransforming(def.valueType, ctx);
    if (def.type === "lazy")
        return isTransforming(def.getter(), ctx);
    if (def.type === "promise" ||
        def.type === "optional" ||
        def.type === "nonoptional" ||
        def.type === "nullable" ||
        def.type === "readonly" ||
        def.type === "default" ||
        def.type === "prefault") {
        return isTransforming(def.innerType, ctx);
    }
    if (def.type === "intersection") {
        return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
    }
    if (def.type === "record" || def.type === "map") {
        return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    }
    if (def.type === "pipe") {
        return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
    }
    if (def.type === "object") {
        for (const key in def.shape) {
            if (isTransforming(def.shape[key], ctx))
                return true;
        }
        return false;
    }
    if (def.type === "union") {
        for (const option of def.options) {
            if (isTransforming(option, ctx))
                return true;
        }
        return false;
    }
    if (def.type === "tuple") {
        for (const item of def.items) {
            if (isTransforming(item, ctx))
                return true;
        }
        if (def.rest && isTransforming(def.rest, ctx))
            return true;
        return false;
    }
    return false;
}
/**
 * Creates a toJSONSchema method for a schema instance.
 * This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
 */
const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
    const ctx = initializeContext({ ...params, processors });
    process$1(schema, ctx);
    extractDefs(ctx, schema);
    return finalize(ctx, schema);
};
const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
    const { libraryOptions, target } = params ?? {};
    const ctx = initializeContext({ ...(libraryOptions ?? {}), target, io, processors });
    process$1(schema, ctx);
    extractDefs(ctx, schema);
    return finalize(ctx, schema);
};

const enumProcessor = (schema, _ctx, json, _params) => {
    const def = schema._zod.def;
    const values = getEnumValues(def.entries);
    // Number enums can have both string and number values
    if (values.every((v) => typeof v === "number"))
        json.type = "number";
    if (values.every((v) => typeof v === "string"))
        json.type = "string";
    json.enum = values;
};
const customProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Custom types cannot be represented in JSON Schema");
    }
};
const transformProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Transforms cannot be represented in JSON Schema");
    }
};
// ==================== COMPOSITE TYPE PROCESSORS ====================
const arrayProcessor = (schema, ctx, _json, params) => {
    const json = _json;
    const def = schema._zod.def;
    const { minimum, maximum } = schema._zod.bag;
    if (typeof minimum === "number")
        json.minItems = minimum;
    if (typeof maximum === "number")
        json.maxItems = maximum;
    json.type = "array";
    json.items = process$1(def.element, ctx, { ...params, path: [...params.path, "items"] });
};
const unionProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    // Exclusive unions (inclusive === false) use oneOf (exactly one match) instead of anyOf (one or more matches)
    // This includes both z.xor() and discriminated unions
    const isExclusive = def.inclusive === false;
    const options = def.options.map((x, i) => process$1(x, ctx, {
        ...params,
        path: [...params.path, isExclusive ? "oneOf" : "anyOf", i],
    }));
    if (isExclusive) {
        json.oneOf = options;
    }
    else {
        json.anyOf = options;
    }
};
const intersectionProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    const a = process$1(def.left, ctx, {
        ...params,
        path: [...params.path, "allOf", 0],
    });
    const b = process$1(def.right, ctx, {
        ...params,
        path: [...params.path, "allOf", 1],
    });
    const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
    const allOf = [
        ...(isSimpleIntersection(a) ? a.allOf : [a]),
        ...(isSimpleIntersection(b) ? b.allOf : [b]),
    ];
    json.allOf = allOf;
};
const nullableProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    const inner = process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    if (ctx.target === "openapi-3.0") {
        seen.ref = def.innerType;
        json.nullable = true;
    }
    else {
        json.anyOf = [inner, { type: "null" }];
    }
};
const nonoptionalProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};
const defaultProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    json.default = JSON.parse(JSON.stringify(def.defaultValue));
};
const prefaultProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    if (ctx.io === "input")
        json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
const catchProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    let catchValue;
    try {
        catchValue = def.catchValue(undefined);
    }
    catch {
        throw new Error("Dynamic catch values are not supported in JSON Schema");
    }
    json.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    const innerType = ctx.io === "input" ? (def.in._zod.def.type === "transform" ? def.out : def.in) : def.out;
    process$1(innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    json.readOnly = true;
};
const optionalProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};

async function readBodyWithLimit(request, limit) {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > limit) {
      throw new BodySizeLimitError(limit);
    }
  }
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      received += value.byteLength;
      if (received > limit) {
        throw new BodySizeLimitError(limit);
      }
      chunks.push(value);
    }
  }
  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer;
}
class BodySizeLimitError extends Error {
  limit;
  constructor(limit) {
    super(`Request body exceeds the configured limit of ${limit} bytes`);
    this.name = "BodySizeLimitError";
    this.limit = limit;
  }
}

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/new-base", "DEV": false, "MODE": "production", "PROD": true, "SITE": undefined, "SSR": true};
function getActionContext(context) {
  const callerInfo = getCallerInfo(context);
  const actionResultAlreadySet = Boolean(context.locals._actionPayload);
  let action = void 0;
  if (callerInfo && context.request.method === "POST" && !actionResultAlreadySet) {
    action = {
      calledFrom: callerInfo.from,
      name: callerInfo.name,
      handler: async () => {
        const pipeline = Reflect.get(context, pipelineSymbol);
        const callerInfoName = shouldAppendForwardSlash(
          pipeline.manifest.trailingSlash,
          pipeline.manifest.buildFormat
        ) ? removeTrailingForwardSlash(callerInfo.name) : callerInfo.name;
        let baseAction;
        try {
          baseAction = await pipeline.getAction(callerInfoName);
        } catch (error) {
          if (error instanceof Error && "name" in error && typeof error.name === "string" && error.name === ActionNotFoundError.name) {
            return { data: void 0, error: new ActionError({ code: "NOT_FOUND" }) };
          }
          throw error;
        }
        const bodySizeLimit = pipeline.manifest.actionBodySizeLimit;
        let input;
        try {
          input = await parseRequestBody(context.request, bodySizeLimit);
        } catch (e) {
          if (e instanceof ActionError) {
            return { data: void 0, error: e };
          }
          if (e instanceof TypeError) {
            return { data: void 0, error: new ActionError({ code: "UNSUPPORTED_MEDIA_TYPE" }) };
          }
          throw e;
        }
        const omitKeys = ["props", "getActionResult", "callAction", "redirect"];
        const actionAPIContext = Object.create(
          Object.getPrototypeOf(context),
          Object.fromEntries(
            Object.entries(Object.getOwnPropertyDescriptors(context)).filter(
              ([key]) => !omitKeys.includes(key)
            )
          )
        );
        Reflect.set(actionAPIContext, ACTION_API_CONTEXT_SYMBOL, true);
        const handler = baseAction.bind(actionAPIContext);
        return handler(input);
      }
    };
  }
  function setActionResult(actionName, actionResult) {
    context.locals._actionPayload = {
      actionResult,
      actionName
    };
  }
  return {
    action,
    setActionResult,
    serializeActionResult,
    deserializeActionResult
  };
}
function getCallerInfo(ctx) {
  if (ctx.routePattern === ACTION_RPC_ROUTE_PATTERN) {
    return { from: "rpc", name: ctx.url.pathname.replace(/^.*\/_actions\//, "") };
  }
  const queryParam = ctx.url.searchParams.get(ACTION_QUERY_PARAMS.actionName);
  if (queryParam) {
    return { from: "form", name: queryParam };
  }
  return void 0;
}
async function parseRequestBody(request, bodySizeLimit) {
  const contentType = request.headers.get("content-type");
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : void 0;
  const hasContentLength = typeof contentLength === "number" && Number.isFinite(contentLength);
  if (!contentType) return void 0;
  if (hasContentLength && contentLength > bodySizeLimit) {
    throw new ActionError({
      code: "CONTENT_TOO_LARGE",
      message: `Request body exceeds ${bodySizeLimit} bytes`
    });
  }
  try {
    if (hasContentType(contentType, formContentTypes)) {
      if (!hasContentLength) {
        const body = await readBodyWithLimit(request.clone(), bodySizeLimit);
        const formRequest = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: toArrayBuffer(body)
        });
        return await formRequest.formData();
      }
      return await request.clone().formData();
    }
    if (hasContentType(contentType, ["application/json"])) {
      if (contentLength === 0) return void 0;
      if (!hasContentLength) {
        const body = await readBodyWithLimit(request.clone(), bodySizeLimit);
        if (body.byteLength === 0) return void 0;
        return JSON.parse(new TextDecoder().decode(body));
      }
      return await request.clone().json();
    }
  } catch (e) {
    if (e instanceof BodySizeLimitError) {
      throw new ActionError({
        code: "CONTENT_TOO_LARGE",
        message: `Request body exceeds ${bodySizeLimit} bytes`
      });
    }
    throw e;
  }
  throw new TypeError("Unsupported content type");
}
const ACTION_API_CONTEXT_SYMBOL = /* @__PURE__ */ Symbol.for("astro.actionAPIContext");
const formContentTypes = ["application/x-www-form-urlencoded", "multipart/form-data"];
function hasContentType(contentType, expected) {
  const type = contentType.split(";")[0].toLowerCase();
  return expected.some((t) => type === t);
}
function serializeActionResult(res) {
  if (res.error) {
    if (Object.assign(__vite_import_meta_env__, { _: "/home/felixicaza/.local/share/pnpm/pnpm" })?.DEV) {
      actionResultErrorStack.set(res.error.stack);
    }
    let body2;
    if (res.error instanceof ActionInputError) {
      body2 = {
        type: res.error.type,
        issues: res.error.issues,
        fields: res.error.fields
      };
    } else {
      body2 = {
        ...res.error,
        message: res.error.message
      };
    }
    return {
      type: "error",
      status: res.error.status,
      contentType: "application/json",
      body: JSON.stringify(body2)
    };
  }
  if (res.data === void 0) {
    return {
      type: "empty",
      status: 204
    };
  }
  let body;
  try {
    body = stringify$2(res.data, {
      // Add support for URL objects
      URL: (value) => value instanceof URL && value.href
    });
  } catch (e) {
    let hint = ActionsReturnedInvalidDataError.hint;
    if (res.data instanceof Response) {
      hint = REDIRECT_STATUS_CODES.includes(res.data.status) ? "If you need to redirect when the action succeeds, trigger a redirect where the action is called. See the Actions guide for server and client redirect examples: https://docs.astro.build/en/guides/actions." : "If you need to return a Response object, try using a server endpoint instead. See https://docs.astro.build/en/guides/endpoints/#server-endpoints-api-routes";
    }
    throw new AstroError({
      ...ActionsReturnedInvalidDataError,
      message: ActionsReturnedInvalidDataError.message(String(e)),
      hint
    });
  }
  return {
    type: "data",
    status: 200,
    contentType: "application/json+devalue",
    body
  };
}
function toArrayBuffer(buffer) {
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return copy.buffer;
}

/* es-module-lexer 2.0.0 */
var ImportType;!function(A){A[A.Static=1]="Static",A[A.Dynamic=2]="Dynamic",A[A.ImportMeta=3]="ImportMeta",A[A.StaticSourcePhase=4]="StaticSourcePhase",A[A.DynamicSourcePhase=5]="DynamicSourcePhase",A[A.StaticDeferPhase=6]="StaticDeferPhase",A[A.DynamicDeferPhase=7]="DynamicDeferPhase";}(ImportType||(ImportType={}));1===new Uint8Array(new Uint16Array([1]).buffer)[0];const E=()=>{return A="AGFzbQEAAAABKwhgAX8Bf2AEf39/fwBgAAF/YAAAYAF/AGADf39/AX9gAn9/AX9gA39/fwADNzYAAQECAgICAgICAgICAgICAgICAgICAgICAwIAAwMDBAQAAAUAAAAAAAMDAwAGAAAABwAGAgUEBQFwAQEBBQMBAAEGDwJ/AUGw8gALfwBBsPIACwedARsGbWVtb3J5AgACc2EAAAFlAAMCaXMABAJpZQAFAnNzAAYCc2UABwJpdAAIAmFpAAkCaWQACgJpcAALAmVzAAwCZWUADQNlbHMADgNlbGUADwJyaQAQAnJlABEBZgASAm1zABMCcmEAFANha3MAFQNha2UAFgNhdnMAFwNhdmUAGANyc2EAGQVwYXJzZQAaC19faGVhcF9iYXNlAwEKkkY2aAEBf0EAIAA2AvQJQQAoAtAJIgEgAEEBdGoiAEEAOwEAQQAgAEECaiIANgL4CUEAIAA2AvwJQQBBADYC1AlBAEEANgLkCUEAQQA2AtwJQQBBADYC2AlBAEEANgLsCUEAQQA2AuAJIAEL0wEBA39BACgC5AkhBEEAQQAoAvwJIgU2AuQJQQAgBDYC6AlBACAFQShqNgL8CSAEQSRqQdQJIAQbIAU2AgBBACgCyAkhBEEAKALECSEGIAUgATYCACAFIAA2AgggBSACIAJBAmpBACAGIANGIgAbIAQgA0YiBBs2AgwgBSADNgIUIAVBADYCECAFIAI2AgQgBUIANwIgIAVBA0EBQQIgABsgBBs2AhwgBUEAKALECSADRiICOgAYAkACQCACDQBBACgCyAkgA0cNAQtBAEEBOgCACgsLXgEBf0EAKALsCSIEQRBqQdgJIAQbQQAoAvwJIgQ2AgBBACAENgLsCUEAIARBFGo2AvwJQQBBAToAgAogBEEANgIQIAQgAzYCDCAEIAI2AgggBCABNgIEIAQgADYCAAsIAEEAKAKECgsVAEEAKALcCSgCAEEAKALQCWtBAXULHgEBf0EAKALcCSgCBCIAQQAoAtAJa0EBdUF/IAAbCxUAQQAoAtwJKAIIQQAoAtAJa0EBdQseAQF/QQAoAtwJKAIMIgBBACgC0AlrQQF1QX8gABsLCwBBACgC3AkoAhwLHgEBf0EAKALcCSgCECIAQQAoAtAJa0EBdUF/IAAbCzsBAX8CQEEAKALcCSgCFCIAQQAoAsQJRw0AQX8PCwJAIABBACgCyAlHDQBBfg8LIABBACgC0AlrQQF1CwsAQQAoAtwJLQAYCxUAQQAoAuAJKAIAQQAoAtAJa0EBdQsVAEEAKALgCSgCBEEAKALQCWtBAXULHgEBf0EAKALgCSgCCCIAQQAoAtAJa0EBdUF/IAAbCx4BAX9BACgC4AkoAgwiAEEAKALQCWtBAXVBfyAAGwslAQF/QQBBACgC3AkiAEEkakHUCSAAGygCACIANgLcCSAAQQBHCyUBAX9BAEEAKALgCSIAQRBqQdgJIAAbKAIAIgA2AuAJIABBAEcLCABBAC0AiAoLCABBAC0AgAoLKwEBf0EAQQAoAowKIgBBEGpBACgC3AlBIGogABsoAgAiADYCjAogAEEARwsVAEEAKAKMCigCAEEAKALQCWtBAXULFQBBACgCjAooAgRBACgC0AlrQQF1CxUAQQAoAowKKAIIQQAoAtAJa0EBdQsVAEEAKAKMCigCDEEAKALQCWtBAXULCgBBAEEANgKMCgvdDQEFfyMAQYDQAGsiACQAQQBBAToAiApBAEEAKALMCTYClApBAEEAKALQCUF+aiIBNgKoCkEAIAFBACgC9AlBAXRqIgI2AqwKQQBBADoAgApBAEEAOwGQCkEAQQA7AZIKQQBBADoAmApBAEEANgKECkEAQQA6APAJQQAgAEGAEGo2ApwKQQAgADYCoApBAEEAOgCkCgJAAkACQAJAA0BBACABQQJqIgM2AqgKIAEgAk8NAQJAIAMvAQAiAkF3akEFSQ0AAkACQAJAAkACQCACQZt/ag4FAQgICAIACyACQSBGDQQgAkEvRg0DIAJBO0YNAgwHC0EALwGSCg0BIAMQG0UNASABQQRqQYIIQQoQNQ0BEBxBAC0AiAoNAUEAQQAoAqgKIgE2ApQKDAcLIAMQG0UNACABQQRqQYwIQQoQNQ0AEB0LQQBBACgCqAo2ApQKDAELAkAgAS8BBCIDQSpGDQAgA0EvRw0EEB4MAQtBARAfC0EAKAKsCiECQQAoAqgKIQEMAAsLQQAhAiADIQFBAC0A8AkNAgwBC0EAIAE2AqgKQQBBADoAiAoLA0BBACABQQJqIgM2AqgKAkACQAJAAkACQAJAAkAgAUEAKAKsCk8NACADLwEAIgJBd2pBBUkNBgJAAkACQAJAAkACQAJAAkACQAJAIAJBYGoOChAPBg8PDw8FAQIACwJAAkACQAJAIAJBoH9qDgoLEhIDEgESEhICAAsgAkGFf2oOAwURBgkLQQAvAZIKDRAgAxAbRQ0QIAFBBGpBgghBChA1DRAQHAwQCyADEBtFDQ8gAUEEakGMCEEKEDUNDxAdDA8LIAMQG0UNDiABKQAEQuyAhIOwjsA5Ug0OIAEvAQwiA0F3aiIBQRdLDQxBASABdEGfgIAEcUUNDAwNC0EAQQAvAZIKIgFBAWo7AZIKQQAoApwKIAFBA3RqIgFBATYCACABQQAoApQKNgIEDA0LQQAvAZIKIgNFDQlBACADQX9qIgM7AZIKQQAvAZAKIgJFDQxBACgCnAogA0H//wNxQQN0aigCAEEFRw0MAkAgAkECdEEAKAKgCmpBfGooAgAiAygCBA0AIANBACgClApBAmo2AgQLQQAgAkF/ajsBkAogAyABQQRqNgIMDAwLAkBBACgClAoiAS8BAEEpRw0AQQAoAuQJIgNFDQAgAygCBCABRw0AQQBBACgC6AkiAzYC5AkCQCADRQ0AIANBADYCJAwBC0EAQQA2AtQJC0EAQQAvAZIKIgNBAWo7AZIKQQAoApwKIANBA3RqIgNBBkECQQAtAKQKGzYCACADIAE2AgRBAEEAOgCkCgwLC0EALwGSCiIBRQ0HQQAgAUF/aiIBOwGSCkEAKAKcCiABQf//A3FBA3RqKAIAQQRGDQQMCgtBJxAgDAkLQSIQIAwICyACQS9HDQcCQAJAIAEvAQQiAUEqRg0AIAFBL0cNARAeDAoLQQEQHwwJCwJAAkACQAJAQQAoApQKIgEvAQAiAxAhRQ0AAkACQCADQVVqDgQACQEDCQsgAUF+ai8BAEErRg0DDAgLIAFBfmovAQBBLUYNAgwHCyADQSlHDQFBACgCnApBAC8BkgoiAkEDdGooAgQQIkUNAgwGCyABQX5qLwEAQVBqQf//A3FBCk8NBQtBAC8BkgohAgsCQAJAIAJB//8DcSICRQ0AIANB5gBHDQBBACgCnAogAkF/akEDdGoiBCgCAEEBRw0AIAFBfmovAQBB7wBHDQEgBCgCBEGWCEEDECNFDQEMBQsgA0H9AEcNAEEAKAKcCiACQQN0aiICKAIEECQNBCACKAIAQQZGDQQLIAEQJQ0DIANFDQMgA0EvRkEALQCYCkEAR3ENAwJAQQAoAuwJIgJFDQAgASACKAIASQ0AIAEgAigCBE0NBAsgAUF+aiEBQQAoAtAJIQICQANAIAFBAmoiBCACTQ0BQQAgATYClAogAS8BACEDIAFBfmoiBCEBIAMQJkUNAAsgBEECaiEECwJAIANB//8DcRAnRQ0AIARBfmohAQJAA0AgAUECaiIDIAJNDQFBACABNgKUCiABLwEAIQMgAUF+aiIEIQEgAxAnDQALIARBAmohAwsgAxAoDQQLQQBBAToAmAoMBwtBACgCnApBAC8BkgoiAUEDdCIDakEAKAKUCjYCBEEAIAFBAWo7AZIKQQAoApwKIANqQQM2AgALECkMBQtBAC0A8AlBAC8BkApBAC8BkgpyckUhAgwHCxAqQQBBADoAmAoMAwsQK0EAIQIMBQsgA0GgAUcNAQtBAEEBOgCkCgtBAEEAKAKoCjYClAoLQQAoAqgKIQEMAAsLIABBgNAAaiQAIAILGgACQEEAKALQCSAARw0AQQEPCyAAQX5qECwL/goBBn9BAEEAKAKoCiIAQQxqIgE2AqgKQQAoAuwJIQJBARAvIQMCQAJAAkACQAJAAkACQAJAAkBBACgCqAoiBCABRw0AIAMQLkUNAQsCQAJAAkACQAJAAkACQCADQSpGDQAgA0H7AEcNAUEAIARBAmo2AqgKQQEQLyEDQQAoAqgKIQQDQAJAAkAgA0H//wNxIgNBIkYNACADQSdGDQAgAxAyGkEAKAKoCiEDDAELIAMQIEEAQQAoAqgKQQJqIgM2AqgKC0EBEC8aAkAgBCADEDMiA0EsRw0AQQBBACgCqApBAmo2AqgKQQEQLyEDCyADQf0ARg0DQQAoAqgKIgUgBEYNDyAFIQQgBUEAKAKsCk0NAAwPCwtBACAEQQJqNgKoCkEBEC8aQQAoAqgKIgMgAxAzGgwCC0EAQQA6AIgKAkACQAJAAkACQAJAIANBn39qDgwCCwQBCwMLCwsLCwUACyADQfYARg0EDAoLQQAgBEEOaiIDNgKoCgJAAkACQEEBEC9Bn39qDgYAEgISEgESC0EAKAKoCiIFKQACQvOA5IPgjcAxUg0RIAUvAQoQJ0UNEUEAIAVBCmo2AqgKQQAQLxoLQQAoAqgKIgVBAmpBsghBDhA1DRAgBS8BECICQXdqIgFBF0sNDUEBIAF0QZ+AgARxRQ0NDA4LQQAoAqgKIgUpAAJC7ICEg7COwDlSDQ8gBS8BCiICQXdqIgFBF00NBgwKC0EAIARBCmo2AqgKQQAQLxpBACgCqAohBAtBACAEQRBqNgKoCgJAQQEQLyIEQSpHDQBBAEEAKAKoCkECajYCqApBARAvIQQLQQAoAqgKIQMgBBAyGiADQQAoAqgKIgQgAyAEEAJBAEEAKAKoCkF+ajYCqAoPCwJAIAQpAAJC7ICEg7COwDlSDQAgBC8BChAmRQ0AQQAgBEEKajYCqApBARAvIQRBACgCqAohAyAEEDIaIANBACgCqAoiBCADIAQQAkEAQQAoAqgKQX5qNgKoCg8LQQAgBEEEaiIENgKoCgtBACAEQQZqNgKoCkEAQQA6AIgKQQEQLyEEQQAoAqgKIQMgBBAyIQRBACgCqAohAiAEQd//A3EiAUHbAEcNA0EAIAJBAmo2AqgKQQEQLyEFQQAoAqgKIQNBACEEDAQLQQBBAToAgApBAEEAKAKoCkECajYCqAoLQQEQLyEEQQAoAqgKIQMCQCAEQeYARw0AIANBAmpBrAhBBhA1DQBBACADQQhqNgKoCiAAQQEQL0EAEDEgAkEQakHYCSACGyEDA0AgAygCACIDRQ0FIANCADcCCCADQRBqIQMMAAsLQQAgA0F+ajYCqAoMAwtBASABdEGfgIAEcUUNAwwEC0EBIQQLA0ACQAJAIAQOAgABAQsgBUH//wNxEDIaQQEhBAwBCwJAAkBBACgCqAoiBCADRg0AIAMgBCADIAQQAkEBEC8hBAJAIAFB2wBHDQAgBEEgckH9AEYNBAtBACgCqAohAwJAIARBLEcNAEEAIANBAmo2AqgKQQEQLyEFQQAoAqgKIQMgBUEgckH7AEcNAgtBACADQX5qNgKoCgsgAUHbAEcNAkEAIAJBfmo2AqgKDwtBACEEDAALCw8LIAJBoAFGDQAgAkH7AEcNBAtBACAFQQpqNgKoCkEBEC8iBUH7AEYNAwwCCwJAIAJBWGoOAwEDAQALIAJBoAFHDQILQQAgBUEQajYCqAoCQEEBEC8iBUEqRw0AQQBBACgCqApBAmo2AqgKQQEQLyEFCyAFQShGDQELQQAoAqgKIQEgBRAyGkEAKAKoCiIFIAFNDQAgBCADIAEgBRACQQBBACgCqApBfmo2AqgKDwsgBCADQQBBABACQQAgBEEMajYCqAoPCxArC4UMAQp/QQBBACgCqAoiAEEMaiIBNgKoCkEBEC8hAkEAKAKoCiEDAkACQAJAAkACQAJAAkACQCACQS5HDQBBACADQQJqNgKoCgJAQQEQLyICQeQARg0AAkAgAkHzAEYNACACQe0ARw0HQQAoAqgKIgJBAmpBnAhBBhA1DQcCQEEAKAKUCiIDEDANACADLwEAQS5GDQgLIAAgACACQQhqQQAoAsgJEAEPC0EAKAKoCiICQQJqQaIIQQoQNQ0GAkBBACgClAoiAxAwDQAgAy8BAEEuRg0HC0EAIQRBACACQQxqNgKoCkEBIQVBBSEGQQEQLyECQQAhB0EBIQgMAgtBACgCqAoiAikAAkLlgJiD0IyAOVINBQJAQQAoApQKIgMQMA0AIAMvAQBBLkYNBgtBACEEQQAgAkEKajYCqApBAiEIQQchBkEBIQdBARAvIQJBASEFDAELAkACQAJAAkAgAkHzAEcNACADIAFNDQAgA0ECakGiCEEKEDUNAAJAIAMvAQwiBEF3aiIHQRdLDQBBASAHdEGfgIAEcQ0CCyAEQaABRg0BC0EAIQdBByEGQQEhBCACQeQARg0BDAILQQAhBEEAIANBDGoiAjYCqApBASEFQQEQLyEJAkBBACgCqAoiBiACRg0AQeYAIQICQCAJQeYARg0AQQUhBkEAIQdBASEIIAkhAgwEC0EAIQdBASEIIAZBAmpBrAhBBhA1DQQgBi8BCBAmRQ0EC0EAIQdBACADNgKoCkEHIQZBASEEQQAhBUEAIQggCSECDAILIAMgAEEKak0NAEEAIQhB5AAhAgJAIAMpAAJC5YCYg9CMgDlSDQACQAJAIAMvAQoiBEF3aiIHQRdLDQBBASAHdEGfgIAEcQ0BC0EAIQggBEGgAUcNAQtBACEFQQAgA0EKajYCqApBKiECQQEhB0ECIQhBARAvIglBKkYNBEEAIAM2AqgKQQEhBEEAIQdBACEIIAkhAgwCCyADIQZBACEHDAILQQAhBUEAIQgLAkAgAkEoRw0AQQAoApwKQQAvAZIKIgJBA3RqIgNBACgCqAo2AgRBACACQQFqOwGSCiADQQU2AgBBACgClAovAQBBLkYNBEEAQQAoAqgKIgNBAmo2AqgKQQEQLyECIABBACgCqApBACADEAECQAJAIAUNAEEAKALkCSEBDAELQQAoAuQJIgEgBjYCHAtBAEEALwGQCiIDQQFqOwGQCkEAKAKgCiADQQJ0aiABNgIAAkAgAkEiRg0AIAJBJ0YNAEEAQQAoAqgKQX5qNgKoCg8LIAIQIEEAQQAoAqgKQQJqIgI2AqgKAkACQAJAQQEQL0FXag4EAQICAAILQQBBACgCqApBAmo2AqgKQQEQLxpBACgC5AkiAyACNgIEIANBAToAGCADQQAoAqgKIgI2AhBBACACQX5qNgKoCg8LQQAoAuQJIgMgAjYCBCADQQE6ABhBAEEALwGSCkF/ajsBkgogA0EAKAKoCkECajYCDEEAQQAvAZAKQX9qOwGQCg8LQQBBACgCqApBfmo2AqgKDwsCQCAEQQFzIAJB+wBHcg0AQQAoAqgKIQJBAC8BkgoNBQNAAkACQAJAIAJBACgCrApPDQBBARAvIgJBIkYNASACQSdGDQEgAkH9AEcNAkEAQQAoAqgKQQJqNgKoCgtBARAvIQNBACgCqAohAgJAIANB5gBHDQAgAkECakGsCEEGEDUNBwtBACACQQhqNgKoCgJAQQEQLyICQSJGDQAgAkEnRw0HCyAAIAJBABAxDwsgAhAgC0EAQQAoAqgKQQJqIgI2AqgKDAALCwJAAkAgAkFZag4EAwEBAwALIAJBIkYNAgtBACgCqAohBgsgBiABRw0AQQAgAEEKajYCqAoPCyACQSpHIAdxDQNBAC8BkgpB//8DcQ0DQQAoAqgKIQJBACgCrAohAQNAIAIgAU8NAQJAAkAgAi8BACIDQSdGDQAgA0EiRw0BCyAAIAMgCBAxDwtBACACQQJqIgI2AqgKDAALCxArCw8LQQAgAkF+ajYCqAoPC0EAQQAoAqgKQX5qNgKoCgtHAQN/QQAoAqgKQQJqIQBBACgCrAohAQJAA0AgACICQX5qIAFPDQEgAkECaiEAIAIvAQBBdmoOBAEAAAEACwtBACACNgKoCguYAQEDf0EAQQAoAqgKIgFBAmo2AqgKIAFBBmohAUEAKAKsCiECA0ACQAJAAkAgAUF8aiACTw0AIAFBfmovAQAhAwJAAkAgAA0AIANBKkYNASADQXZqDgQCBAQCBAsgA0EqRw0DCyABLwEAQS9HDQJBACABQX5qNgKoCgwBCyABQX5qIQELQQAgATYCqAoPCyABQQJqIQEMAAsLiAEBBH9BACgCqAohAUEAKAKsCiECAkACQANAIAEiA0ECaiEBIAMgAk8NASABLwEAIgQgAEYNAgJAIARB3ABGDQAgBEF2ag4EAgEBAgELIANBBGohASADLwEEQQ1HDQAgA0EGaiABIAMvAQZBCkYbIQEMAAsLQQAgATYCqAoQKw8LQQAgATYCqAoLbAEBfwJAAkAgAEFfaiIBQQVLDQBBASABdEExcQ0BCyAAQUZqQf//A3FBBkkNACAAQSlHIABBWGpB//8DcUEHSXENAAJAIABBpX9qDgQBAAABAAsgAEH9AEcgAEGFf2pB//8DcUEESXEPC0EBCy4BAX9BASEBAkAgAEGcCUEFECMNACAAQZYIQQMQIw0AIABBpglBAhAjIQELIAELRgEDf0EAIQMCQCAAIAJBAXQiAmsiBEECaiIAQQAoAtAJIgVJDQAgACABIAIQNQ0AAkAgACAFRw0AQQEPCyAEECwhAwsgAwuDAQECf0EBIQECQAJAAkACQAJAAkAgAC8BACICQUVqDgQFBAQBAAsCQCACQZt/ag4EAwQEAgALIAJBKUYNBCACQfkARw0DIABBfmpBsglBBhAjDwsgAEF+ai8BAEE9Rg8LIABBfmpBqglBBBAjDwsgAEF+akG+CUEDECMPC0EAIQELIAELtAMBAn9BACEBAkACQAJAAkACQAJAAkACQAJAAkAgAC8BAEGcf2oOFAABAgkJCQkDCQkEBQkJBgkHCQkICQsCQAJAIABBfmovAQBBl39qDgQACgoBCgsgAEF8akHACEECECMPCyAAQXxqQcQIQQMQIw8LAkACQAJAIABBfmovAQBBjX9qDgMAAQIKCwJAIABBfGovAQAiAkHhAEYNACACQewARw0KIABBempB5QAQLQ8LIABBempB4wAQLQ8LIABBfGpByghBBBAjDwsgAEF8akHSCEEGECMPCyAAQX5qLwEAQe8ARw0GIABBfGovAQBB5QBHDQYCQCAAQXpqLwEAIgJB8ABGDQAgAkHjAEcNByAAQXhqQd4IQQYQIw8LIABBeGpB6ghBAhAjDwsgAEF+akHuCEEEECMPC0EBIQEgAEF+aiIAQekAEC0NBCAAQfYIQQUQIw8LIABBfmpB5AAQLQ8LIABBfmpBgAlBBxAjDwsgAEF+akGOCUEEECMPCwJAIABBfmovAQAiAkHvAEYNACACQeUARw0BIABBfGpB7gAQLQ8LIABBfGpBlglBAxAjIQELIAELNAEBf0EBIQECQCAAQXdqQf//A3FBBUkNACAAQYABckGgAUYNACAAQS5HIAAQLnEhAQsgAQswAQF/AkACQCAAQXdqIgFBF0sNAEEBIAF0QY2AgARxDQELIABBoAFGDQBBAA8LQQELTgECf0EAIQECQAJAIAAvAQAiAkHlAEYNACACQesARw0BIABBfmpB7ghBBBAjDwsgAEF+ai8BAEH1AEcNACAAQXxqQdIIQQYQIyEBCyABC94BAQR/QQAoAqgKIQBBACgCrAohAQJAAkACQANAIAAiAkECaiEAIAIgAU8NAQJAAkACQCAALwEAIgNBpH9qDgUCAwMDAQALIANBJEcNAiACLwEEQfsARw0CQQAgAkEEaiIANgKoCkEAQQAvAZIKIgJBAWo7AZIKQQAoApwKIAJBA3RqIgJBBDYCACACIAA2AgQPC0EAIAA2AqgKQQBBAC8BkgpBf2oiADsBkgpBACgCnAogAEH//wNxQQN0aigCAEEDRw0DDAQLIAJBBGohAAwACwtBACAANgKoCgsQKwsLcAECfwJAAkADQEEAQQAoAqgKIgBBAmoiATYCqAogAEEAKAKsCk8NAQJAAkACQCABLwEAIgFBpX9qDgIBAgALAkAgAUF2ag4EBAMDBAALIAFBL0cNAgwECxA0GgwBC0EAIABBBGo2AqgKDAALCxArCws1AQF/QQBBAToA8AlBACgCqAohAEEAQQAoAqwKQQJqNgKoCkEAIABBACgC0AlrQQF1NgKECgtDAQJ/QQEhAQJAIAAvAQAiAkF3akH//wNxQQVJDQAgAkGAAXJBoAFGDQBBACEBIAIQLkUNACACQS5HIAAQMHIPCyABCz0BAn9BACECAkBBACgC0AkiAyAASw0AIAAvAQAgAUcNAAJAIAMgAEcNAEEBDwsgAEF+ai8BABAmIQILIAILaAECf0EBIQECQAJAIABBX2oiAkEFSw0AQQEgAnRBMXENAQsgAEH4/wNxQShGDQAgAEFGakH//wNxQQZJDQACQCAAQaV/aiICQQNLDQAgAkEBRw0BCyAAQYV/akH//wNxQQRJIQELIAELnAEBA39BACgCqAohAQJAA0ACQAJAIAEvAQAiAkEvRw0AAkAgAS8BAiIBQSpGDQAgAUEvRw0EEB4MAgsgABAfDAELAkACQCAARQ0AIAJBd2oiAUEXSw0BQQEgAXRBn4CABHFFDQEMAgsgAhAnRQ0DDAELIAJBoAFHDQILQQBBACgCqAoiA0ECaiIBNgKoCiADQQAoAqwKSQ0ACwsgAgsxAQF/QQAhAQJAIAAvAQBBLkcNACAAQX5qLwEAQS5HDQAgAEF8ai8BAEEuRiEBCyABC9sEAQV/AkAgAUEiRg0AIAFBJ0YNABArDwtBACgCqAohAyABECAgACADQQJqQQAoAqgKQQAoAsQJEAECQCACQQFIDQBBACgC5AlBBEEGIAJBAUYbNgIcC0EAQQAoAqgKQQJqNgKoCkEAEC8hAkEAKAKoCiEBAkACQCACQfcARw0AIAEvAQJB6QBHDQAgAS8BBEH0AEcNACABLwEGQegARg0BC0EAIAFBfmo2AqgKDwtBACABQQhqNgKoCgJAQQEQL0H7AEYNAEEAIAE2AqgKDwtBACgCqAoiBCEDQQAhAANAQQAgA0ECajYCqAoCQAJAAkACQEEBEC8iAkEnRw0AQQAoAqgKIQVBJxAgQQAoAqgKQQJqIQMMAQtBACgCqAohBSACQSJHDQFBIhAgQQAoAqgKQQJqIQMLQQAgAzYCqApBARAvIQIMAQsgAhAyIQJBACgCqAohAwsCQCACQTpGDQBBACABNgKoCg8LQQBBACgCqApBAmo2AqgKAkBBARAvIgJBIkYNACACQSdGDQBBACABNgKoCg8LQQAoAqgKIQYgAhAgQQBBACgC/AkiAkEUajYC/AlBACgCqAohByACIAU2AgAgAkEANgIQIAIgBjYCCCACIAM2AgQgAiAHQQJqNgIMQQBBACgCqApBAmo2AqgKIABBEGpBACgC5AlBIGogABsgAjYCAAJAAkBBARAvIgBBLEYNACAAQf0ARg0BQQAgATYCqAoPC0EAQQAoAqgKQQJqIgM2AqgKIAIhAAwBCwtBACgC5AkiASAENgIQIAFBACgCqApBAmo2AgwLbQECfwJAAkADQAJAIABB//8DcSIBQXdqIgJBF0sNAEEBIAJ0QZ+AgARxDQILIAFBoAFGDQEgACECIAEQLg0CQQAhAkEAQQAoAqgKIgBBAmo2AqgKIAAvAQIiAA0ADAILCyAAIQILIAJB//8DcQurAQEEfwJAAkBBACgCqAoiAi8BACIDQeEARg0AIAEhBCAAIQUMAQtBACACQQRqNgKoCkEBEC8hAkEAKAKoCiEFAkACQCACQSJGDQAgAkEnRg0AIAIQMhpBACgCqAohBAwBCyACECBBAEEAKAKoCkECaiIENgKoCgtBARAvIQNBACgCqAohAgsCQCACIAVGDQAgBSAEQQAgACAAIAFGIgIbQQAgASACGxACCyADC3IBBH9BACgCqAohAEEAKAKsCiEBAkACQANAIABBAmohAiAAIAFPDQECQAJAIAIvAQAiA0Gkf2oOAgEEAAsgAiEAIANBdmoOBAIBAQIBCyAAQQRqIQAMAAsLQQAgAjYCqAoQK0EADwtBACACNgKoCkHdAAtJAQN/QQAhAwJAIAJFDQACQANAIAAtAAAiBCABLQAAIgVHDQEgAUEBaiEBIABBAWohACACQX9qIgINAAwCCwsgBCAFayEDCyADCwviAQIAQYAIC8QBAAB4AHAAbwByAHQAbQBwAG8AcgB0AGYAbwByAGUAdABhAG8AdQByAGMAZQByAG8AbQB1AG4AYwB0AGkAbwBuAHYAbwB5AGkAZQBkAGUAbABlAGMAbwBuAHQAaQBuAGkAbgBzAHQAYQBuAHQAeQBiAHIAZQBhAHIAZQB0AHUAcgBkAGUAYgB1AGcAZwBlAGEAdwBhAGkAdABoAHIAdwBoAGkAbABlAGkAZgBjAGEAdABjAGYAaQBuAGEAbABsAGUAbABzAABBxAkLEAEAAAACAAAAAAQAADA5AAA=","undefined"!=typeof Buffer?Buffer.from(A,"base64"):Uint8Array.from(atob(A),(A=>A.charCodeAt(0)));var A;};WebAssembly.compile(E()).then(WebAssembly.instantiate).then((({exports:A})=>{}));

function hasActionPayload(locals) {
  return "_actionPayload" in locals;
}
function createGetActionResult(locals) {
  return (actionFn) => {
    if (!hasActionPayload(locals) || actionFn.toString() !== getActionQueryString(locals._actionPayload.actionName)) {
      return void 0;
    }
    return deserializeActionResult(locals._actionPayload.actionResult);
  };
}
function createCallAction(context) {
  return (baseAction, input) => {
    Reflect.set(context, ACTION_API_CONTEXT_SYMBOL, true);
    const action = baseAction.bind(context);
    return action(input);
  };
}

function parseLocale(header) {
  if (header === "*") {
    return [{ locale: header, qualityValue: void 0 }];
  }
  const result = [];
  const localeValues = header.split(",").map((str) => str.trim());
  for (const localeValue of localeValues) {
    const split = localeValue.split(";").map((str) => str.trim());
    const localeName = split[0];
    const qualityValue = split[1];
    if (!split) {
      continue;
    }
    if (qualityValue && qualityValue.startsWith("q=")) {
      const qualityValueAsFloat = Number.parseFloat(qualityValue.slice("q=".length));
      if (Number.isNaN(qualityValueAsFloat) || qualityValueAsFloat > 1) {
        result.push({
          locale: localeName,
          qualityValue: void 0
        });
      } else {
        result.push({
          locale: localeName,
          qualityValue: qualityValueAsFloat
        });
      }
    } else {
      result.push({
        locale: localeName,
        qualityValue: void 0
      });
    }
  }
  return result;
}
function sortAndFilterLocales(browserLocaleList, locales) {
  const normalizedLocales = getAllCodes(locales).map(normalizeTheLocale);
  return browserLocaleList.filter((browserLocale) => {
    if (browserLocale.locale !== "*") {
      return normalizedLocales.includes(normalizeTheLocale(browserLocale.locale));
    }
    return true;
  }).sort((a, b) => {
    if (a.qualityValue && b.qualityValue) {
      return Math.sign(b.qualityValue - a.qualityValue);
    }
    return 0;
  });
}
function computePreferredLocale(request, locales) {
  const acceptHeader = request.headers.get("Accept-Language");
  let result = void 0;
  if (acceptHeader) {
    const browserLocaleList = sortAndFilterLocales(parseLocale(acceptHeader), locales);
    const firstResult = browserLocaleList.at(0);
    if (firstResult && firstResult.locale !== "*") {
      for (const currentLocale of locales) {
        if (typeof currentLocale === "string") {
          if (normalizeTheLocale(currentLocale) === normalizeTheLocale(firstResult.locale)) {
            result = currentLocale;
            break;
          }
        } else {
          for (const currentCode of currentLocale.codes) {
            if (normalizeTheLocale(currentCode) === normalizeTheLocale(firstResult.locale)) {
              result = currentCode;
              break;
            }
          }
        }
      }
    }
  }
  return result;
}
function computePreferredLocaleList(request, locales) {
  const acceptHeader = request.headers.get("Accept-Language");
  let result = [];
  if (acceptHeader) {
    const browserLocaleList = sortAndFilterLocales(parseLocale(acceptHeader), locales);
    if (browserLocaleList.length === 1 && browserLocaleList.at(0).locale === "*") {
      return getAllCodes(locales);
    } else if (browserLocaleList.length > 0) {
      for (const browserLocale of browserLocaleList) {
        for (const loopLocale of locales) {
          if (typeof loopLocale === "string") {
            if (normalizeTheLocale(loopLocale) === normalizeTheLocale(browserLocale.locale)) {
              result.push(loopLocale);
            }
          } else {
            for (const code of loopLocale.codes) {
              if (code === browserLocale.locale) {
                result.push(code);
              }
            }
          }
        }
      }
    }
  }
  return result;
}
function computeCurrentLocale(pathname, locales, defaultLocale) {
  for (const segment of pathname.split("/").map(normalizeThePath)) {
    for (const locale of locales) {
      if (typeof locale === "string") {
        if (!segment.includes(locale)) continue;
        if (normalizeTheLocale(locale) === normalizeTheLocale(segment)) {
          return locale;
        }
      } else {
        if (locale.path === segment) {
          return locale.codes.at(0);
        } else {
          for (const code of locale.codes) {
            if (normalizeTheLocale(code) === normalizeTheLocale(segment)) {
              return code;
            }
          }
        }
      }
    }
  }
  for (const locale of locales) {
    if (typeof locale === "string") {
      if (locale === defaultLocale) {
        return locale;
      }
    } else {
      if (locale.path === defaultLocale) {
        return locale.codes.at(0);
      }
    }
  }
}
function computeCurrentLocaleFromParams(params, locales) {
  const byNormalizedCode = /* @__PURE__ */ new Map();
  const byPath = /* @__PURE__ */ new Map();
  for (const locale of locales) {
    if (typeof locale === "string") {
      byNormalizedCode.set(normalizeTheLocale(locale), locale);
    } else {
      byPath.set(locale.path, locale.codes[0]);
      for (const code of locale.codes) {
        byNormalizedCode.set(normalizeTheLocale(code), code);
      }
    }
  }
  for (const value of Object.values(params)) {
    if (!value) continue;
    const pathMatch = byPath.get(value);
    if (pathMatch) return pathMatch;
    const codeMatch = byNormalizedCode.get(normalizeTheLocale(value));
    if (codeMatch) return codeMatch;
  }
}

async function renderEndpoint(mod, context, isPrerendered, logger) {
  const { request, url } = context;
  const method = request.method.toUpperCase();
  let handler = mod[method] ?? mod["ALL"];
  if (!handler && method === "HEAD" && mod["GET"]) {
    handler = mod["GET"];
  }
  if (isPrerendered && !["GET", "HEAD"].includes(method)) {
    logger.warn(
      "router",
      `${url.pathname} ${s.bold(
        method
      )} requests are not available in static endpoints. Mark this page as server-rendered (\`export const prerender = false;\`) or update your config to \`output: 'server'\` to make all your pages server-rendered by default.`
    );
  }
  if (handler === void 0) {
    logger.warn(
      "router",
      `No API Route handler exists for the method "${method}" for the route "${url.pathname}".
Found handlers: ${Object.keys(mod).map((exp) => JSON.stringify(exp)).join(", ")}
` + ("all" in mod ? `One of the exported handlers is "all" (lowercase), did you mean to export 'ALL'?
` : "")
    );
    return new Response(null, { status: 404 });
  }
  if (typeof handler !== "function") {
    logger.error(
      "router",
      `The route "${url.pathname}" exports a value for the method "${method}", but it is of the type ${typeof handler} instead of a function.`
    );
    return new Response(null, { status: 500 });
  }
  let response = await handler.call(mod, context);
  if (!response || response instanceof Response === false) {
    throw new AstroError(EndpointDidNotReturnAResponse);
  }
  if (REROUTABLE_STATUS_CODES.includes(response.status)) {
    try {
      response.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
    } catch (err) {
      if (err.message?.includes("immutable")) {
        response = new Response(response.body, response);
        response.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
      } else {
        throw err;
      }
    }
  }
  if (method === "HEAD") {
    return new Response(null, response);
  }
  return response;
}

/**
 * Copyright (C) 2017-present by Andrea Giammarchi - @WebReflection
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

const {replace} = '';
const ca = /[&<>'"]/g;

const esca = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
};
const pe = m => esca[m];

/**
 * Safely escape HTML entities such as `&`, `<`, `>`, `"`, and `'`.
 * @param {string} es the input to safely escape
 * @returns {string} the escaped input, and it **throws** an error if
 *  the input type is unexpected, except for boolean and numbers,
 *  converted as string.
 */
const escape = es => replace.call(es, ca, pe);

function isPromise(value) {
  return !!value && typeof value === "object" && "then" in value && typeof value.then === "function";
}
async function* streamAsyncIterator(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

const escapeHTML = escape;
class HTMLBytes extends Uint8Array {
}
Object.defineProperty(HTMLBytes.prototype, Symbol.toStringTag, {
  get() {
    return "HTMLBytes";
  }
});
class HTMLString extends String {
  get [Symbol.toStringTag]() {
    return "HTMLString";
  }
}
const markHTMLString = (value) => {
  if (value instanceof HTMLString) {
    return value;
  }
  if (typeof value === "string") {
    return new HTMLString(value);
  }
  return value;
};
function isHTMLString(value) {
  return value instanceof HTMLString;
}
function markHTMLBytes(bytes) {
  return new HTMLBytes(bytes);
}
function hasGetReader(obj) {
  return typeof obj.getReader === "function";
}
async function* unescapeChunksAsync(iterable) {
  if (hasGetReader(iterable)) {
    for await (const chunk of streamAsyncIterator(iterable)) {
      yield unescapeHTML(chunk);
    }
  } else {
    for await (const chunk of iterable) {
      yield unescapeHTML(chunk);
    }
  }
}
function* unescapeChunks(iterable) {
  for (const chunk of iterable) {
    yield unescapeHTML(chunk);
  }
}
function unescapeHTML(str) {
  if (!!str && typeof str === "object") {
    if (str instanceof Uint8Array) {
      return markHTMLBytes(str);
    } else if (str instanceof Response && str.body) {
      const body = str.body;
      return unescapeChunksAsync(body);
    } else if (typeof str.then === "function") {
      return Promise.resolve(str).then((value) => {
        return unescapeHTML(value);
      });
    } else if (str[/* @__PURE__ */ Symbol.for("astro:slot-string")]) {
      return str;
    } else if (Symbol.iterator in str) {
      return unescapeChunks(str);
    } else if (Symbol.asyncIterator in str || hasGetReader(str)) {
      return unescapeChunksAsync(str);
    }
  }
  return markHTMLString(str);
}

const AstroJSX = "astro:jsx";
function isVNode(vnode) {
  return vnode && typeof vnode === "object" && vnode[AstroJSX];
}

function resolvePropagationHint(input) {
  const explicitHint = input.factoryHint ?? "none";
  if (explicitHint !== "none") {
    return explicitHint;
  }
  if (!input.moduleId) {
    return "none";
  }
  return input.metadataLookup(input.moduleId) ?? "none";
}
function isPropagatingHint(hint) {
  return hint === "self" || hint === "in-tree";
}
function getPropagationHint$1(result, factory) {
  return resolvePropagationHint({
    factoryHint: factory.propagation,
    moduleId: factory.moduleId,
    metadataLookup: (moduleId) => result.componentMetadata.get(moduleId)?.propagation
  });
}

function isAstroComponentFactory(obj) {
  return obj == null ? false : obj.isAstroComponentFactory === true;
}
function isAPropagatingComponent(result, factory) {
  return isPropagatingHint(getPropagationHint(result, factory));
}
function getPropagationHint(result, factory) {
  return getPropagationHint$1(result, factory);
}

function r(e){var t,f,n="";if("string"==typeof e||"number"==typeof e)n+=e;else if("object"==typeof e)if(Array.isArray(e)){var o=e.length;for(t=0;t<o;t++)e[t]&&(f=r(e[t]))&&(n&&(n+=" "),n+=f);}else for(f in e)e[f]&&(n&&(n+=" "),n+=f);return n}function clsx(){for(var e,t,f=0,n="",o=arguments.length;f<o;f++)(e=arguments[f])&&(t=r(e))&&(n&&(n+=" "),n+=t);return n}

const PROP_TYPE = {
  Value: 0,
  JSON: 1,
  // Actually means Array
  RegExp: 2,
  Date: 3,
  Map: 4,
  Set: 5,
  BigInt: 6,
  URL: 7,
  Uint8Array: 8,
  Uint16Array: 9,
  Uint32Array: 10,
  Infinity: 11
};
function serializeArray(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = value.map((v) => {
    return convertToSerializedForm(v, metadata, parents);
  });
  parents.delete(value);
  return serialized;
}
function serializeObject(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = Object.fromEntries(
    Object.entries(value).map(([k, v]) => {
      return [k, convertToSerializedForm(v, metadata, parents)];
    })
  );
  parents.delete(value);
  return serialized;
}
function convertToSerializedForm(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  const tag = Object.prototype.toString.call(value);
  switch (tag) {
    case "[object Date]": {
      return [PROP_TYPE.Date, value.toISOString()];
    }
    case "[object RegExp]": {
      return [PROP_TYPE.RegExp, value.source];
    }
    case "[object Map]": {
      return [PROP_TYPE.Map, serializeArray(Array.from(value), metadata, parents)];
    }
    case "[object Set]": {
      return [PROP_TYPE.Set, serializeArray(Array.from(value), metadata, parents)];
    }
    case "[object BigInt]": {
      return [PROP_TYPE.BigInt, value.toString()];
    }
    case "[object URL]": {
      return [PROP_TYPE.URL, value.toString()];
    }
    case "[object Array]": {
      return [PROP_TYPE.JSON, serializeArray(value, metadata, parents)];
    }
    case "[object Uint8Array]": {
      return [PROP_TYPE.Uint8Array, Array.from(value)];
    }
    case "[object Uint16Array]": {
      return [PROP_TYPE.Uint16Array, Array.from(value)];
    }
    case "[object Uint32Array]": {
      return [PROP_TYPE.Uint32Array, Array.from(value)];
    }
    default: {
      if (value !== null && typeof value === "object") {
        return [PROP_TYPE.Value, serializeObject(value, metadata, parents)];
      }
      if (value === Number.POSITIVE_INFINITY) {
        return [PROP_TYPE.Infinity, 1];
      }
      if (value === Number.NEGATIVE_INFINITY) {
        return [PROP_TYPE.Infinity, -1];
      }
      if (value === void 0) {
        return [PROP_TYPE.Value];
      }
      return [PROP_TYPE.Value, value];
    }
  }
}
function serializeProps(props, metadata) {
  const serialized = JSON.stringify(serializeObject(props, metadata));
  return serialized;
}

const transitionDirectivesToCopyOnIsland = Object.freeze([
  "data-astro-transition-scope",
  "data-astro-transition-persist",
  "data-astro-transition-persist-props"
]);
function extractDirectives(inputProps, clientDirectives) {
  let extracted = {
    isPage: false,
    hydration: null,
    props: {},
    propsWithoutTransitionAttributes: {}
  };
  for (const [key, value] of Object.entries(inputProps)) {
    if (key.startsWith("server:")) {
      if (key === "server:root") {
        extracted.isPage = true;
      }
    }
    if (key.startsWith("client:")) {
      if (!extracted.hydration) {
        extracted.hydration = {
          directive: "",
          value: "",
          componentUrl: "",
          componentExport: { value: "" }
        };
      }
      switch (key) {
        case "client:component-path": {
          extracted.hydration.componentUrl = value;
          break;
        }
        case "client:component-export": {
          extracted.hydration.componentExport.value = value;
          break;
        }
        // This is a special prop added to prove that the client hydration method
        // was added statically.
        case "client:component-hydration": {
          break;
        }
        case "client:display-name": {
          break;
        }
        default: {
          extracted.hydration.directive = key.split(":")[1];
          extracted.hydration.value = value;
          if (!clientDirectives.has(extracted.hydration.directive)) {
            const hydrationMethods = Array.from(clientDirectives.keys()).map((d) => `client:${d}`).join(", ");
            throw new Error(
              `Error: invalid hydration directive "${key}". Supported hydration methods: ${hydrationMethods}`
            );
          }
          if (extracted.hydration.directive === "media" && typeof extracted.hydration.value !== "string") {
            throw new AstroError(MissingMediaQueryDirective);
          }
          break;
        }
      }
    } else {
      extracted.props[key] = value;
      if (!transitionDirectivesToCopyOnIsland.includes(key)) {
        extracted.propsWithoutTransitionAttributes[key] = value;
      }
    }
  }
  for (const sym of Object.getOwnPropertySymbols(inputProps)) {
    extracted.props[sym] = inputProps[sym];
    extracted.propsWithoutTransitionAttributes[sym] = inputProps[sym];
  }
  return extracted;
}
async function generateHydrateScript(scriptOptions, metadata) {
  const { renderer, result, astroId, props, attrs } = scriptOptions;
  const { hydrate, componentUrl, componentExport } = metadata;
  if (!componentExport.value) {
    throw new AstroError({
      ...NoMatchingImport,
      message: NoMatchingImport.message(metadata.displayName)
    });
  }
  const island = {
    children: "",
    props: {
      // This is for HMR, probably can avoid it in prod
      uid: astroId
    }
  };
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      island.props[key] = escapeHTML(value);
    }
  }
  island.props["component-url"] = await result.resolve(decodeURI(componentUrl));
  if (renderer.clientEntrypoint) {
    island.props["component-export"] = componentExport.value;
    island.props["renderer-url"] = await result.resolve(
      decodeURI(renderer.clientEntrypoint.toString())
    );
    island.props["props"] = escapeHTML(serializeProps(props, metadata));
  }
  island.props["ssr"] = "";
  island.props["client"] = hydrate;
  let beforeHydrationUrl = await result.resolve("astro:scripts/before-hydration.js");
  if (beforeHydrationUrl.length) {
    island.props["before-hydration-url"] = beforeHydrationUrl;
  }
  island.props["opts"] = escapeHTML(
    JSON.stringify({
      name: metadata.displayName,
      value: metadata.hydrateArgs || ""
    })
  );
  transitionDirectivesToCopyOnIsland.forEach((name) => {
    if (typeof props[name] !== "undefined") {
      island.props[name] = props[name];
    }
  });
  return island;
}

/**
 * shortdash - https://github.com/bibig/node-shorthash
 *
 * @license
 *
 * (The MIT License)
 *
 * Copyright (c) 2013 Bibig <bibig@me.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
const dictionary = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY";
const binary = dictionary.length;
function bitwise(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash;
  }
  return hash;
}
function shorthash(text) {
  let num;
  let result = "";
  let integer = bitwise(text);
  const sign = integer < 0 ? "Z" : "";
  integer = Math.abs(integer);
  while (integer >= binary) {
    num = integer % binary;
    integer = Math.floor(integer / binary);
    result = dictionary[num] + result;
  }
  if (integer > 0) {
    result = dictionary[integer] + result;
  }
  return sign + result;
}

const headAndContentSym = /* @__PURE__ */ Symbol.for("astro.headAndContent");
function isHeadAndContent(obj) {
  return typeof obj === "object" && obj !== null && !!obj[headAndContentSym];
}
function createThinHead() {
  return {
    [headAndContentSym]: true
  };
}

var astro_island_prebuilt_default = `(()=>{var A=Object.defineProperty;var g=(i,o,a)=>o in i?A(i,o,{enumerable:!0,configurable:!0,writable:!0,value:a}):i[o]=a;var d=(i,o,a)=>g(i,typeof o!="symbol"?o+"":o,a);{let i={0:t=>m(t),1:t=>a(t),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(a(t)),5:t=>new Set(a(t)),6:t=>BigInt(t),7:t=>new URL(t),8:t=>new Uint8Array(t),9:t=>new Uint16Array(t),10:t=>new Uint32Array(t),11:t=>Number.POSITIVE_INFINITY*t},o=t=>{let[l,e]=t;return l in i?i[l](e):void 0},a=t=>t.map(o),m=t=>typeof t!="object"||t===null?t:Object.fromEntries(Object.entries(t).map(([l,e])=>[l,o(e)]));class y extends HTMLElement{constructor(){super(...arguments);d(this,"Component");d(this,"hydrator");d(this,"hydrate",async()=>{var b;if(!this.hydrator||!this.isConnected)return;let e=(b=this.parentElement)==null?void 0:b.closest("astro-island[ssr]");if(e){e.addEventListener("astro:hydrate",this.hydrate,{once:!0});return}let c=this.querySelectorAll("astro-slot"),n={},h=this.querySelectorAll("template[data-astro-template]");for(let r of h){let s=r.closest(this.tagName);s!=null&&s.isSameNode(this)&&(n[r.getAttribute("data-astro-template")||"default"]=r.innerHTML,r.remove())}for(let r of c){let s=r.closest(this.tagName);s!=null&&s.isSameNode(this)&&(n[r.getAttribute("name")||"default"]=r.innerHTML)}let p;try{p=this.hasAttribute("props")?m(JSON.parse(this.getAttribute("props"))):{}}catch(r){let s=this.getAttribute("component-url")||"<unknown>",v=this.getAttribute("component-export");throw v&&(s+=\` (export \${v})\`),console.error(\`[hydrate] Error parsing props for component \${s}\`,this.getAttribute("props"),r),r}let u;await this.hydrator(this)(this.Component,p,n,{client:this.getAttribute("client")}),this.removeAttribute("ssr"),this.dispatchEvent(new CustomEvent("astro:hydrate"))});d(this,"unmount",()=>{this.isConnected||this.dispatchEvent(new CustomEvent("astro:unmount"))})}disconnectedCallback(){document.removeEventListener("astro:after-swap",this.unmount),document.addEventListener("astro:after-swap",this.unmount,{once:!0})}connectedCallback(){if(!this.hasAttribute("await-children")||document.readyState==="interactive"||document.readyState==="complete")this.childrenConnectedCallback();else{let e=()=>{document.removeEventListener("DOMContentLoaded",e),c.disconnect(),this.childrenConnectedCallback()},c=new MutationObserver(()=>{var n;((n=this.lastChild)==null?void 0:n.nodeType)===Node.COMMENT_NODE&&this.lastChild.nodeValue==="astro:end"&&(this.lastChild.remove(),e())});c.observe(this,{childList:!0}),document.addEventListener("DOMContentLoaded",e)}}async childrenConnectedCallback(){let e=this.getAttribute("before-hydration-url");e&&await import(e),this.start()}async start(){let e=JSON.parse(this.getAttribute("opts")),c=this.getAttribute("client");if(Astro[c]===void 0){window.addEventListener(\`astro:\${c}\`,()=>this.start(),{once:!0});return}try{await Astro[c](async()=>{let n=this.getAttribute("renderer-url"),[h,{default:p}]=await Promise.all([import(this.getAttribute("component-url")),n?import(n):()=>()=>{}]),u=this.getAttribute("component-export")||"default";if(!u.includes("."))this.Component=h[u];else{this.Component=h;for(let f of u.split("."))this.Component=this.Component[f]}return this.hydrator=p,this.hydrate},e,this)}catch(n){console.error(\`[astro-island] Error hydrating \${this.getAttribute("component-url")}\`,n)}}attributeChangedCallback(){this.hydrate()}}d(y,"observedAttributes",["props"]),customElements.get("astro-island")||customElements.define("astro-island",y)}})();`;

var astro_island_prebuilt_dev_default = `(()=>{var A=Object.defineProperty;var g=(i,o,a)=>o in i?A(i,o,{enumerable:!0,configurable:!0,writable:!0,value:a}):i[o]=a;var l=(i,o,a)=>g(i,typeof o!="symbol"?o+"":o,a);{let i={0:t=>y(t),1:t=>a(t),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(a(t)),5:t=>new Set(a(t)),6:t=>BigInt(t),7:t=>new URL(t),8:t=>new Uint8Array(t),9:t=>new Uint16Array(t),10:t=>new Uint32Array(t),11:t=>Number.POSITIVE_INFINITY*t},o=t=>{let[h,e]=t;return h in i?i[h](e):void 0},a=t=>t.map(o),y=t=>typeof t!="object"||t===null?t:Object.fromEntries(Object.entries(t).map(([h,e])=>[h,o(e)]));class f extends HTMLElement{constructor(){super(...arguments);l(this,"Component");l(this,"hydrator");l(this,"hydrate",async()=>{var b;if(!this.hydrator||!this.isConnected)return;let e=(b=this.parentElement)==null?void 0:b.closest("astro-island[ssr]");if(e){e.addEventListener("astro:hydrate",this.hydrate,{once:!0});return}let c=this.querySelectorAll("astro-slot"),n={},p=this.querySelectorAll("template[data-astro-template]");for(let r of p){let s=r.closest(this.tagName);s!=null&&s.isSameNode(this)&&(n[r.getAttribute("data-astro-template")||"default"]=r.innerHTML,r.remove())}for(let r of c){let s=r.closest(this.tagName);s!=null&&s.isSameNode(this)&&(n[r.getAttribute("name")||"default"]=r.innerHTML)}let u;try{u=this.hasAttribute("props")?y(JSON.parse(this.getAttribute("props"))):{}}catch(r){let s=this.getAttribute("component-url")||"<unknown>",v=this.getAttribute("component-export");throw v&&(s+=\` (export \${v})\`),console.error(\`[hydrate] Error parsing props for component \${s}\`,this.getAttribute("props"),r),r}let d,m=this.hydrator(this);d=performance.now(),await m(this.Component,u,n,{client:this.getAttribute("client")}),d&&this.setAttribute("client-render-time",(performance.now()-d).toString()),this.removeAttribute("ssr"),this.dispatchEvent(new CustomEvent("astro:hydrate"))});l(this,"unmount",()=>{this.isConnected||this.dispatchEvent(new CustomEvent("astro:unmount"))})}disconnectedCallback(){document.removeEventListener("astro:after-swap",this.unmount),document.addEventListener("astro:after-swap",this.unmount,{once:!0})}connectedCallback(){if(!this.hasAttribute("await-children")||document.readyState==="interactive"||document.readyState==="complete")this.childrenConnectedCallback();else{let e=()=>{document.removeEventListener("DOMContentLoaded",e),c.disconnect(),this.childrenConnectedCallback()},c=new MutationObserver(()=>{var n;((n=this.lastChild)==null?void 0:n.nodeType)===Node.COMMENT_NODE&&this.lastChild.nodeValue==="astro:end"&&(this.lastChild.remove(),e())});c.observe(this,{childList:!0}),document.addEventListener("DOMContentLoaded",e)}}async childrenConnectedCallback(){let e=this.getAttribute("before-hydration-url");e&&await import(e),this.start()}async start(){let e=JSON.parse(this.getAttribute("opts")),c=this.getAttribute("client");if(Astro[c]===void 0){window.addEventListener(\`astro:\${c}\`,()=>this.start(),{once:!0});return}try{await Astro[c](async()=>{let n=this.getAttribute("renderer-url"),[p,{default:u}]=await Promise.all([import(this.getAttribute("component-url")),n?import(n):()=>()=>{}]),d=this.getAttribute("component-export")||"default";if(!d.includes("."))this.Component=p[d];else{this.Component=p;for(let m of d.split("."))this.Component=this.Component[m]}return this.hydrator=u,this.hydrate},e,this)}catch(n){console.error(\`[astro-island] Error hydrating \${this.getAttribute("component-url")}\`,n)}}attributeChangedCallback(){this.hydrate()}}l(f,"observedAttributes",["props"]),customElements.get("astro-island")||customElements.define("astro-island",f)}})();`;

const ISLAND_STYLES = "astro-island,astro-slot,astro-static-slot{display:contents}";

function determineIfNeedsHydrationScript(result) {
  if (result._metadata.hasHydrationScript) {
    return false;
  }
  return result._metadata.hasHydrationScript = true;
}
function determinesIfNeedsDirectiveScript(result, directive) {
  if (result._metadata.hasDirectives.has(directive)) {
    return false;
  }
  result._metadata.hasDirectives.add(directive);
  return true;
}
function getDirectiveScriptText(result, directive) {
  const clientDirectives = result.clientDirectives;
  const clientDirective = clientDirectives.get(directive);
  if (!clientDirective) {
    throw new Error(`Unknown directive: ${directive}`);
  }
  return clientDirective;
}
function getPrescripts(result, type, directive) {
  switch (type) {
    case "both":
      return `<style>${ISLAND_STYLES}</style><script>${getDirectiveScriptText(result, directive)}</script><script>${process.env.NODE_ENV === "development" ? astro_island_prebuilt_dev_default : astro_island_prebuilt_default}</script>`;
    case "directive":
      return `<script>${getDirectiveScriptText(result, directive)}</script>`;
  }
}

async function collectPropagatedHeadParts(input) {
  const collectedHeadParts = [];
  const iterator = input.propagators.values();
  while (true) {
    const { value, done } = iterator.next();
    if (done) {
      break;
    }
    const returnValue = await value.init(input.result);
    if (input.isHeadAndContent(returnValue) && returnValue.head) {
      collectedHeadParts.push(returnValue.head);
    }
  }
  return collectedHeadParts;
}

function shouldRenderHeadInstruction(state) {
  return !state.hasRenderedHead && !state.partial;
}
function shouldRenderMaybeHeadInstruction(state) {
  return !state.hasRenderedHead && !state.headInTree && !state.partial;
}
function shouldRenderInstruction$1(type, state) {
  return type === "head" ? shouldRenderHeadInstruction(state) : shouldRenderMaybeHeadInstruction(state);
}

function registerIfPropagating(result, factory, instance) {
  if (factory.propagation === "self" || factory.propagation === "in-tree") {
    result._metadata.propagators.add(
      instance
    );
    return;
  }
  if (factory.moduleId) {
    const hint = result.componentMetadata.get(factory.moduleId)?.propagation;
    if (isPropagatingHint(hint ?? "none")) {
      result._metadata.propagators.add(
        instance
      );
    }
  }
}
async function bufferPropagatedHead(result) {
  const collected = await collectPropagatedHeadParts({
    propagators: result._metadata.propagators,
    result,
    isHeadAndContent
  });
  result._metadata.extraHead.push(...collected);
}
function shouldRenderInstruction(type, state) {
  return shouldRenderInstruction$1(type, state);
}
function getInstructionRenderState(result) {
  return {
    hasRenderedHead: result._metadata.hasRenderedHead,
    headInTree: result._metadata.headInTree,
    partial: result.partial
  };
}

function renderCspContent(result) {
  const finalScriptHashes = /* @__PURE__ */ new Set();
  const finalStyleHashes = /* @__PURE__ */ new Set();
  for (const scriptHash of result.scriptHashes) {
    finalScriptHashes.add(`'${scriptHash}'`);
  }
  for (const styleHash of result.styleHashes) {
    finalStyleHashes.add(`'${styleHash}'`);
  }
  for (const styleHash of result._metadata.extraStyleHashes) {
    finalStyleHashes.add(`'${styleHash}'`);
  }
  for (const scriptHash of result._metadata.extraScriptHashes) {
    finalScriptHashes.add(`'${scriptHash}'`);
  }
  let directives;
  if (result.directives.length > 0) {
    directives = result.directives.join(";") + ";";
  }
  let scriptResources = "'self'";
  if (result.scriptResources.length > 0) {
    scriptResources = result.scriptResources.map((r) => `${r}`).join(" ");
  }
  let styleResources = "'self'";
  if (result.styleResources.length > 0) {
    styleResources = result.styleResources.map((r) => `${r}`).join(" ");
  }
  const strictDynamic = result.isStrictDynamic ? ` 'strict-dynamic'` : "";
  const scriptSrc = `script-src ${scriptResources} ${Array.from(finalScriptHashes).join(" ")}${strictDynamic};`;
  const styleSrc = `style-src ${styleResources} ${Array.from(finalStyleHashes).join(" ")};`;
  return [directives, scriptSrc, styleSrc].filter(Boolean).join(" ");
}

const RenderInstructionSymbol = /* @__PURE__ */ Symbol.for("astro:render");
function createRenderInstruction(instruction) {
  return Object.defineProperty(instruction, RenderInstructionSymbol, {
    value: true
  });
}
function isRenderInstruction(chunk) {
  return chunk && typeof chunk === "object" && chunk[RenderInstructionSymbol];
}

const voidElementNames = /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
const htmlBooleanAttributes = /^(?:allowfullscreen|async|autofocus|autoplay|checked|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|inert|loop|muted|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|selected|itemscope)$/i;
const AMPERSAND_REGEX = /&/g;
const DOUBLE_QUOTE_REGEX = /"/g;
const STATIC_DIRECTIVES = /* @__PURE__ */ new Set(["set:html", "set:text"]);
const toIdent = (k) => k.trim().replace(/(?!^)\b\w|\s+|\W+/g, (match, index) => {
  if (/\W/.test(match)) return "";
  return index === 0 ? match : match.toUpperCase();
});
const toAttributeString = (value, shouldEscape = true) => shouldEscape ? String(value).replace(AMPERSAND_REGEX, "&#38;").replace(DOUBLE_QUOTE_REGEX, "&#34;") : value;
const kebab = (k) => k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const toStyleString = (obj) => Object.entries(obj).filter(([_, v]) => typeof v === "string" && v.trim() || typeof v === "number").map(([k, v]) => {
  if (k[0] !== "-" && k[1] !== "-") return `${kebab(k)}:${v}`;
  return `${k}:${v}`;
}).join(";");
function defineScriptVars(vars) {
  let output = "";
  for (const [key, value] of Object.entries(vars)) {
    output += `const ${toIdent(key)} = ${JSON.stringify(value)?.replace(
      /<\/script>/g,
      "\\x3C/script>"
    )};
`;
  }
  return markHTMLString(output);
}
function formatList(values) {
  if (values.length === 1) {
    return values[0];
  }
  return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
}
function isCustomElement(tagName) {
  return tagName.includes("-");
}
function handleBooleanAttribute(key, value, shouldEscape, tagName) {
  if (tagName && isCustomElement(tagName)) {
    return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
  }
  return markHTMLString(value ? ` ${key}` : "");
}
function addAttribute(value, key, shouldEscape = true, tagName = "") {
  if (value == null) {
    return "";
  }
  if (STATIC_DIRECTIVES.has(key)) {
    console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
    return "";
  }
  if (key === "class:list") {
    const listValue = toAttributeString(clsx(value), shouldEscape);
    if (listValue === "") {
      return "";
    }
    return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`);
  }
  if (key === "style" && !(value instanceof HTMLString)) {
    if (Array.isArray(value) && value.length === 2) {
      return markHTMLString(
        ` ${key}="${toAttributeString(`${toStyleString(value[0])};${value[1]}`, shouldEscape)}"`
      );
    }
    if (typeof value === "object") {
      return markHTMLString(` ${key}="${toAttributeString(toStyleString(value), shouldEscape)}"`);
    }
  }
  if (key === "className") {
    return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`);
  }
  if (htmlBooleanAttributes.test(key)) {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  if (value === "") {
    return markHTMLString(` ${key}`);
  }
  if (key === "popover" && typeof value === "boolean") {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  if (key === "download" && typeof value === "boolean") {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  if (key === "hidden" && typeof value === "boolean") {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
}
function internalSpreadAttributes(values, shouldEscape = true, tagName) {
  let output = "";
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, shouldEscape, tagName);
  }
  return markHTMLString(output);
}
function renderElement$1(name, { props: _props, children = "" }, shouldEscape = true) {
  const { lang: _, "data-astro-id": astroId, "define:vars": defineVars, ...props } = _props;
  if (defineVars) {
    if (name === "style") {
      delete props["is:global"];
      delete props["is:scoped"];
    }
    if (name === "script") {
      delete props.hoist;
      children = defineScriptVars(defineVars) + "\n" + children;
    }
  }
  if ((children == null || children === "") && voidElementNames.test(name)) {
    return `<${name}${internalSpreadAttributes(props, shouldEscape, name)}>`;
  }
  return `<${name}${internalSpreadAttributes(props, shouldEscape, name)}>${children}</${name}>`;
}
const noop = () => {
};
class BufferedRenderer {
  chunks = [];
  renderPromise;
  destination;
  /**
   * Determines whether buffer has been flushed
   * to the final destination.
   */
  flushed = false;
  constructor(destination, renderFunction) {
    this.destination = destination;
    this.renderPromise = renderFunction(this);
    if (isPromise(this.renderPromise)) {
      Promise.resolve(this.renderPromise).catch(noop);
    }
  }
  write(chunk) {
    if (this.flushed) {
      this.destination.write(chunk);
    } else {
      this.chunks.push(chunk);
    }
  }
  flush() {
    if (this.flushed) {
      throw new Error("The render buffer has already been flushed.");
    }
    this.flushed = true;
    for (const chunk of this.chunks) {
      this.destination.write(chunk);
    }
    return this.renderPromise;
  }
}
function createBufferedRenderer(destination, renderFunction) {
  return new BufferedRenderer(destination, renderFunction);
}
const isNode = typeof process !== "undefined" && Object.prototype.toString.call(process) === "[object process]";
const isDeno = typeof Deno !== "undefined";
function promiseWithResolvers() {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject
  };
}

function stablePropsKey(props) {
  const keys = Object.keys(props).sort();
  let result = "{";
  for (let i = 0; i < keys.length; i++) {
    if (i > 0) result += ",";
    result += JSON.stringify(keys[i]) + ":" + JSON.stringify(props[keys[i]]);
  }
  result += "}";
  return result;
}
function deduplicateElements(elements) {
  if (elements.length <= 1) return elements;
  const seen = /* @__PURE__ */ new Set();
  return elements.filter((item) => {
    const key = stablePropsKey(item.props) + item.children;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function renderAllHeadContent(result) {
  result._metadata.hasRenderedHead = true;
  let content = "";
  if (result.shouldInjectCspMetaTags && result.cspDestination === "meta") {
    content += renderElement$1(
      "meta",
      {
        props: {
          "http-equiv": "content-security-policy",
          content: renderCspContent(result)
        },
        children: ""
      },
      false
    );
  }
  const styles = deduplicateElements(Array.from(result.styles)).map(
    (style) => style.props.rel === "stylesheet" ? renderElement$1("link", style) : renderElement$1("style", style)
  );
  result.styles.clear();
  const scripts = deduplicateElements(Array.from(result.scripts)).map((script) => {
    if (result.userAssetsBase) {
      script.props.src = (result.base === "/" ? "" : result.base) + result.userAssetsBase + script.props.src;
    }
    return renderElement$1("script", script, false);
  });
  const links = deduplicateElements(Array.from(result.links)).map(
    (link) => renderElement$1("link", link, false)
  );
  content += styles.join("\n") + links.join("\n") + scripts.join("\n");
  if (result._metadata.extraHead.length > 0) {
    for (const part of result._metadata.extraHead) {
      content += part;
    }
  }
  return markHTMLString(content);
}
function maybeRenderHead() {
  return createRenderInstruction({ type: "maybe-head" });
}

function encodeHexUpperCase(data) {
    let result = "";
    for (let i = 0; i < data.length; i++) {
        result += alphabetUpperCase[data[i] >> 4];
        result += alphabetUpperCase[data[i] & 0x0f];
    }
    return result;
}
function decodeHex(data) {
    if (data.length % 2 !== 0) {
        throw new Error("Invalid hex string");
    }
    const result = new Uint8Array(data.length / 2);
    for (let i = 0; i < data.length; i += 2) {
        if (!(data[i] in decodeMap)) {
            throw new Error("Invalid character");
        }
        if (!(data[i + 1] in decodeMap)) {
            throw new Error("Invalid character");
        }
        result[i / 2] |= decodeMap[data[i]] << 4;
        result[i / 2] |= decodeMap[data[i + 1]];
    }
    return result;
}
const alphabetUpperCase = "0123456789ABCDEF";
const decodeMap = {
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    a: 10,
    A: 10,
    b: 11,
    B: 11,
    c: 12,
    C: 12,
    d: 13,
    D: 13,
    e: 14,
    E: 14,
    f: 15,
    F: 15
};

var EncodingPadding$1;
(function (EncodingPadding) {
    EncodingPadding[EncodingPadding["Include"] = 0] = "Include";
    EncodingPadding[EncodingPadding["None"] = 1] = "None";
})(EncodingPadding$1 || (EncodingPadding$1 = {}));
var DecodingPadding$1;
(function (DecodingPadding) {
    DecodingPadding[DecodingPadding["Required"] = 0] = "Required";
    DecodingPadding[DecodingPadding["Ignore"] = 1] = "Ignore";
})(DecodingPadding$1 || (DecodingPadding$1 = {}));

function encodeBase64(bytes) {
    return encodeBase64_internal(bytes, base64Alphabet, EncodingPadding.Include);
}
function encodeBase64_internal(bytes, alphabet, padding) {
    let result = "";
    for (let i = 0; i < bytes.byteLength; i += 3) {
        let buffer = 0;
        let bufferBitSize = 0;
        for (let j = 0; j < 3 && i + j < bytes.byteLength; j++) {
            buffer = (buffer << 8) | bytes[i + j];
            bufferBitSize += 8;
        }
        for (let j = 0; j < 4; j++) {
            if (bufferBitSize >= 6) {
                result += alphabet[(buffer >> (bufferBitSize - 6)) & 0x3f];
                bufferBitSize -= 6;
            }
            else if (bufferBitSize > 0) {
                result += alphabet[(buffer << (6 - bufferBitSize)) & 0x3f];
                bufferBitSize = 0;
            }
            else if (padding === EncodingPadding.Include) {
                result += "=";
            }
        }
    }
    return result;
}
const base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function decodeBase64(encoded) {
    return decodeBase64_internal(encoded, base64DecodeMap, DecodingPadding.Required);
}
function decodeBase64_internal(encoded, decodeMap, padding) {
    const result = new Uint8Array(Math.ceil(encoded.length / 4) * 3);
    let totalBytes = 0;
    for (let i = 0; i < encoded.length; i += 4) {
        let chunk = 0;
        let bitsRead = 0;
        for (let j = 0; j < 4; j++) {
            if (padding === DecodingPadding.Required && encoded[i + j] === "=") {
                continue;
            }
            if (padding === DecodingPadding.Ignore &&
                (i + j >= encoded.length || encoded[i + j] === "=")) {
                continue;
            }
            if (j > 0 && encoded[i + j - 1] === "=") {
                throw new Error("Invalid padding");
            }
            if (!(encoded[i + j] in decodeMap)) {
                throw new Error("Invalid character");
            }
            chunk |= decodeMap[encoded[i + j]] << ((3 - j) * 6);
            bitsRead += 6;
        }
        if (bitsRead < 24) {
            let unused;
            if (bitsRead === 12) {
                unused = chunk & 0xffff;
            }
            else if (bitsRead === 18) {
                unused = chunk & 0xff;
            }
            else {
                throw new Error("Invalid padding");
            }
            if (unused !== 0) {
                throw new Error("Invalid padding");
            }
        }
        const byteLength = Math.floor(bitsRead / 8);
        for (let i = 0; i < byteLength; i++) {
            result[totalBytes] = (chunk >> (16 - i * 8)) & 0xff;
            totalBytes++;
        }
    }
    return result.slice(0, totalBytes);
}
var EncodingPadding;
(function (EncodingPadding) {
    EncodingPadding[EncodingPadding["Include"] = 0] = "Include";
    EncodingPadding[EncodingPadding["None"] = 1] = "None";
})(EncodingPadding || (EncodingPadding = {}));
var DecodingPadding;
(function (DecodingPadding) {
    DecodingPadding[DecodingPadding["Required"] = 0] = "Required";
    DecodingPadding[DecodingPadding["Ignore"] = 1] = "Ignore";
})(DecodingPadding || (DecodingPadding = {}));
const base64DecodeMap = {
    "0": 52,
    "1": 53,
    "2": 54,
    "3": 55,
    "4": 56,
    "5": 57,
    "6": 58,
    "7": 59,
    "8": 60,
    "9": 61,
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    E: 4,
    F: 5,
    G: 6,
    H: 7,
    I: 8,
    J: 9,
    K: 10,
    L: 11,
    M: 12,
    N: 13,
    O: 14,
    P: 15,
    Q: 16,
    R: 17,
    S: 18,
    T: 19,
    U: 20,
    V: 21,
    W: 22,
    X: 23,
    Y: 24,
    Z: 25,
    a: 26,
    b: 27,
    c: 28,
    d: 29,
    e: 30,
    f: 31,
    g: 32,
    h: 33,
    i: 34,
    j: 35,
    k: 36,
    l: 37,
    m: 38,
    n: 39,
    o: 40,
    p: 41,
    q: 42,
    r: 43,
    s: 44,
    t: 45,
    u: 46,
    v: 47,
    w: 48,
    x: 49,
    y: 50,
    z: 51,
    "+": 62,
    "/": 63
};

const initializer = (inst, issues) => {
    $ZodError.init(inst, issues);
    inst.name = "ZodError";
    Object.defineProperties(inst, {
        format: {
            value: (mapper) => formatError(inst, mapper),
            // enumerable: false,
        },
        flatten: {
            value: (mapper) => flattenError(inst, mapper),
            // enumerable: false,
        },
        addIssue: {
            value: (issue) => {
                inst.issues.push(issue);
                inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
            },
            // enumerable: false,
        },
        addIssues: {
            value: (issues) => {
                inst.issues.push(...issues);
                inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
            },
            // enumerable: false,
        },
        isEmpty: {
            get() {
                return inst.issues.length === 0;
            },
            // enumerable: false,
        },
    });
    // Object.defineProperty(inst, "isEmpty", {
    //   get() {
    //     return inst.issues.length === 0;
    //   },
    // });
};
const ZodRealError = $constructor("ZodError", initializer, {
    Parent: Error,
});
// /** @deprecated Use `z.core.$ZodErrorMapCtx` instead. */
// export type ErrorMapCtx = core.$ZodErrorMapCtx;

const parse = /* @__PURE__ */ _parse(ZodRealError);
const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
// Codec functions
const encode = /* @__PURE__ */ _encode(ZodRealError);
const decode = /* @__PURE__ */ _decode(ZodRealError);
const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

const ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
    $ZodType.init(inst, def);
    Object.assign(inst["~standard"], {
        jsonSchema: {
            input: createStandardJSONSchemaMethod(inst, "input"),
            output: createStandardJSONSchemaMethod(inst, "output"),
        },
    });
    inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
    inst.def = def;
    inst.type = def.type;
    Object.defineProperty(inst, "_def", { value: def });
    // base methods
    inst.check = (...checks) => {
        return inst.clone(mergeDefs(def, {
            checks: [
                ...(def.checks ?? []),
                ...checks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch),
            ],
        }), {
            parent: true,
        });
    };
    inst.with = inst.check;
    inst.clone = (def, params) => clone(inst, def, params);
    inst.brand = () => inst;
    inst.register = ((reg, meta) => {
        reg.add(inst, meta);
        return inst;
    });
    // parsing
    inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
    inst.safeParse = (data, params) => safeParse(inst, data, params);
    inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
    inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
    inst.spa = inst.safeParseAsync;
    // encoding/decoding
    inst.encode = (data, params) => encode(inst, data, params);
    inst.decode = (data, params) => decode(inst, data, params);
    inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
    inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
    inst.safeEncode = (data, params) => safeEncode(inst, data, params);
    inst.safeDecode = (data, params) => safeDecode(inst, data, params);
    inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
    inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
    // refinements
    inst.refine = (check, params) => inst.check(refine(check, params));
    inst.superRefine = (refinement) => inst.check(superRefine(refinement));
    inst.overwrite = (fn) => inst.check(_overwrite(fn));
    // wrappers
    inst.optional = () => optional(inst);
    inst.exactOptional = () => exactOptional(inst);
    inst.nullable = () => nullable(inst);
    inst.nullish = () => optional(nullable(inst));
    inst.nonoptional = (params) => nonoptional(inst, params);
    inst.array = () => array(inst);
    inst.or = (arg) => union([inst, arg]);
    inst.and = (arg) => intersection(inst, arg);
    inst.transform = (tx) => pipe(inst, transform(tx));
    inst.default = (def) => _default(inst, def);
    inst.prefault = (def) => prefault(inst, def);
    // inst.coalesce = (def, params) => coalesce(inst, def, params);
    inst.catch = (params) => _catch(inst, params);
    inst.pipe = (target) => pipe(inst, target);
    inst.readonly = () => readonly(inst);
    // meta
    inst.describe = (description) => {
        const cl = inst.clone();
        globalRegistry.add(cl, { description });
        return cl;
    };
    Object.defineProperty(inst, "description", {
        get() {
            return globalRegistry.get(inst)?.description;
        },
        configurable: true,
    });
    inst.meta = (...args) => {
        if (args.length === 0) {
            return globalRegistry.get(inst);
        }
        const cl = inst.clone();
        globalRegistry.add(cl, args[0]);
        return cl;
    };
    // helpers
    inst.isOptional = () => inst.safeParse(undefined).success;
    inst.isNullable = () => inst.safeParse(null).success;
    inst.apply = (fn) => fn(inst);
    return inst;
});
const ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
    $ZodArray.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
    inst.element = def.element;
    inst.min = (minLength, params) => inst.check(_minLength(minLength, params));
    inst.nonempty = (params) => inst.check(_minLength(1, params));
    inst.max = (maxLength, params) => inst.check(_maxLength(maxLength, params));
    inst.length = (len, params) => inst.check(_length(len, params));
    inst.unwrap = () => inst.element;
});
function array(element, params) {
    return _array(ZodArray, element, params);
}
const ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
    $ZodUnion.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
    inst.options = def.options;
});
function union(options, params) {
    return new ZodUnion({
        type: "union",
        options: options,
        ...normalizeParams(params),
    });
}
const ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
    $ZodIntersection.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
    return new ZodIntersection({
        type: "intersection",
        left: left,
        right: right,
    });
}
const ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
    $ZodEnum.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json);
    inst.enum = def.entries;
    inst.options = Object.values(def.entries);
    const keys = new Set(Object.keys(def.entries));
    inst.extract = (values, params) => {
        const newEntries = {};
        for (const value of values) {
            if (keys.has(value)) {
                newEntries[value] = def.entries[value];
            }
            else
                throw new Error(`Key ${value} not found in enum`);
        }
        return new ZodEnum({
            ...def,
            checks: [],
            ...normalizeParams(params),
            entries: newEntries,
        });
    };
    inst.exclude = (values, params) => {
        const newEntries = { ...def.entries };
        for (const value of values) {
            if (keys.has(value)) {
                delete newEntries[value];
            }
            else
                throw new Error(`Key ${value} not found in enum`);
        }
        return new ZodEnum({
            ...def,
            checks: [],
            ...normalizeParams(params),
            entries: newEntries,
        });
    };
});
function _enum(values, params) {
    const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
    return new ZodEnum({
        type: "enum",
        entries,
        ...normalizeParams(params),
    });
}
const ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
    $ZodTransform.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx);
    inst._zod.parse = (payload, _ctx) => {
        if (_ctx.direction === "backward") {
            throw new $ZodEncodeError(inst.constructor.name);
        }
        payload.addIssue = (issue$1) => {
            if (typeof issue$1 === "string") {
                payload.issues.push(issue(issue$1, payload.value, def));
            }
            else {
                // for Zod 3 backwards compatibility
                const _issue = issue$1;
                if (_issue.fatal)
                    _issue.continue = false;
                _issue.code ?? (_issue.code = "custom");
                _issue.input ?? (_issue.input = payload.value);
                _issue.inst ?? (_issue.inst = inst);
                // _issue.continue ??= true;
                payload.issues.push(issue(_issue));
            }
        };
        const output = def.transform(payload.value, payload);
        if (output instanceof Promise) {
            return output.then((output) => {
                payload.value = output;
                return payload;
            });
        }
        payload.value = output;
        return payload;
    };
});
function transform(fn) {
    return new ZodTransform({
        type: "transform",
        transform: fn,
    });
}
const ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
    $ZodOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
    return new ZodOptional({
        type: "optional",
        innerType: innerType,
    });
}
const ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
    $ZodExactOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
    return new ZodExactOptional({
        type: "optional",
        innerType: innerType,
    });
}
const ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
    $ZodNullable.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
    return new ZodNullable({
        type: "nullable",
        innerType: innerType,
    });
}
const ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
    $ZodDefault.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
    inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
    return new ZodDefault({
        type: "default",
        innerType: innerType,
        get defaultValue() {
            return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
        },
    });
}
const ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
    $ZodPrefault.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
    return new ZodPrefault({
        type: "prefault",
        innerType: innerType,
        get defaultValue() {
            return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
        },
    });
}
const ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
    $ZodNonOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
    return new ZodNonOptional({
        type: "nonoptional",
        innerType: innerType,
        ...normalizeParams(params),
    });
}
const ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
    $ZodCatch.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
    inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
    return new ZodCatch({
        type: "catch",
        innerType: innerType,
        catchValue: (typeof catchValue === "function" ? catchValue : () => catchValue),
    });
}
const ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
    $ZodPipe.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
    inst.in = def.in;
    inst.out = def.out;
});
function pipe(in_, out) {
    return new ZodPipe({
        type: "pipe",
        in: in_,
        out: out,
        // ...util.normalizeParams(params),
    });
}
const ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
    $ZodReadonly.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
    return new ZodReadonly({
        type: "readonly",
        innerType: innerType,
    });
}
const ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
    $ZodCustom.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx);
});
function refine(fn, _params = {}) {
    return _refine(ZodCustom, fn, _params);
}
// superRefine
function superRefine(fn) {
    return _superRefine(fn);
}

const ALGORITHMS = {
  "SHA-256": "sha256-",
  "SHA-384": "sha384-",
  "SHA-512": "sha512-"
};
_enum(Object.keys(ALGORITHMS)).optional().default("SHA-256");

const ALGORITHM = "AES-GCM";
async function decodeKey(encoded) {
  const bytes = decodeBase64(encoded);
  return crypto.subtle.importKey("raw", bytes.buffer, ALGORITHM, true, [
    "encrypt",
    "decrypt"
  ]);
}
const encoder$1 = new TextEncoder();
const decoder$1 = new TextDecoder();
const IV_LENGTH = 24;
async function encryptString(key, raw) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH / 2));
  const data = encoder$1.encode(raw);
  const buffer = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv
    },
    key,
    data
  );
  return encodeHexUpperCase(iv) + encodeBase64(new Uint8Array(buffer));
}
async function decryptString(key, encoded) {
  const iv = decodeHex(encoded.slice(0, IV_LENGTH));
  const dataArray = decodeBase64(encoded.slice(IV_LENGTH));
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv
    },
    key,
    dataArray
  );
  const decryptedString = decoder$1.decode(decryptedBuffer);
  return decryptedString;
}
async function generateCspDigest(data, algorithm) {
  const hashBuffer = await crypto.subtle.digest(algorithm, encoder$1.encode(data));
  const hash = encodeBase64(new Uint8Array(hashBuffer));
  return `${ALGORITHMS[algorithm]}${hash}`;
}

const renderTemplateResultSym = /* @__PURE__ */ Symbol.for("astro.renderTemplateResult");
class RenderTemplateResult {
  [renderTemplateResultSym] = true;
  htmlParts;
  expressions;
  error;
  constructor(htmlParts, expressions) {
    this.htmlParts = htmlParts;
    this.error = void 0;
    this.expressions = expressions.map((expression) => {
      if (isPromise(expression)) {
        return Promise.resolve(expression).catch((err) => {
          if (!this.error) {
            this.error = err;
            throw err;
          }
        });
      }
      return expression;
    });
  }
  render(destination) {
    const { htmlParts, expressions } = this;
    for (let i = 0; i < htmlParts.length; i++) {
      const html = htmlParts[i];
      if (html) {
        destination.write(markHTMLString(html));
      }
      if (i >= expressions.length) break;
      const exp = expressions[i];
      if (!(exp || exp === 0)) continue;
      const result = renderChild(destination, exp);
      if (isPromise(result)) {
        const startIdx = i + 1;
        const remaining = expressions.length - startIdx;
        const flushers = new Array(remaining);
        for (let j = 0; j < remaining; j++) {
          const rExp = expressions[startIdx + j];
          flushers[j] = createBufferedRenderer(destination, (bufferDestination) => {
            if (rExp || rExp === 0) {
              return renderChild(bufferDestination, rExp);
            }
          });
        }
        return result.then(() => {
          let k = 0;
          const iterate = () => {
            while (k < flushers.length) {
              const rHtml = htmlParts[startIdx + k];
              if (rHtml) {
                destination.write(markHTMLString(rHtml));
              }
              const flushResult = flushers[k++].flush();
              if (isPromise(flushResult)) {
                return flushResult.then(iterate);
              }
            }
            const lastHtml = htmlParts[htmlParts.length - 1];
            if (lastHtml) {
              destination.write(markHTMLString(lastHtml));
            }
          };
          return iterate();
        });
      }
    }
  }
}
function isRenderTemplateResult(obj) {
  return typeof obj === "object" && obj !== null && !!obj[renderTemplateResultSym];
}
function renderTemplate(htmlParts, ...expressions) {
  return new RenderTemplateResult(htmlParts, expressions);
}

const slotString = /* @__PURE__ */ Symbol.for("astro:slot-string");
class SlotString extends HTMLString {
  instructions;
  [slotString];
  constructor(content, instructions) {
    super(content);
    this.instructions = instructions;
    this[slotString] = true;
  }
}
function isSlotString(str) {
  return !!str[slotString];
}
function mergeSlotInstructions(target, source) {
  if (source.instructions?.length) {
    target ??= [];
    target.push(...source.instructions);
  }
  return target;
}
function renderSlot(result, slotted, fallback) {
  return {
    async render(destination) {
      await renderChild(destination, typeof slotted === "function" ? slotted(result) : slotted);
    }
  };
}
async function renderSlotToString(result, slotted, fallback) {
  let content = "";
  let instructions = null;
  const temporaryDestination = {
    write(chunk) {
      if (chunk instanceof SlotString) {
        content += chunk;
        instructions = mergeSlotInstructions(instructions, chunk);
      } else if (chunk instanceof Response) return;
      else if (typeof chunk === "object" && "type" in chunk && typeof chunk.type === "string") {
        if (instructions === null) {
          instructions = [];
        }
        instructions.push(chunk);
      } else {
        content += chunkToString(result, chunk);
      }
    }
  };
  const renderInstance = renderSlot(result, slotted);
  await renderInstance.render(temporaryDestination);
  return markHTMLString(new SlotString(content, instructions));
}
async function renderSlots(result, slots = {}) {
  let slotInstructions = null;
  let children = {};
  if (slots) {
    await Promise.all(
      Object.entries(slots).map(
        ([key, value]) => renderSlotToString(result, value).then((output) => {
          if (output.instructions) {
            if (slotInstructions === null) {
              slotInstructions = [];
            }
            slotInstructions.push(...output.instructions);
          }
          children[key] = output;
        })
      )
    );
  }
  return { slotInstructions, children };
}
function createSlotValueFromString(content) {
  return function() {
    return renderTemplate`${unescapeHTML(content)}`;
  };
}

const internalProps = /* @__PURE__ */ new Set([
  "server:component-path",
  "server:component-export",
  "server:component-directive",
  "server:defer"
]);
function containsServerDirective(props) {
  return "server:component-directive" in props;
}
const SCRIPT_RE = /<\/script/giu;
const COMMENT_RE = /<!--/gu;
const SCRIPT_REPLACER = "<\\/script";
const COMMENT_REPLACER = "\\u003C!--";
function safeJsonStringify(obj) {
  return JSON.stringify(obj).replace(SCRIPT_RE, SCRIPT_REPLACER).replace(COMMENT_RE, COMMENT_REPLACER);
}
function createSearchParams(encryptedComponentExport, encryptedProps, slots) {
  const params = new URLSearchParams();
  params.set("e", encryptedComponentExport);
  params.set("p", encryptedProps);
  params.set("s", slots);
  return params;
}
function isWithinURLLimit(pathname, params) {
  const url = pathname + "?" + params.toString();
  const chars = url.length;
  return chars < 2048;
}
class ServerIslandComponent {
  result;
  props;
  slots;
  displayName;
  hostId;
  islandContent;
  componentPath;
  componentExport;
  componentId;
  constructor(result, props, slots, displayName) {
    this.result = result;
    this.props = props;
    this.slots = slots;
    this.displayName = displayName;
  }
  async init() {
    const content = await this.getIslandContent();
    if (this.result.cspDestination) {
      this.result._metadata.extraScriptHashes.push(
        await generateCspDigest(SERVER_ISLAND_REPLACER, this.result.cspAlgorithm)
      );
      const contentDigest = await generateCspDigest(content, this.result.cspAlgorithm);
      this.result._metadata.extraScriptHashes.push(contentDigest);
    }
    return createThinHead();
  }
  async render(destination) {
    const hostId = await this.getHostId();
    const islandContent = await this.getIslandContent();
    destination.write(createRenderInstruction({ type: "server-island-runtime" }));
    destination.write("<!--[if astro]>server-island-start<![endif]-->");
    for (const name in this.slots) {
      if (name === "fallback") {
        await renderChild(destination, this.slots.fallback(this.result));
      }
    }
    destination.write(
      `<script type="module" data-astro-rerun data-island-id="${hostId}">${islandContent}</script>`
    );
  }
  getComponentPath() {
    if (this.componentPath) {
      return this.componentPath;
    }
    const componentPath = this.props["server:component-path"];
    if (!componentPath) {
      throw new Error(`Could not find server component path`);
    }
    this.componentPath = componentPath;
    return componentPath;
  }
  getComponentExport() {
    if (this.componentExport) {
      return this.componentExport;
    }
    const componentExport = this.props["server:component-export"];
    if (!componentExport) {
      throw new Error(`Could not find server component export`);
    }
    this.componentExport = componentExport;
    return componentExport;
  }
  async getHostId() {
    if (!this.hostId) {
      this.hostId = await crypto.randomUUID();
    }
    return this.hostId;
  }
  async getIslandContent() {
    if (this.islandContent) {
      return this.islandContent;
    }
    const componentPath = this.getComponentPath();
    const componentExport = this.getComponentExport();
    let componentId = this.result.serverIslandNameMap.get(componentPath);
    if (!componentId) {
      throw new Error(`Could not find server component name ${componentPath}`);
    }
    for (const key2 of Object.keys(this.props)) {
      if (internalProps.has(key2)) {
        delete this.props[key2];
      }
    }
    const renderedSlots = {};
    for (const name in this.slots) {
      if (name !== "fallback") {
        const content = await renderSlotToString(this.result, this.slots[name]);
        let slotHtml = content.toString();
        const slotContent = content;
        if (Array.isArray(slotContent.instructions)) {
          for (const instruction of slotContent.instructions) {
            if (instruction.type === "script") {
              slotHtml += instruction.content;
            }
          }
        }
        renderedSlots[name] = slotHtml;
      }
    }
    const key = await this.result.key;
    const componentExportEncrypted = await encryptString(key, componentExport);
    const propsEncrypted = Object.keys(this.props).length === 0 ? "" : await encryptString(key, JSON.stringify(this.props));
    const slotsEncrypted = Object.keys(renderedSlots).length === 0 ? "" : await encryptString(key, JSON.stringify(renderedSlots));
    const hostId = await this.getHostId();
    const slash = this.result.base.endsWith("/") ? "" : "/";
    let serverIslandUrl = `${this.result.base}${slash}_server-islands/${componentId}${this.result.trailingSlash === "always" ? "/" : ""}`;
    const potentialSearchParams = createSearchParams(
      componentExportEncrypted,
      propsEncrypted,
      slotsEncrypted
    );
    const useGETRequest = isWithinURLLimit(serverIslandUrl, potentialSearchParams);
    if (useGETRequest) {
      serverIslandUrl += "?" + potentialSearchParams.toString();
      this.result._metadata.extraHead.push(
        markHTMLString(
          `<link rel="preload" as="fetch" href="${serverIslandUrl}" crossorigin="anonymous">`
        )
      );
    }
    const adapterHeaders = this.result.internalFetchHeaders || {};
    const headersJson = safeJsonStringify(adapterHeaders);
    const method = useGETRequest ? (
      // GET request
      `const headers = new Headers(${headersJson});
let response = await fetch('${serverIslandUrl}', { headers });`
    ) : (
      // POST request
      `let data = {
	encryptedComponentExport: ${safeJsonStringify(componentExportEncrypted)},
	encryptedProps: ${safeJsonStringify(propsEncrypted)},
	encryptedSlots: ${safeJsonStringify(slotsEncrypted)},
};
const headers = new Headers({ 'Content-Type': 'application/json', ...${headersJson} });
let response = await fetch('${serverIslandUrl}', {
	method: 'POST',
	body: JSON.stringify(data),
	headers,
});`
    );
    this.islandContent = `${method}replaceServerIsland('${hostId}', response);`;
    return this.islandContent;
  }
}
const renderServerIslandRuntime = () => {
  return `<script>${SERVER_ISLAND_REPLACER}</script>`;
};
const SERVER_ISLAND_REPLACER = markHTMLString(
  `async function replaceServerIsland(id, r) {
	let s = document.querySelector(\`script[data-island-id="\${id}"]\`);
	// If there's no matching script, or the request fails then return
	if (!s || r.status !== 200 || r.headers.get('content-type')?.split(';')[0].trim() !== 'text/html') return;
	// Load the HTML before modifying the DOM in case of errors
	let html = await r.text();
	// Remove any placeholder content before the island script
	while (s.previousSibling && s.previousSibling.nodeType !== 8 && s.previousSibling.data !== '[if astro]>server-island-start<![endif]')
		s.previousSibling.remove();
	s.previousSibling?.remove();
	// Insert the new HTML
	s.before(document.createRange().createContextualFragment(html));
	// Remove the script. Prior to v5.4.2, this was the trick to force rerun of scripts.  Keeping it to minimize change to the existing behavior.
	s.remove();
}`.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("//")).join(" ")
);

const Fragment = /* @__PURE__ */ Symbol.for("astro:fragment");
const Renderer = /* @__PURE__ */ Symbol.for("astro:renderer");
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function stringifyChunk(result, chunk) {
  if (isRenderInstruction(chunk)) {
    const instruction = chunk;
    switch (instruction.type) {
      case "directive": {
        const { hydration } = instruction;
        let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
        let needsDirectiveScript = hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);
        if (needsHydrationScript) {
          let prescripts = getPrescripts(result, "both", hydration.directive);
          return markHTMLString(prescripts);
        } else if (needsDirectiveScript) {
          let prescripts = getPrescripts(result, "directive", hydration.directive);
          return markHTMLString(prescripts);
        } else {
          return "";
        }
      }
      case "head": {
        if (!shouldRenderInstruction("head", getInstructionRenderState(result))) {
          return "";
        }
        return renderAllHeadContent(result);
      }
      case "maybe-head": {
        if (!shouldRenderInstruction("maybe-head", getInstructionRenderState(result))) {
          return "";
        }
        return renderAllHeadContent(result);
      }
      case "renderer-hydration-script": {
        const { rendererSpecificHydrationScripts } = result._metadata;
        const { rendererName } = instruction;
        if (!rendererSpecificHydrationScripts.has(rendererName)) {
          rendererSpecificHydrationScripts.add(rendererName);
          return instruction.render();
        }
        return "";
      }
      case "server-island-runtime": {
        if (result._metadata.hasRenderedServerIslandRuntime) {
          return "";
        }
        result._metadata.hasRenderedServerIslandRuntime = true;
        return renderServerIslandRuntime();
      }
      case "script": {
        const { id, content } = instruction;
        if (result._metadata.renderedScripts.has(id)) {
          return "";
        }
        result._metadata.renderedScripts.add(id);
        return content;
      }
      default: {
        throw new Error(`Unknown chunk type: ${chunk.type}`);
      }
    }
  } else if (chunk instanceof Response) {
    return "";
  } else if (isSlotString(chunk)) {
    let out = "";
    const c = chunk;
    if (c.instructions) {
      for (const instr of c.instructions) {
        out += stringifyChunk(result, instr);
      }
    }
    out += chunk.toString();
    return out;
  }
  return chunk.toString();
}
function chunkToString(result, chunk) {
  if (ArrayBuffer.isView(chunk)) {
    return decoder.decode(chunk);
  } else {
    return stringifyChunk(result, chunk);
  }
}
function chunkToByteArray(result, chunk) {
  if (ArrayBuffer.isView(chunk)) {
    return chunk;
  } else {
    const stringified = stringifyChunk(result, chunk);
    return encoder.encode(stringified.toString());
  }
}
function chunkToByteArrayOrString(result, chunk) {
  if (ArrayBuffer.isView(chunk)) {
    return chunk;
  } else {
    return stringifyChunk(result, chunk).toString();
  }
}
function isRenderInstance(obj) {
  return !!obj && typeof obj === "object" && "render" in obj && typeof obj.render === "function";
}

function renderChild(destination, child) {
  if (typeof child === "string") {
    destination.write(markHTMLString(escapeHTML(child)));
    return;
  }
  if (isPromise(child)) {
    return child.then((x) => renderChild(destination, x));
  }
  if (child instanceof SlotString) {
    destination.write(child);
    return;
  }
  if (isHTMLString(child)) {
    destination.write(child);
    return;
  }
  if (!child && child !== 0) {
    return;
  }
  if (Array.isArray(child)) {
    return renderArray(destination, child);
  }
  if (typeof child === "function") {
    return renderChild(destination, child());
  }
  if (isRenderInstance(child)) {
    return child.render(destination);
  }
  if (isRenderTemplateResult(child)) {
    return child.render(destination);
  }
  if (isAstroComponentInstance(child)) {
    return child.render(destination);
  }
  if (ArrayBuffer.isView(child)) {
    destination.write(child);
    return;
  }
  if (typeof child === "object" && (Symbol.asyncIterator in child || Symbol.iterator in child)) {
    if (Symbol.asyncIterator in child) {
      return renderAsyncIterable(destination, child);
    }
    return renderIterable(destination, child);
  }
  destination.write(child);
}
function renderArray(destination, children) {
  for (let i = 0; i < children.length; i++) {
    const result = renderChild(destination, children[i]);
    if (isPromise(result)) {
      if (i + 1 >= children.length) {
        return result;
      }
      const remaining = children.length - i - 1;
      const flushers = new Array(remaining);
      for (let j = 0; j < remaining; j++) {
        flushers[j] = createBufferedRenderer(destination, (bufferDestination) => {
          return renderChild(bufferDestination, children[i + 1 + j]);
        });
      }
      return result.then(() => {
        let k = 0;
        const iterate = () => {
          while (k < flushers.length) {
            const flushResult = flushers[k++].flush();
            if (isPromise(flushResult)) {
              return flushResult.then(iterate);
            }
          }
        };
        return iterate();
      });
    }
  }
}
function renderIterable(destination, children) {
  const iterator = children[Symbol.iterator]();
  const iterate = () => {
    for (; ; ) {
      const { value, done } = iterator.next();
      if (done) {
        break;
      }
      const result = renderChild(destination, value);
      if (isPromise(result)) {
        return result.then(iterate);
      }
    }
  };
  return iterate();
}
async function renderAsyncIterable(destination, children) {
  for await (const value of children) {
    await renderChild(destination, value);
  }
}

const astroComponentInstanceSym = /* @__PURE__ */ Symbol.for("astro.componentInstance");
class AstroComponentInstance {
  [astroComponentInstanceSym] = true;
  result;
  props;
  slotValues;
  factory;
  returnValue;
  constructor(result, props, slots, factory) {
    this.result = result;
    this.props = props;
    this.factory = factory;
    this.slotValues = {};
    for (const name in slots) {
      let didRender = false;
      let value = slots[name](result);
      this.slotValues[name] = () => {
        if (!didRender) {
          didRender = true;
          return value;
        }
        return slots[name](result);
      };
    }
  }
  init(result) {
    if (this.returnValue !== void 0) {
      return this.returnValue;
    }
    this.returnValue = this.factory(result, this.props, this.slotValues);
    if (isPromise(this.returnValue)) {
      this.returnValue.then((resolved) => {
        this.returnValue = resolved;
      }).catch(() => {
      });
    }
    return this.returnValue;
  }
  render(destination) {
    const returnValue = this.init(this.result);
    if (isPromise(returnValue)) {
      return returnValue.then((x) => this.renderImpl(destination, x));
    }
    return this.renderImpl(destination, returnValue);
  }
  renderImpl(destination, returnValue) {
    if (isHeadAndContent(returnValue)) {
      return returnValue.content.render(destination);
    } else {
      return renderChild(destination, returnValue);
    }
  }
}
function validateComponentProps(props, clientDirectives, displayName) {
  if (props != null) {
    const directives = [...clientDirectives.keys()].map((directive) => `client:${directive}`);
    for (const prop of Object.keys(props)) {
      if (directives.includes(prop)) {
        console.warn(
          `You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`
        );
      }
    }
  }
}
function createAstroComponentInstance(result, displayName, factory, props, slots = {}) {
  validateComponentProps(props, result.clientDirectives, displayName);
  const instance = new AstroComponentInstance(result, props, slots, factory);
  registerIfPropagating(result, factory, instance);
  return instance;
}
function isAstroComponentInstance(obj) {
  return typeof obj === "object" && obj !== null && !!obj[astroComponentInstanceSym];
}

const DOCTYPE_EXP = /<!doctype html/i;
async function renderToString(result, componentFactory, props, children, isPage = false, route) {
  const templateResult = await callComponentAsTemplateResultOrResponse(
    result,
    componentFactory,
    props,
    children,
    route
  );
  if (templateResult instanceof Response) return templateResult;
  let str = "";
  let renderedFirstPageChunk = false;
  if (isPage) {
    await bufferHeadContent(result);
  }
  const destination = {
    write(chunk) {
      if (isPage && !renderedFirstPageChunk) {
        renderedFirstPageChunk = true;
        if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
          const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
          str += doctype;
        }
      }
      if (chunk instanceof Response) return;
      str += chunkToString(result, chunk);
    }
  };
  await templateResult.render(destination);
  return str;
}
async function renderToReadableStream(result, componentFactory, props, children, isPage = false, route) {
  const templateResult = await callComponentAsTemplateResultOrResponse(
    result,
    componentFactory,
    props,
    children,
    route
  );
  if (templateResult instanceof Response) return templateResult;
  let renderedFirstPageChunk = false;
  if (isPage) {
    await bufferHeadContent(result);
  }
  return new ReadableStream({
    start(controller) {
      const destination = {
        write(chunk) {
          if (isPage && !renderedFirstPageChunk) {
            renderedFirstPageChunk = true;
            if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
              const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
              controller.enqueue(encoder.encode(doctype));
            }
          }
          if (chunk instanceof Response) {
            throw new AstroError({
              ...ResponseSentError
            });
          }
          const bytes = chunkToByteArray(result, chunk);
          controller.enqueue(bytes);
        }
      };
      (async () => {
        try {
          await templateResult.render(destination);
          controller.close();
        } catch (e) {
          if (AstroError.is(e) && !e.loc) {
            e.setLocation({
              file: route?.component
            });
          }
          setTimeout(() => controller.error(e), 0);
        }
      })();
    },
    cancel() {
      result.cancelled = true;
    }
  });
}
async function callComponentAsTemplateResultOrResponse(result, componentFactory, props, children, route) {
  const factoryResult = await componentFactory(result, props, children);
  if (factoryResult instanceof Response) {
    return factoryResult;
  } else if (isHeadAndContent(factoryResult)) {
    if (!isRenderTemplateResult(factoryResult.content)) {
      throw new AstroError({
        ...OnlyResponseCanBeReturned,
        message: OnlyResponseCanBeReturned.message(
          route?.route,
          typeof factoryResult
        ),
        location: {
          file: route?.component
        }
      });
    }
    return factoryResult.content;
  } else if (!isRenderTemplateResult(factoryResult)) {
    throw new AstroError({
      ...OnlyResponseCanBeReturned,
      message: OnlyResponseCanBeReturned.message(route?.route, typeof factoryResult),
      location: {
        file: route?.component
      }
    });
  }
  return factoryResult;
}
async function bufferHeadContent(result) {
  await bufferPropagatedHead(result);
}
async function renderToAsyncIterable(result, componentFactory, props, children, isPage = false, route) {
  const templateResult = await callComponentAsTemplateResultOrResponse(
    result,
    componentFactory,
    props,
    children,
    route
  );
  if (templateResult instanceof Response) return templateResult;
  let renderedFirstPageChunk = false;
  if (isPage) {
    await bufferHeadContent(result);
  }
  let error = null;
  let next = null;
  const buffer = [];
  let renderingComplete = false;
  const iterator = {
    async next() {
      if (result.cancelled) return { done: true, value: void 0 };
      if (next !== null) {
        await next.promise;
      } else if (!renderingComplete && !buffer.length) {
        next = promiseWithResolvers();
        await next.promise;
      }
      if (!renderingComplete) {
        next = promiseWithResolvers();
      }
      if (error) {
        throw error;
      }
      let length = 0;
      let stringToEncode = "";
      for (let i = 0, len = buffer.length; i < len; i++) {
        const bufferEntry = buffer[i];
        if (typeof bufferEntry === "string") {
          const nextIsString = i + 1 < len && typeof buffer[i + 1] === "string";
          stringToEncode += bufferEntry;
          if (!nextIsString) {
            const encoded = encoder.encode(stringToEncode);
            length += encoded.length;
            stringToEncode = "";
            buffer[i] = encoded;
          } else {
            buffer[i] = "";
          }
        } else {
          length += bufferEntry.length;
        }
      }
      let mergedArray = new Uint8Array(length);
      let offset = 0;
      for (let i = 0, len = buffer.length; i < len; i++) {
        const item = buffer[i];
        if (item === "") {
          continue;
        }
        mergedArray.set(item, offset);
        offset += item.length;
      }
      buffer.length = 0;
      const returnValue = {
        // The iterator is done when rendering has finished
        // and there are no more chunks to return.
        done: length === 0 && renderingComplete,
        value: mergedArray
      };
      return returnValue;
    },
    async return() {
      result.cancelled = true;
      return { done: true, value: void 0 };
    }
  };
  const destination = {
    write(chunk) {
      if (isPage && !renderedFirstPageChunk) {
        renderedFirstPageChunk = true;
        if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
          const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
          buffer.push(encoder.encode(doctype));
        }
      }
      if (chunk instanceof Response) {
        throw new AstroError(ResponseSentError);
      }
      const bytes = chunkToByteArrayOrString(result, chunk);
      if (bytes.length > 0) {
        buffer.push(bytes);
        next?.resolve();
      } else if (buffer.length > 0) {
        next?.resolve();
      }
    }
  };
  const renderResult = toPromise(() => templateResult.render(destination));
  renderResult.catch((err) => {
    error = err;
  }).finally(() => {
    renderingComplete = true;
    next?.resolve();
  });
  return {
    [Symbol.asyncIterator]() {
      return iterator;
    }
  };
}
function toPromise(fn) {
  try {
    const result = fn();
    return isPromise(result) ? result : Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

function componentIsHTMLElement(Component) {
  return typeof HTMLElement !== "undefined" && HTMLElement.isPrototypeOf(Component);
}
async function renderHTMLElement$1(result, constructor, props, slots) {
  const name = getHTMLElementName(constructor);
  let attrHTML = "";
  for (const attr in props) {
    attrHTML += ` ${attr}="${toAttributeString(await props[attr])}"`;
  }
  return markHTMLString(
    `<${name}${attrHTML}>${await renderSlotToString(result, slots?.default)}</${name}>`
  );
}
function getHTMLElementName(constructor) {
  const definedName = customElements.getName(constructor);
  if (definedName) return definedName;
  const assignedName = constructor.name.replace(/^HTML|Element$/g, "").replace(/[A-Z]/g, "-$&").toLowerCase().replace(/^-/, "html-");
  return assignedName;
}

const needsHeadRenderingSymbol = /* @__PURE__ */ Symbol.for("astro.needsHeadRendering");
const rendererAliases = /* @__PURE__ */ new Map([["solid", "solid-js"]]);
const clientOnlyValues = /* @__PURE__ */ new Set(["solid-js", "react", "preact", "vue", "svelte"]);
function guessRenderers(componentUrl) {
  const extname = componentUrl?.split(".").pop();
  switch (extname) {
    case "svelte":
      return ["@astrojs/svelte"];
    case "vue":
      return ["@astrojs/vue"];
    case "jsx":
    case "tsx":
      return ["@astrojs/react", "@astrojs/preact", "@astrojs/solid-js", "@astrojs/vue (jsx)"];
    case void 0:
    default:
      return [
        "@astrojs/react",
        "@astrojs/preact",
        "@astrojs/solid-js",
        "@astrojs/vue",
        "@astrojs/svelte"
      ];
  }
}
function isFragmentComponent(Component) {
  return Component === Fragment;
}
function isHTMLComponent(Component) {
  return Component && Component["astro:html"] === true;
}
const ASTRO_SLOT_EXP = /<\/?astro-slot\b[^>]*>/g;
const ASTRO_STATIC_SLOT_EXP = /<\/?astro-static-slot\b[^>]*>/g;
function removeStaticAstroSlot(html, supportsAstroStaticSlot = true) {
  const exp = supportsAstroStaticSlot ? ASTRO_STATIC_SLOT_EXP : ASTRO_SLOT_EXP;
  return html.replace(exp, "");
}
async function renderFrameworkComponent(result, displayName, Component, _props, slots = {}) {
  if (!Component && "client:only" in _props === false) {
    throw new Error(
      `Unable to render ${displayName} because it is ${Component}!
Did you forget to import the component or is it possible there is a typo?`
    );
  }
  const { renderers, clientDirectives } = result;
  const metadata = {
    astroStaticSlot: true,
    displayName
  };
  const { hydration, isPage, props, propsWithoutTransitionAttributes } = extractDirectives(
    _props,
    clientDirectives
  );
  let html = "";
  let attrs = void 0;
  if (hydration) {
    metadata.hydrate = hydration.directive;
    metadata.hydrateArgs = hydration.value;
    metadata.componentExport = hydration.componentExport;
    metadata.componentUrl = hydration.componentUrl;
  }
  const probableRendererNames = guessRenderers(metadata.componentUrl);
  const validRenderers = renderers.filter((r) => r.name !== "astro:jsx");
  const { children, slotInstructions } = await renderSlots(result, slots);
  let renderer;
  if (metadata.hydrate !== "only") {
    let isTagged = false;
    try {
      isTagged = Component && Component[Renderer];
    } catch {
    }
    if (isTagged) {
      const rendererName = Component[Renderer];
      renderer = renderers.find(({ name }) => name === rendererName);
    }
    if (!renderer) {
      let error;
      for (const r of renderers) {
        try {
          if (await r.ssr.check.call({ result }, Component, props, children, metadata)) {
            renderer = r;
            break;
          }
        } catch (e) {
          error ??= e;
        }
      }
      if (!renderer && error) {
        throw error;
      }
    }
    if (!renderer && typeof HTMLElement === "function" && componentIsHTMLElement(Component)) {
      const output = await renderHTMLElement$1(
        result,
        Component,
        _props,
        slots
      );
      return {
        render(destination) {
          destination.write(output);
        }
      };
    }
  } else {
    if (metadata.hydrateArgs) {
      const rendererName = rendererAliases.has(metadata.hydrateArgs) ? rendererAliases.get(metadata.hydrateArgs) : metadata.hydrateArgs;
      if (clientOnlyValues.has(rendererName)) {
        renderer = renderers.find(
          ({ name }) => name === `@astrojs/${rendererName}` || name === rendererName
        );
      }
    }
    if (!renderer && validRenderers.length === 1) {
      renderer = validRenderers[0];
    }
    if (!renderer) {
      const extname = metadata.componentUrl?.split(".").pop();
      renderer = renderers.find(({ name }) => name === `@astrojs/${extname}` || name === extname);
    }
    if (!renderer && metadata.hydrateArgs) {
      const rendererName = metadata.hydrateArgs;
      if (typeof rendererName === "string") {
        renderer = renderers.find(({ name }) => name === rendererName);
      }
    }
  }
  let componentServerRenderEndTime;
  if (!renderer) {
    if (metadata.hydrate === "only") {
      const rendererName = rendererAliases.has(metadata.hydrateArgs) ? rendererAliases.get(metadata.hydrateArgs) : metadata.hydrateArgs;
      if (clientOnlyValues.has(rendererName)) {
        const plural = validRenderers.length > 1;
        throw new AstroError({
          ...NoMatchingRenderer,
          message: NoMatchingRenderer.message(
            metadata.displayName,
            metadata?.componentUrl?.split(".").pop(),
            plural,
            validRenderers.length
          ),
          hint: NoMatchingRenderer.hint(
            formatList(probableRendererNames.map((r) => "`" + r + "`"))
          )
        });
      } else {
        throw new AstroError({
          ...NoClientOnlyHint,
          message: NoClientOnlyHint.message(metadata.displayName),
          hint: NoClientOnlyHint.hint(
            probableRendererNames.map((r) => r.replace("@astrojs/", "")).join("|")
          )
        });
      }
    } else if (typeof Component !== "string") {
      const matchingRenderers = validRenderers.filter(
        (r) => probableRendererNames.includes(r.name)
      );
      const plural = validRenderers.length > 1;
      if (matchingRenderers.length === 0) {
        throw new AstroError({
          ...NoMatchingRenderer,
          message: NoMatchingRenderer.message(
            metadata.displayName,
            metadata?.componentUrl?.split(".").pop(),
            plural,
            validRenderers.length
          ),
          hint: NoMatchingRenderer.hint(
            formatList(probableRendererNames.map((r) => "`" + r + "`"))
          )
        });
      } else if (matchingRenderers.length === 1) {
        renderer = matchingRenderers[0];
        ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
          { result },
          Component,
          propsWithoutTransitionAttributes,
          children,
          metadata
        ));
      } else {
        throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.
3. If using multiple JSX frameworks at the same time (e.g. React + Preact), pass the correct \`include\`/\`exclude\` options to integrations.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`);
      }
    }
  } else {
    if (metadata.hydrate === "only") {
      html = await renderSlotToString(result, slots?.fallback);
    } else {
      const componentRenderStartTime = performance.now();
      ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
        { result },
        Component,
        propsWithoutTransitionAttributes,
        children,
        metadata
      ));
      if (process.env.NODE_ENV === "development")
        componentServerRenderEndTime = performance.now() - componentRenderStartTime;
    }
  }
  if (!html && typeof Component === "string") {
    const Tag = sanitizeElementName(Component);
    const childSlots = Object.values(children).join("");
    const renderTemplateResult = renderTemplate`<${Tag}${internalSpreadAttributes(
      props,
      true,
      Tag
    )}${markHTMLString(
      childSlots === "" && voidElementNames.test(Tag) ? `/>` : `>${childSlots}</${Tag}>`
    )}`;
    html = "";
    const destination = {
      write(chunk) {
        if (chunk instanceof Response) return;
        html += chunkToString(result, chunk);
      }
    };
    await renderTemplateResult.render(destination);
  }
  if (!hydration) {
    return {
      render(destination) {
        if (slotInstructions) {
          for (const instruction of slotInstructions) {
            destination.write(instruction);
          }
        }
        if (isPage || renderer?.name === "astro:jsx") {
          destination.write(html);
        } else if (html && html.length > 0) {
          destination.write(
            markHTMLString(removeStaticAstroSlot(html, renderer?.ssr?.supportsAstroStaticSlot))
          );
        }
      }
    };
  }
  const astroId = shorthash(
    `<!--${metadata.componentExport.value}:${metadata.componentUrl}-->
${html}
${serializeProps(
      props,
      metadata
    )}`
  );
  const island = await generateHydrateScript(
    { renderer, result, astroId, props, attrs },
    metadata
  );
  if (componentServerRenderEndTime && process.env.NODE_ENV === "development")
    island.props["server-render-time"] = componentServerRenderEndTime;
  let unrenderedSlots = [];
  if (html) {
    if (Object.keys(children).length > 0) {
      for (const key of Object.keys(children)) {
        let tagName = renderer?.ssr?.supportsAstroStaticSlot ? !!metadata.hydrate ? "astro-slot" : "astro-static-slot" : "astro-slot";
        let expectedHTML = key === "default" ? `<${tagName}>` : `<${tagName} name="${key}">`;
        if (!html.includes(expectedHTML)) {
          unrenderedSlots.push(key);
        }
      }
    }
  } else {
    unrenderedSlots = Object.keys(children);
  }
  const template = unrenderedSlots.length > 0 ? unrenderedSlots.map(
    (key) => `<template data-astro-template${key !== "default" ? `="${key}"` : ""}>${children[key]}</template>`
  ).join("") : "";
  island.children = `${html ?? ""}${template}`;
  if (island.children) {
    island.props["await-children"] = "";
    island.children += `<!--astro:end-->`;
  }
  return {
    render(destination) {
      if (slotInstructions) {
        for (const instruction of slotInstructions) {
          destination.write(instruction);
        }
      }
      destination.write(createRenderInstruction({ type: "directive", hydration }));
      if (hydration.directive !== "only" && renderer?.ssr.renderHydrationScript) {
        destination.write(
          createRenderInstruction({
            type: "renderer-hydration-script",
            rendererName: renderer.name,
            render: renderer.ssr.renderHydrationScript
          })
        );
      }
      const renderedElement = renderElement$1("astro-island", island, false);
      destination.write(markHTMLString(renderedElement));
    }
  };
}
function sanitizeElementName(tag) {
  const unsafe = /[&<>'"\s]+/;
  if (!unsafe.test(tag)) return tag;
  return tag.trim().split(unsafe)[0].trim();
}
async function renderFragmentComponent(result, slots = {}) {
  const children = await renderSlotToString(result, slots?.default);
  return {
    render(destination) {
      if (children == null) return;
      destination.write(children);
    }
  };
}
async function renderHTMLComponent(result, Component, _props, slots = {}) {
  const { slotInstructions, children } = await renderSlots(result, slots);
  const html = Component({ slots: children });
  const hydrationHtml = slotInstructions ? slotInstructions.map((instr) => chunkToString(result, instr)).join("") : "";
  return {
    render(destination) {
      destination.write(markHTMLString(hydrationHtml + html));
    }
  };
}
function renderAstroComponent(result, displayName, Component, props, slots = {}) {
  if (containsServerDirective(props)) {
    const serverIslandComponent = new ServerIslandComponent(result, props, slots, displayName);
    result._metadata.propagators.add(serverIslandComponent);
    return serverIslandComponent;
  }
  const instance = createAstroComponentInstance(result, displayName, Component, props, slots);
  return {
    render(destination) {
      return instance.render(destination);
    }
  };
}
function renderComponent(result, displayName, Component, props, slots = {}) {
  if (isPromise(Component)) {
    return Component.catch(handleCancellation).then((x) => {
      return renderComponent(result, displayName, x, props, slots);
    });
  }
  if (isFragmentComponent(Component)) {
    return renderFragmentComponent(result, slots).catch(handleCancellation);
  }
  props = normalizeProps(props);
  if (isHTMLComponent(Component)) {
    return renderHTMLComponent(result, Component, props, slots).catch(handleCancellation);
  }
  if (isAstroComponentFactory(Component)) {
    return renderAstroComponent(result, displayName, Component, props, slots);
  }
  return renderFrameworkComponent(result, displayName, Component, props, slots).catch(
    handleCancellation
  );
  function handleCancellation(e) {
    if (result.cancelled)
      return {
        render() {
        }
      };
    throw e;
  }
}
function normalizeProps(props) {
  if (props["class:list"] !== void 0) {
    const value = props["class:list"];
    delete props["class:list"];
    props["class"] = clsx(props["class"], value);
    if (props["class"] === "") {
      delete props["class"];
    }
  }
  return props;
}
async function renderComponentToString(result, displayName, Component, props, slots = {}, isPage = false, route) {
  let str = "";
  let renderedFirstPageChunk = false;
  let head = "";
  if (isPage && !result.partial && nonAstroPageNeedsHeadInjection(Component)) {
    head += chunkToString(result, maybeRenderHead());
  }
  try {
    const destination = {
      write(chunk) {
        if (isPage && !result.partial && !renderedFirstPageChunk) {
          renderedFirstPageChunk = true;
          if (!/<!doctype html/i.test(String(chunk))) {
            const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
            str += doctype + head;
          }
        }
        if (chunk instanceof Response) return;
        str += chunkToString(result, chunk);
      }
    };
    const renderInstance = await renderComponent(result, displayName, Component, props, slots);
    if (containsServerDirective(props)) {
      await bufferHeadContent(result);
    }
    await renderInstance.render(destination);
  } catch (e) {
    if (AstroError.is(e) && !e.loc) {
      e.setLocation({
        file: route?.component
      });
    }
    throw e;
  }
  return str;
}
function nonAstroPageNeedsHeadInjection(pageComponent) {
  return !!pageComponent?.[needsHeadRenderingSymbol];
}

const ClientOnlyPlaceholder$1 = "astro-client-only";
const hasTriedRenderComponentSymbol = /* @__PURE__ */ Symbol("hasTriedRenderComponent");
async function renderJSX(result, vnode) {
  switch (true) {
    case vnode instanceof HTMLString:
      if (vnode.toString().trim() === "") {
        return "";
      }
      return vnode;
    case typeof vnode === "string":
      return markHTMLString(escapeHTML(vnode));
    case typeof vnode === "function":
      return vnode;
    case (!vnode && vnode !== 0):
      return "";
    case Array.isArray(vnode): {
      const renderedItems = await Promise.all(vnode.map((v) => renderJSX(result, v)));
      let instructions = null;
      let content = "";
      for (const item of renderedItems) {
        if (item instanceof SlotString) {
          content += item;
          instructions = mergeSlotInstructions(instructions, item);
        } else {
          content += item;
        }
      }
      if (instructions) {
        return markHTMLString(new SlotString(content, instructions));
      }
      return markHTMLString(content);
    }
  }
  return renderJSXVNode(result, vnode);
}
async function renderJSXVNode(result, vnode) {
  if (isVNode(vnode)) {
    switch (true) {
      case !vnode.type: {
        throw new Error(`Unable to render ${result.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`);
      }
      case vnode.type === /* @__PURE__ */ Symbol.for("astro:fragment"):
        return renderJSX(result, vnode.props.children);
      case isAstroComponentFactory(vnode.type): {
        let props = {};
        let slots = {};
        for (const [key, value] of Object.entries(vnode.props ?? {})) {
          if (key === "children" || value && typeof value === "object" && value["$$slot"]) {
            slots[key === "children" ? "default" : key] = () => renderJSX(result, value);
          } else {
            props[key] = value;
          }
        }
        const str = await renderComponentToString(
          result,
          vnode.type.name,
          vnode.type,
          props,
          slots
        );
        const html = markHTMLString(str);
        return html;
      }
      case (!vnode.type && vnode.type !== 0):
        return "";
      case (typeof vnode.type === "string" && vnode.type !== ClientOnlyPlaceholder$1):
        return markHTMLString(await renderElement(result, vnode.type, vnode.props ?? {}));
    }
    if (vnode.type) {
      let extractSlots2 = function(child) {
        if (Array.isArray(child)) {
          return child.map((c) => extractSlots2(c));
        }
        if (!isVNode(child)) {
          _slots.default.push(child);
          return;
        }
        if ("slot" in child.props) {
          _slots[child.props.slot] = [..._slots[child.props.slot] ?? [], child];
          delete child.props.slot;
          return;
        }
        _slots.default.push(child);
      };
      if (typeof vnode.type === "function" && vnode.props["server:root"]) {
        const output2 = await vnode.type(vnode.props ?? {});
        return await renderJSX(result, output2);
      }
      if (typeof vnode.type === "function") {
        if (vnode.props[hasTriedRenderComponentSymbol]) {
          delete vnode.props[hasTriedRenderComponentSymbol];
          const output2 = await vnode.type(vnode.props ?? {});
          if (output2?.[AstroJSX] || !output2) {
            return await renderJSXVNode(result, output2);
          } else {
            return;
          }
        } else {
          vnode.props[hasTriedRenderComponentSymbol] = true;
        }
      }
      const { children = null, ...props } = vnode.props ?? {};
      const _slots = {
        default: []
      };
      extractSlots2(children);
      for (const [key, value] of Object.entries(props)) {
        if (value?.["$$slot"]) {
          _slots[key] = value;
          delete props[key];
        }
      }
      const slotPromises = [];
      const slots = {};
      for (const [key, value] of Object.entries(_slots)) {
        slotPromises.push(
          renderJSX(result, value).then((output2) => {
            if (output2.toString().trim().length === 0) return;
            slots[key] = () => output2;
          })
        );
      }
      await Promise.all(slotPromises);
      let output;
      if (vnode.type === ClientOnlyPlaceholder$1 && vnode.props["client:only"]) {
        output = await renderComponentToString(
          result,
          vnode.props["client:display-name"] ?? "",
          null,
          props,
          slots
        );
      } else {
        output = await renderComponentToString(
          result,
          typeof vnode.type === "function" ? vnode.type.name : vnode.type,
          vnode.type,
          props,
          slots
        );
      }
      return markHTMLString(output);
    }
  }
  return markHTMLString(`${vnode}`);
}
async function renderElement(result, tag, { children, ...props }) {
  return markHTMLString(
    `<${tag}${spreadAttributes(props)}${markHTMLString(
      (children == null || children === "") && voidElementNames.test(tag) ? `/>` : `>${children == null ? "" : await renderJSX(result, prerenderElementChildren$1(tag, children))}</${tag}>`
    )}`
  );
}
function prerenderElementChildren$1(tag, children) {
  if (typeof children === "string" && (tag === "style" || tag === "script")) {
    return markHTMLString(children);
  } else {
    return children;
  }
}

const ClientOnlyPlaceholder = "astro-client-only";
function renderJSXToQueue(vnode, result, queue, pool, stack, parent, metadata) {
  if (vnode instanceof HTMLString) {
    const html = vnode.toString();
    if (html.trim() === "") return;
    const node = pool.acquire("html-string", html);
    node.html = html;
    queue.nodes.push(node);
    return;
  }
  if (typeof vnode === "string") {
    const node = pool.acquire("text", vnode);
    node.content = vnode;
    queue.nodes.push(node);
    return;
  }
  if (typeof vnode === "number" || typeof vnode === "boolean") {
    const str = String(vnode);
    const node = pool.acquire("text", str);
    node.content = str;
    queue.nodes.push(node);
    return;
  }
  if (vnode == null || vnode === false) {
    return;
  }
  if (Array.isArray(vnode)) {
    for (let i = vnode.length - 1; i >= 0; i = i - 1) {
      stack.push({ node: vnode[i], parent, metadata });
    }
    return;
  }
  if (!isVNode(vnode)) {
    const str = String(vnode);
    const node = pool.acquire("text", str);
    node.content = str;
    queue.nodes.push(node);
    return;
  }
  handleVNode(vnode, result, queue, pool, stack, parent, metadata);
}
function handleVNode(vnode, result, queue, pool, stack, parent, metadata) {
  if (!vnode.type) {
    throw new Error(
      `Unable to render ${result.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`
    );
  }
  if (vnode.type === /* @__PURE__ */ Symbol.for("astro:fragment")) {
    stack.push({ node: vnode.props?.children, parent, metadata });
    return;
  }
  if (isAstroComponentFactory(vnode.type)) {
    const factory = vnode.type;
    let props = {};
    let slots = {};
    for (const [key, value] of Object.entries(vnode.props ?? {})) {
      if (key === "children" || value && typeof value === "object" && value["$$slot"]) {
        slots[key === "children" ? "default" : key] = () => renderJSX(result, value);
      } else {
        props[key] = value;
      }
    }
    const displayName = metadata?.displayName || factory.name || "Anonymous";
    const instance = createAstroComponentInstance(result, displayName, factory, props, slots);
    const queueNode = pool.acquire("component");
    queueNode.instance = instance;
    queue.nodes.push(queueNode);
    return;
  }
  if (typeof vnode.type === "string" && vnode.type !== ClientOnlyPlaceholder) {
    renderHTMLElement(vnode, result, queue, pool, stack, parent, metadata);
    return;
  }
  if (typeof vnode.type === "function") {
    if (vnode.props?.["server:root"]) {
      const output3 = vnode.type(vnode.props ?? {});
      stack.push({ node: output3, parent, metadata });
      return;
    }
    const output2 = vnode.type(vnode.props ?? {});
    stack.push({ node: output2, parent, metadata });
    return;
  }
  const output = renderJSX(result, vnode);
  stack.push({ node: output, parent, metadata });
}
function renderHTMLElement(vnode, _result, queue, pool, stack, parent, metadata) {
  const tag = vnode.type;
  const { children, ...props } = vnode.props ?? {};
  const attrs = spreadAttributes(props);
  const isVoidElement = (children == null || children === "") && voidElementNames.test(tag);
  if (isVoidElement) {
    const html = `<${tag}${attrs}/>`;
    const node = pool.acquire("html-string", html);
    node.html = html;
    queue.nodes.push(node);
    return;
  }
  const openTag = `<${tag}${attrs}>`;
  const openTagHtml = queue.htmlStringCache ? queue.htmlStringCache.getOrCreate(openTag) : markHTMLString(openTag);
  stack.push({ node: openTagHtml, parent, metadata });
  if (children != null && children !== "") {
    const processedChildren = prerenderElementChildren(tag, children, queue.htmlStringCache);
    stack.push({ node: processedChildren, parent, metadata });
  }
  const closeTag = `</${tag}>`;
  const closeTagHtml = queue.htmlStringCache ? queue.htmlStringCache.getOrCreate(closeTag) : markHTMLString(closeTag);
  stack.push({ node: closeTagHtml, parent, metadata });
}
function prerenderElementChildren(tag, children, htmlStringCache) {
  if (typeof children === "string" && (tag === "style" || tag === "script")) {
    return htmlStringCache ? htmlStringCache.getOrCreate(children) : markHTMLString(children);
  }
  return children;
}

async function buildRenderQueue(root, result, pool) {
  const queue = {
    nodes: [],
    result,
    pool,
    htmlStringCache: result._experimentalQueuedRendering?.htmlStringCache
  };
  const stack = [{ node: root, parent: null }];
  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) {
      continue;
    }
    let { node, parent } = item;
    if (isPromise(node)) {
      try {
        const resolved = await node;
        stack.push({ node: resolved, parent, metadata: item.metadata });
      } catch (error) {
        throw error;
      }
      continue;
    }
    if (node == null || node === false) {
      continue;
    }
    if (typeof node === "string") {
      const queueNode = pool.acquire("text", node);
      queueNode.content = node;
      queue.nodes.push(queueNode);
      continue;
    }
    if (typeof node === "number" || typeof node === "boolean") {
      const str = String(node);
      const queueNode = pool.acquire("text", str);
      queueNode.content = str;
      queue.nodes.push(queueNode);
      continue;
    }
    if (isHTMLString(node)) {
      const html = node.toString();
      const queueNode = pool.acquire("html-string", html);
      queueNode.html = html;
      queue.nodes.push(queueNode);
      continue;
    }
    if (node instanceof SlotString) {
      const html = node.toString();
      const queueNode = pool.acquire("html-string", html);
      queueNode.html = html;
      queue.nodes.push(queueNode);
      continue;
    }
    if (isVNode(node)) {
      renderJSXToQueue(node, result, queue, pool, stack, parent, item.metadata);
      continue;
    }
    if (Array.isArray(node)) {
      for (const n of node) {
        stack.push({ node: n, parent, metadata: item.metadata });
      }
      continue;
    }
    if (isRenderInstruction(node)) {
      const queueNode = pool.acquire("instruction");
      queueNode.instruction = node;
      queue.nodes.push(queueNode);
      continue;
    }
    if (isRenderTemplateResult(node)) {
      const htmlParts = node["htmlParts"];
      const expressions = node["expressions"];
      if (htmlParts[0]) {
        const htmlString = queue.htmlStringCache ? queue.htmlStringCache.getOrCreate(htmlParts[0]) : markHTMLString(htmlParts[0]);
        stack.push({
          node: htmlString,
          parent,
          metadata: item.metadata
        });
      }
      for (let i = 0; i < expressions.length; i = i + 1) {
        stack.push({ node: expressions[i], parent, metadata: item.metadata });
        if (htmlParts[i + 1]) {
          const htmlString = queue.htmlStringCache ? queue.htmlStringCache.getOrCreate(htmlParts[i + 1]) : markHTMLString(htmlParts[i + 1]);
          stack.push({
            node: htmlString,
            parent,
            metadata: item.metadata
          });
        }
      }
      continue;
    }
    if (isAstroComponentInstance(node)) {
      const queueNode = pool.acquire("component");
      queueNode.instance = node;
      queue.nodes.push(queueNode);
      continue;
    }
    if (isAstroComponentFactory(node)) {
      const factory = node;
      const props = item.metadata?.props || {};
      const slots = item.metadata?.slots || {};
      const displayName = item.metadata?.displayName || factory.name || "Anonymous";
      const instance = createAstroComponentInstance(result, displayName, factory, props, slots);
      const queueNode = pool.acquire("component");
      queueNode.instance = instance;
      if (isAPropagatingComponent(result, factory)) {
        try {
          const returnValue = await instance.init(result);
          if (isHeadAndContent(returnValue) && returnValue.head) {
            result._metadata.extraHead.push(returnValue.head);
          }
        } catch (error) {
          throw error;
        }
      }
      queue.nodes.push(queueNode);
      continue;
    }
    if (isRenderInstance(node)) {
      const queueNode = pool.acquire("component");
      queueNode.instance = node;
      queue.nodes.push(queueNode);
      continue;
    }
    if (typeof node === "object" && Symbol.iterator in node) {
      const items = Array.from(node);
      for (const iterItem of items) {
        stack.push({ node: iterItem, parent, metadata: item.metadata });
      }
      continue;
    }
    if (typeof node === "object" && Symbol.asyncIterator in node) {
      try {
        const items = [];
        for await (const asyncItem of node) {
          items.push(asyncItem);
        }
        for (const iterItem of items) {
          stack.push({ node: iterItem, parent, metadata: item.metadata });
        }
      } catch (error) {
        throw error;
      }
      continue;
    }
    if (node instanceof Response) {
      const queueNode = pool.acquire("html-string", "");
      queueNode.html = "";
      queue.nodes.push(queueNode);
      continue;
    }
    if (isHTMLString(node)) {
      const html = String(node);
      const queueNode = pool.acquire("html-string", html);
      queueNode.html = html;
      queue.nodes.push(queueNode);
    } else {
      const str = String(node);
      const queueNode = pool.acquire("text", str);
      queueNode.content = str;
      queue.nodes.push(queueNode);
    }
  }
  queue.nodes.reverse();
  return queue;
}

async function renderQueue(queue, destination) {
  const result = queue.result;
  const pool = queue.pool;
  const cache = queue.htmlStringCache;
  let batchBuffer = "";
  let i = 0;
  while (i < queue.nodes.length) {
    const node = queue.nodes[i];
    try {
      if (canBatch(node)) {
        const batchStart = i;
        while (i < queue.nodes.length && canBatch(queue.nodes[i])) {
          batchBuffer += renderNodeToString(queue.nodes[i]);
          i = i + 1;
        }
        if (batchBuffer) {
          const htmlString = cache ? cache.getOrCreate(batchBuffer) : markHTMLString(batchBuffer);
          destination.write(htmlString);
          batchBuffer = "";
        }
        if (pool) {
          for (let j = batchStart; j < i; j++) {
            pool.release(queue.nodes[j]);
          }
        }
      } else {
        await renderNode(node, destination, result);
        if (pool) {
          pool.release(node);
        }
        i = i + 1;
      }
    } catch (error) {
      throw error;
    }
  }
  if (batchBuffer) {
    const htmlString = cache ? cache.getOrCreate(batchBuffer) : markHTMLString(batchBuffer);
    destination.write(htmlString);
  }
}
function canBatch(node) {
  return node.type === "text" || node.type === "html-string";
}
function renderNodeToString(node) {
  switch (node.type) {
    case "text":
      return node.content ? escapeHTML(node.content) : "";
    case "html-string":
      return node.html || "";
    case "component":
    case "instruction": {
      return "";
    }
  }
}
async function renderNode(node, destination, result) {
  const cache = result._experimentalQueuedRendering?.htmlStringCache;
  switch (node.type) {
    case "text": {
      if (node.content) {
        const escaped = escapeHTML(node.content);
        const htmlString = cache ? cache.getOrCreate(escaped) : markHTMLString(escaped);
        destination.write(htmlString);
      }
      break;
    }
    case "html-string": {
      if (node.html) {
        const htmlString = cache ? cache.getOrCreate(node.html) : markHTMLString(node.html);
        destination.write(htmlString);
      }
      break;
    }
    case "instruction": {
      if (node.instruction) {
        destination.write(node.instruction);
      }
      break;
    }
    case "component": {
      if (node.instance) {
        let componentHtml = "";
        const componentDestination = {
          write(chunk) {
            if (chunk instanceof Response) return;
            componentHtml += chunkToString(result, chunk);
          }
        };
        await node.instance.render(componentDestination);
        if (componentHtml) {
          destination.write(componentHtml);
        }
      }
      break;
    }
  }
}

async function renderPage(result, componentFactory, props, children, streaming, route) {
  if (!isAstroComponentFactory(componentFactory)) {
    result._metadata.headInTree = result.componentMetadata.get(componentFactory.moduleId)?.containsHead ?? false;
    const pageProps = { ...props ?? {}, "server:root": true };
    let str;
    if (result._experimentalQueuedRendering && result._experimentalQueuedRendering.enabled) {
      let vnode = await componentFactory(pageProps);
      if (componentFactory["astro:html"] && typeof vnode === "string") {
        vnode = markHTMLString(vnode);
      }
      const queue = await buildRenderQueue(
        vnode,
        result,
        result._experimentalQueuedRendering.pool
      );
      let html = "";
      let renderedFirst = false;
      const destination = {
        write(chunk) {
          if (chunk instanceof Response) return;
          if (!renderedFirst && !result.partial) {
            renderedFirst = true;
            const chunkStr = String(chunk);
            if (!/<!doctype html/i.test(chunkStr)) {
              const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
              html += doctype;
            }
          }
          html += chunkToString(result, chunk);
        }
      };
      await renderQueue(queue, destination);
      str = html;
    } else {
      str = await renderComponentToString(
        result,
        componentFactory.name,
        componentFactory,
        pageProps,
        {},
        true,
        route
      );
    }
    const bytes = encoder.encode(str);
    const headers2 = new Headers([
      ["Content-Type", "text/html"],
      ["Content-Length", bytes.byteLength.toString()]
    ]);
    if (result.shouldInjectCspMetaTags && (result.cspDestination === "header" || result.cspDestination === "adapter")) {
      headers2.set("content-security-policy", renderCspContent(result));
    }
    return new Response(bytes, {
      headers: headers2,
      status: result.response.status
    });
  }
  result._metadata.headInTree = result.componentMetadata.get(componentFactory.moduleId)?.containsHead ?? false;
  let body;
  if (streaming) {
    if (isNode && !isDeno) {
      const nodeBody = await renderToAsyncIterable(
        result,
        componentFactory,
        props,
        children,
        true,
        route
      );
      body = nodeBody;
    } else {
      body = await renderToReadableStream(result, componentFactory, props, children, true, route);
    }
  } else {
    body = await renderToString(result, componentFactory, props, children, true, route);
  }
  if (body instanceof Response) return body;
  const init = result.response;
  const headers = new Headers(init.headers);
  if (result.shouldInjectCspMetaTags && result.cspDestination === "header" || result.cspDestination === "adapter") {
    headers.set("content-security-policy", renderCspContent(result));
  }
  if (!streaming && typeof body === "string") {
    body = encoder.encode(body);
    headers.set("Content-Length", body.byteLength.toString());
  }
  let status = init.status;
  let statusText = init.statusText;
  if (route?.route === "/404") {
    status = 404;
    if (statusText === "OK") {
      statusText = "Not Found";
    }
  } else if (route?.route === "/500") {
    status = 500;
    if (statusText === "OK") {
      statusText = "Internal Server Error";
    }
  }
  if (status) {
    return new Response(body, { ...init, headers, status, statusText });
  } else {
    return new Response(body, { ...init, headers });
  }
}

"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_".split("").reduce((v, c) => (v[c.charCodeAt(0)] = c, v), []);
"-0123456789_".split("").reduce((v, c) => (v[c.charCodeAt(0)] = c, v), []);

function spreadAttributes(values = {}, _name, { class: scopedClassName } = {}) {
  let output = "";
  if (scopedClassName) {
    if (typeof values.class !== "undefined") {
      values.class += ` ${scopedClassName}`;
    } else if (typeof values["class:list"] !== "undefined") {
      values["class:list"] = [values["class:list"], scopedClassName];
    } else {
      values.class = scopedClassName;
    }
  }
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, true, _name);
  }
  return markHTMLString(output);
}

function deduplicateDirectiveValues(existingDirective, newDirective) {
  const [directiveName, ...existingValues] = existingDirective.split(/\s+/).filter(Boolean);
  const [newDirectiveName, ...newValues] = newDirective.split(/\s+/).filter(Boolean);
  if (directiveName !== newDirectiveName) {
    return void 0;
  }
  const finalDirectives = Array.from(/* @__PURE__ */ new Set([...existingValues, ...newValues]));
  return `${directiveName} ${finalDirectives.join(" ")}`;
}
function pushDirective(directives, newDirective) {
  let deduplicated = false;
  if (directives.length === 0) {
    return [newDirective];
  }
  const finalDirectives = [];
  for (const directive of directives) {
    if (deduplicated) {
      finalDirectives.push(directive);
      continue;
    }
    const result = deduplicateDirectiveValues(directive, newDirective);
    if (result) {
      finalDirectives.push(result);
      deduplicated = true;
    } else {
      finalDirectives.push(directive);
      finalDirectives.push(newDirective);
    }
  }
  return finalDirectives;
}

async function callMiddleware(onRequest, apiContext, responseFunction) {
  let nextCalled = false;
  let responseFunctionPromise = void 0;
  const next = async (payload) => {
    nextCalled = true;
    responseFunctionPromise = responseFunction(apiContext, payload);
    return responseFunctionPromise;
  };
  const middlewarePromise = onRequest(apiContext, next);
  return await Promise.resolve(middlewarePromise).then(async (value) => {
    if (nextCalled) {
      if (typeof value !== "undefined") {
        if (value instanceof Response === false) {
          throw new AstroError(MiddlewareNotAResponse);
        }
        return value;
      } else {
        if (responseFunctionPromise) {
          return responseFunctionPromise;
        } else {
          throw new AstroError(MiddlewareNotAResponse);
        }
      }
    } else if (typeof value === "undefined") {
      throw new AstroError(MiddlewareNoDataOrNextCalled);
    } else if (value instanceof Response === false) {
      throw new AstroError(MiddlewareNotAResponse);
    } else {
      return value;
    }
  });
}

const EMPTY_OPTIONS = Object.freeze({ tags: [] });
class NoopAstroCache {
  enabled = false;
  set() {
  }
  get tags() {
    return [];
  }
  get options() {
    return EMPTY_OPTIONS;
  }
  async invalidate() {
  }
}
let hasWarned = false;
class DisabledAstroCache {
  enabled = false;
  #logger;
  constructor(logger) {
    this.#logger = logger;
  }
  #warn() {
    if (!hasWarned) {
      hasWarned = true;
      this.#logger?.warn(
        "cache",
        "`cache.set()` was called but caching is not enabled. Configure a cache provider in your Astro config under `experimental.cache` to enable caching."
      );
    }
  }
  set() {
    this.#warn();
  }
  get tags() {
    return [];
  }
  get options() {
    return EMPTY_OPTIONS;
  }
  async invalidate() {
    throw new AstroError(CacheNotEnabled);
  }
}

function createRequest$1({
  url,
  headers,
  method = "GET",
  body = void 0,
  logger,
  isPrerendered = false,
  routePattern,
  init
}) {
  const headersObj = isPrerendered ? void 0 : headers instanceof Headers ? headers : new Headers(
    // Filter out HTTP/2 pseudo-headers. These are internally-generated headers added to all HTTP/2 requests with trusted metadata about the request.
    // Examples include `:method`, `:scheme`, `:authority`, and `:path`.
    // They are always prefixed with a colon to distinguish them from other headers, and it is an error to add the to a Headers object manually.
    // See https://httpwg.org/specs/rfc7540.html#HttpRequest
    Object.entries(headers).filter(([name]) => !name.startsWith(":"))
  );
  if (typeof url === "string") url = new URL(url);
  if (isPrerendered) {
    url.search = "";
  }
  const request = new Request(url, {
    method,
    headers: headersObj,
    // body is made available only if the request is for a page that will be on-demand rendered
    body: isPrerendered ? null : body,
    ...init
  });
  if (isPrerendered) {
    let _headers = request.headers;
    const { value, writable, ...headersDesc } = Object.getOwnPropertyDescriptor(request, "headers") || {};
    Object.defineProperty(request, "headers", {
      ...headersDesc,
      get() {
        logger.warn(
          null,
          `\`Astro.request.headers\` was used when rendering the route \`${routePattern}'\`. \`Astro.request.headers\` is not available on prerendered pages. If you need access to request headers, make sure that the page is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your pages server-rendered by default.`
        );
        return _headers;
      },
      set(newHeaders) {
        _headers = newHeaders;
      }
    });
  }
  return request;
}

function template({
  title,
  pathname,
  statusCode = 404,
  tabTitle,
  body
}) {
  return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>${tabTitle}</title>
		<style>
			:root {
				--gray-10: hsl(258, 7%, 10%);
				--gray-20: hsl(258, 7%, 20%);
				--gray-30: hsl(258, 7%, 30%);
				--gray-40: hsl(258, 7%, 40%);
				--gray-50: hsl(258, 7%, 50%);
				--gray-60: hsl(258, 7%, 60%);
				--gray-70: hsl(258, 7%, 70%);
				--gray-80: hsl(258, 7%, 80%);
				--gray-90: hsl(258, 7%, 90%);
				--black: #13151A;
				--accent-light: #E0CCFA;
			}

			* {
				box-sizing: border-box;
			}

			html {
				background: var(--black);
				color-scheme: dark;
				accent-color: var(--accent-light);
			}

			body {
				background-color: var(--gray-10);
				color: var(--gray-80);
				font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
				line-height: 1.5;
				margin: 0;
			}

			a {
				color: var(--accent-light);
			}

			.center {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				height: 100vh;
				width: 100vw;
			}

			h1 {
				margin-bottom: 8px;
				color: white;
				font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
				font-weight: 700;
				margin-top: 1rem;
				margin-bottom: 0;
			}

			.statusCode {
				color: var(--accent-light);
			}

			.astro-icon {
				height: 124px;
				width: 124px;
			}

			pre, code {
				padding: 2px 8px;
				background: rgba(0,0,0, 0.25);
				border: 1px solid rgba(255,255,255, 0.25);
				border-radius: 4px;
				font-size: 1.2em;
				margin-top: 0;
				max-width: 60em;
			}
		</style>
	</head>
	<body>
		<main class="center">
			<svg class="astro-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="80" viewBox="0 0 64 80" fill="none"> <path d="M20.5253 67.6322C16.9291 64.3531 15.8793 57.4632 17.3776 52.4717C19.9755 55.6188 23.575 56.6157 27.3035 57.1784C33.0594 58.0468 38.7122 57.722 44.0592 55.0977C44.6709 54.7972 45.2362 54.3978 45.9045 53.9931C46.4062 55.4451 46.5368 56.9109 46.3616 58.4028C45.9355 62.0362 44.1228 64.8429 41.2397 66.9705C40.0868 67.8215 38.8669 68.5822 37.6762 69.3846C34.0181 71.8508 33.0285 74.7426 34.403 78.9491C34.4357 79.0516 34.4649 79.1541 34.5388 79.4042C32.6711 78.5705 31.3069 77.3565 30.2674 75.7604C29.1694 74.0757 28.6471 72.2121 28.6196 70.1957C28.6059 69.2144 28.6059 68.2244 28.4736 67.257C28.1506 64.8985 27.0406 63.8425 24.9496 63.7817C22.8036 63.7192 21.106 65.0426 20.6559 67.1268C20.6215 67.2865 20.5717 67.4446 20.5218 67.6304L20.5253 67.6322Z" fill="white"/> <path d="M20.5253 67.6322C16.9291 64.3531 15.8793 57.4632 17.3776 52.4717C19.9755 55.6188 23.575 56.6157 27.3035 57.1784C33.0594 58.0468 38.7122 57.722 44.0592 55.0977C44.6709 54.7972 45.2362 54.3978 45.9045 53.9931C46.4062 55.4451 46.5368 56.9109 46.3616 58.4028C45.9355 62.0362 44.1228 64.8429 41.2397 66.9705C40.0868 67.8215 38.8669 68.5822 37.6762 69.3846C34.0181 71.8508 33.0285 74.7426 34.403 78.9491C34.4357 79.0516 34.4649 79.1541 34.5388 79.4042C32.6711 78.5705 31.3069 77.3565 30.2674 75.7604C29.1694 74.0757 28.6471 72.2121 28.6196 70.1957C28.6059 69.2144 28.6059 68.2244 28.4736 67.257C28.1506 64.8985 27.0406 63.8425 24.9496 63.7817C22.8036 63.7192 21.106 65.0426 20.6559 67.1268C20.6215 67.2865 20.5717 67.4446 20.5218 67.6304L20.5253 67.6322Z" fill="url(#paint0_linear_738_686)"/> <path d="M0 51.6401C0 51.6401 10.6488 46.4654 21.3274 46.4654L29.3786 21.6102C29.6801 20.4082 30.5602 19.5913 31.5538 19.5913C32.5474 19.5913 33.4275 20.4082 33.7289 21.6102L41.7802 46.4654C54.4274 46.4654 63.1076 51.6401 63.1076 51.6401C63.1076 51.6401 45.0197 2.48776 44.9843 2.38914C44.4652 0.935933 43.5888 0 42.4073 0H20.7022C19.5206 0 18.6796 0.935933 18.1251 2.38914C18.086 2.4859 0 51.6401 0 51.6401Z" fill="white"/> <defs> <linearGradient id="paint0_linear_738_686" x1="31.554" y1="75.4423" x2="39.7462" y2="48.376" gradientUnits="userSpaceOnUse"> <stop stop-color="#D83333"/> <stop offset="1" stop-color="#F041FF"/> </linearGradient> </defs> </svg>
			<h1>${statusCode ? `<span class="statusCode">${statusCode}: </span> ` : ""}<span class="statusMessage">${title}</span></h1>
			${body || `
				<pre>Path: ${escape(pathname)}</pre>
			`}
			</main>
	</body>
</html>`;
}

const DEFAULT_404_ROUTE = {
  component: DEFAULT_404_COMPONENT,
  params: [],
  pattern: /^\/404\/?$/,
  prerender: false,
  pathname: "/404",
  segments: [[{ content: "404", dynamic: false, spread: false }]],
  type: "page",
  route: "/404",
  fallbackRoutes: [],
  isIndex: false,
  origin: "internal",
  distURL: []
};
async function default404Page({ pathname }) {
  return new Response(
    template({
      statusCode: 404,
      title: "Not found",
      tabTitle: "404: Not Found",
      pathname
    }),
    { status: 404, headers: { "Content-Type": "text/html" } }
  );
}
default404Page.isAstroComponentFactory = true;
const default404Instance = {
  default: default404Page
};

const ROUTE404_RE = /^\/404\/?$/;
const ROUTE500_RE = /^\/500\/?$/;
function isRoute404(route) {
  return ROUTE404_RE.test(route);
}
function isRoute500(route) {
  return ROUTE500_RE.test(route);
}

function findRouteToRewrite({
  payload,
  routes,
  request,
  trailingSlash,
  buildFormat,
  base,
  outDir
}) {
  let newUrl = void 0;
  if (payload instanceof URL) {
    newUrl = payload;
  } else if (payload instanceof Request) {
    newUrl = new URL(payload.url);
  } else {
    newUrl = new URL(collapseDuplicateSlashes(payload), new URL(request.url).origin);
  }
  const { pathname, resolvedUrlPathname } = normalizeRewritePathname(
    newUrl.pathname,
    base,
    trailingSlash,
    buildFormat
  );
  newUrl.pathname = resolvedUrlPathname;
  const decodedPathname = decodeURI(pathname);
  if (isRoute404(decodedPathname)) {
    const errorRoute = routes.find((route) => route.route === "/404");
    if (errorRoute) {
      return { routeData: errorRoute, newUrl, pathname: decodedPathname };
    }
  }
  if (isRoute500(decodedPathname)) {
    const errorRoute = routes.find((route) => route.route === "/500");
    if (errorRoute) {
      return { routeData: errorRoute, newUrl, pathname: decodedPathname };
    }
  }
  let foundRoute;
  for (const route of routes) {
    if (route.pattern.test(decodedPathname)) {
      if (route.params && route.params.length !== 0 && route.distURL && route.distURL.length !== 0) {
        if (!route.distURL.find(
          (url) => url.href.replace(outDir.toString(), "").replace(/(?:\/index\.html|\.html)$/, "") === trimSlashes(pathname)
        )) {
          continue;
        }
      }
      foundRoute = route;
      break;
    }
  }
  if (foundRoute) {
    return {
      routeData: foundRoute,
      newUrl,
      pathname: decodedPathname
    };
  } else {
    const custom404 = routes.find((route) => route.route === "/404");
    if (custom404) {
      return { routeData: custom404, newUrl, pathname };
    } else {
      return { routeData: DEFAULT_404_ROUTE, newUrl, pathname };
    }
  }
}
function copyRequest(newUrl, oldRequest, isPrerendered, logger, routePattern) {
  if (oldRequest.bodyUsed) {
    throw new AstroError(RewriteWithBodyUsed);
  }
  return createRequest$1({
    url: newUrl,
    method: oldRequest.method,
    body: oldRequest.body,
    isPrerendered,
    logger,
    headers: isPrerendered ? {} : oldRequest.headers,
    routePattern,
    init: {
      referrer: oldRequest.referrer,
      referrerPolicy: oldRequest.referrerPolicy,
      mode: oldRequest.mode,
      credentials: oldRequest.credentials,
      cache: oldRequest.cache,
      redirect: oldRequest.redirect,
      integrity: oldRequest.integrity,
      signal: oldRequest.signal,
      keepalive: oldRequest.keepalive,
      // https://fetch.spec.whatwg.org/#dom-request-duplex
      // @ts-expect-error It isn't part of the types, but undici accepts it and it allows to carry over the body to a new request
      duplex: "half"
    }
  });
}
function setOriginPathname(request, pathname, trailingSlash, buildFormat) {
  if (!pathname) {
    pathname = "/";
  }
  const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);
  let finalPathname;
  if (pathname === "/") {
    finalPathname = "/";
  } else if (shouldAppendSlash) {
    finalPathname = appendForwardSlash(pathname);
  } else {
    finalPathname = removeTrailingForwardSlash(pathname);
  }
  Reflect.set(request, originPathnameSymbol, encodeURIComponent(finalPathname));
}
function getOriginPathname(request) {
  const origin = Reflect.get(request, originPathnameSymbol);
  if (origin) {
    return decodeURIComponent(origin);
  }
  return new URL(request.url).pathname;
}
function normalizeRewritePathname(urlPathname, base, trailingSlash, buildFormat) {
  let pathname = collapseDuplicateSlashes(urlPathname);
  const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);
  if (base !== "/") {
    const isBasePathRequest = urlPathname === base || urlPathname === removeTrailingForwardSlash(base);
    if (isBasePathRequest) {
      pathname = shouldAppendSlash ? "/" : "";
    } else if (urlPathname.startsWith(base)) {
      pathname = shouldAppendSlash ? appendForwardSlash(urlPathname) : removeTrailingForwardSlash(urlPathname);
      pathname = pathname.slice(base.length);
    }
  }
  if (!pathname.startsWith("/") && shouldAppendSlash && urlPathname.endsWith("/")) {
    pathname = prependForwardSlash$1(pathname);
  }
  if (pathname === "/" && base !== "/" && !shouldAppendSlash) {
    pathname = "";
  }
  if (buildFormat === "file") {
    pathname = pathname.replace(/\.html$/, "");
  }
  let resolvedUrlPathname;
  if (base !== "/" && (pathname === "" || pathname === "/") && !shouldAppendSlash) {
    resolvedUrlPathname = removeTrailingForwardSlash(base);
  } else {
    resolvedUrlPathname = joinPaths(...[base, pathname].filter(Boolean));
  }
  return { pathname, resolvedUrlPathname };
}

const NOOP_ACTIONS_MOD = {
  server: {}
};

function defineMiddleware(fn) {
  return fn;
}

const FORM_CONTENT_TYPES = [
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain"
];
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
function createOriginCheckMiddleware() {
  return defineMiddleware((context, next) => {
    const { request, url, isPrerendered } = context;
    if (isPrerendered) {
      return next();
    }
    if (SAFE_METHODS.includes(request.method)) {
      return next();
    }
    const isSameOrigin = request.headers.get("origin") === url.origin;
    const hasContentType = request.headers.has("content-type");
    if (hasContentType) {
      const formLikeHeader = hasFormLikeHeader(request.headers.get("content-type"));
      if (formLikeHeader && !isSameOrigin) {
        return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
          status: 403
        });
      }
    } else {
      if (!isSameOrigin) {
        return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
          status: 403
        });
      }
    }
    return next();
  });
}
function hasFormLikeHeader(contentType) {
  if (contentType) {
    for (const FORM_CONTENT_TYPE of FORM_CONTENT_TYPES) {
      if (contentType.toLowerCase().includes(FORM_CONTENT_TYPE)) {
        return true;
      }
    }
  }
  return false;
}

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

const RedirectComponentInstance = {
  default() {
    return new Response(null, {
      status: 301
    });
  }
};
const RedirectSinglePageBuiltModule = {
  page: () => Promise.resolve(RedirectComponentInstance),
  onRequest: (_, next) => next()
};

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? collapseDuplicateLeadingSlashes("/" + segmentPath) : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

const VALID_PARAM_TYPES = ["string", "undefined"];
function validateGetStaticPathsParameter([key, value], route) {
  if (!VALID_PARAM_TYPES.includes(typeof value)) {
    throw new AstroError({
      ...GetStaticPathsInvalidRouteParam,
      message: GetStaticPathsInvalidRouteParam.message(key, value, typeof value),
      location: {
        file: route
      }
    });
  }
}

function stringifyParams(params, route, trailingSlash) {
  const validatedParams = {};
  for (const [key, value] of Object.entries(params)) {
    validateGetStaticPathsParameter([key, value], route.component);
    if (value !== void 0) {
      validatedParams[key] = trimSlashes(value);
    }
  }
  return getRouteGenerator(route.segments, trailingSlash)(validatedParams);
}

function validateDynamicRouteModule(mod, {
  ssr,
  route
}) {
  if ((!ssr || route.prerender) && !mod.getStaticPaths) {
    throw new AstroError({
      ...GetStaticPathsRequired,
      location: { file: route.component }
    });
  }
}
function validateGetStaticPathsResult(result, route) {
  if (!Array.isArray(result)) {
    throw new AstroError({
      ...InvalidGetStaticPathsReturn,
      message: InvalidGetStaticPathsReturn.message(typeof result),
      location: {
        file: route.component
      }
    });
  }
  result.forEach((pathObject) => {
    if (typeof pathObject === "object" && Array.isArray(pathObject) || pathObject === null) {
      throw new AstroError({
        ...InvalidGetStaticPathsEntry,
        message: InvalidGetStaticPathsEntry.message(
          Array.isArray(pathObject) ? "array" : typeof pathObject
        )
      });
    }
    if (pathObject.params === void 0 || pathObject.params === null || pathObject.params && Object.keys(pathObject.params).length === 0) {
      throw new AstroError({
        ...GetStaticPathsExpectedParams,
        location: {
          file: route.component
        }
      });
    }
  });
}

function generatePaginateFunction(routeMatch, base, trailingSlash) {
  return function paginateUtility(data, args = {}) {
    const generate = getRouteGenerator(routeMatch.segments, trailingSlash);
    let { pageSize: _pageSize, params: _params, props: _props } = args;
    const pageSize = _pageSize || 10;
    const paramName = "page";
    const additionalParams = _params || {};
    const additionalProps = _props || {};
    let includesFirstPageNumber;
    if (routeMatch.params.includes(`...${paramName}`)) {
      includesFirstPageNumber = false;
    } else if (routeMatch.params.includes(`${paramName}`)) {
      includesFirstPageNumber = true;
    } else {
      throw new AstroError({
        ...PageNumberParamNotFound,
        message: PageNumberParamNotFound.message(paramName)
      });
    }
    const lastPage = Math.max(1, Math.ceil(data.length / pageSize));
    const result = [...Array(lastPage).keys()].map((num) => {
      const pageNum = num + 1;
      const start = pageSize === Number.POSITIVE_INFINITY ? 0 : (pageNum - 1) * pageSize;
      const end = Math.min(start + pageSize, data.length);
      const params = {
        ...additionalParams,
        [paramName]: includesFirstPageNumber || pageNum > 1 ? String(pageNum) : void 0
      };
      const current = addRouteBase(generate({ ...params }), base);
      const next = pageNum === lastPage ? void 0 : addRouteBase(generate({ ...params, page: String(pageNum + 1) }), base);
      const prev = pageNum === 1 ? void 0 : addRouteBase(
        generate({
          ...params,
          page: !includesFirstPageNumber && pageNum - 1 === 1 ? void 0 : String(pageNum - 1)
        }),
        base
      );
      const first = pageNum === 1 ? void 0 : addRouteBase(
        generate({
          ...params,
          page: includesFirstPageNumber ? "1" : void 0
        }),
        base
      );
      const last = pageNum === lastPage ? void 0 : addRouteBase(generate({ ...params, page: String(lastPage) }), base);
      return {
        params,
        props: {
          ...additionalProps,
          page: {
            data: data.slice(start, end),
            start,
            end: end - 1,
            size: pageSize,
            total: data.length,
            currentPage: pageNum,
            lastPage,
            url: { current, next, prev, first, last }
          }
        }
      };
    });
    return result;
  };
}
function addRouteBase(route, base) {
  let routeWithBase = joinPaths(base, route);
  if (routeWithBase === "") routeWithBase = "/";
  return routeWithBase;
}

async function callGetStaticPaths({
  mod,
  route,
  routeCache,
  ssr,
  base,
  trailingSlash
}) {
  const cached = routeCache.get(route);
  if (!mod) {
    throw new Error("This is an error caused by Astro and not your code. Please file an issue.");
  }
  if (cached?.staticPaths) {
    return cached.staticPaths;
  }
  validateDynamicRouteModule(mod, { ssr, route });
  if (ssr && !route.prerender) {
    const entry = Object.assign([], { keyed: /* @__PURE__ */ new Map() });
    routeCache.set(route, { ...cached, staticPaths: entry });
    return entry;
  }
  let staticPaths = [];
  if (!mod.getStaticPaths) {
    throw new Error("Unexpected Error.");
  }
  staticPaths = await mod.getStaticPaths({
    // Q: Why the cast?
    // A: So users downstream can have nicer typings, we have to make some sacrifice in our internal typings, which necessitate a cast here
    paginate: generatePaginateFunction(route, base, trailingSlash),
    routePattern: route.route
  });
  validateGetStaticPathsResult(staticPaths, route);
  const keyedStaticPaths = staticPaths;
  keyedStaticPaths.keyed = /* @__PURE__ */ new Map();
  for (const sp of keyedStaticPaths) {
    const paramsKey = stringifyParams(sp.params, route, trailingSlash);
    keyedStaticPaths.keyed.set(paramsKey, sp);
  }
  routeCache.set(route, { ...cached, staticPaths: keyedStaticPaths });
  return keyedStaticPaths;
}
class RouteCache {
  logger;
  cache = {};
  runtimeMode;
  constructor(logger, runtimeMode = "production") {
    this.logger = logger;
    this.runtimeMode = runtimeMode;
  }
  /** Clear the cache. */
  clearAll() {
    this.cache = {};
  }
  set(route, entry) {
    const key = this.key(route);
    if (this.runtimeMode === "production" && this.cache[key]?.staticPaths) {
      this.logger.warn(null, `Internal Warning: route cache overwritten. (${key})`);
    }
    this.cache[key] = entry;
  }
  get(route) {
    return this.cache[this.key(route)];
  }
  key(route) {
    return `${route.route}_${route.component}`;
  }
}
function findPathItemByKey(staticPaths, params, route, logger, trailingSlash) {
  const paramsKey = stringifyParams(params, route, trailingSlash);
  const matchedStaticPath = staticPaths.keyed.get(paramsKey);
  if (matchedStaticPath) {
    return matchedStaticPath;
  }
  logger.debug("router", `findPathItemByKey() - Unexpected cache miss looking for ${paramsKey}`);
}

function getPattern(segments, base, addTrailingSlash) {
  const pathname = segments.map((segment) => {
    if (segment.length === 1 && segment[0].spread) {
      return "(?:\\/(.*?))?";
    } else {
      return "\\/" + segment.map((part) => {
        if (part.spread) {
          return "(.*?)";
        } else if (part.dynamic) {
          return "([^/]+?)";
        } else {
          return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
      }).join("");
    }
  }).join("");
  const trailing = addTrailingSlash && segments.length ? getTrailingSlashPattern(addTrailingSlash) : "$";
  let initial = "\\/";
  if (addTrailingSlash === "never" && base !== "/") {
    initial = "";
  }
  return new RegExp(`^${pathname || initial}${trailing}`);
}
function getTrailingSlashPattern(addTrailingSlash) {
  if (addTrailingSlash === "always") {
    return "\\/$";
  }
  if (addTrailingSlash === "never") {
    return "$";
  }
  return "\\/?$";
}

const SERVER_ISLAND_ROUTE = "/_server-islands/[name]";
const SERVER_ISLAND_COMPONENT = "_server-islands.astro";
function badRequest(reason) {
  return new Response(null, {
    status: 400,
    statusText: "Bad request: " + reason
  });
}
const DEFAULT_BODY_SIZE_LIMIT = 1024 * 1024;
async function getRequestData(request, bodySizeLimit = DEFAULT_BODY_SIZE_LIMIT) {
  switch (request.method) {
    case "GET": {
      const url = new URL(request.url);
      const params = url.searchParams;
      if (!params.has("s") || !params.has("e") || !params.has("p")) {
        return badRequest("Missing required query parameters.");
      }
      const encryptedSlots = params.get("s");
      return {
        encryptedComponentExport: params.get("e"),
        encryptedProps: params.get("p"),
        encryptedSlots
      };
    }
    case "POST": {
      try {
        const body = await readBodyWithLimit(request, bodySizeLimit);
        const raw = new TextDecoder().decode(body);
        const data = JSON.parse(raw);
        if (Object.hasOwn(data, "slots") && typeof data.slots === "object") {
          return badRequest("Plaintext slots are not allowed. Slots must be encrypted.");
        }
        if (Object.hasOwn(data, "componentExport") && typeof data.componentExport === "string") {
          return badRequest(
            "Plaintext componentExport is not allowed. componentExport must be encrypted."
          );
        }
        return data;
      } catch (e) {
        if (e instanceof BodySizeLimitError) {
          return new Response(null, {
            status: 413,
            statusText: e.message
          });
        }
        if (e instanceof SyntaxError) {
          return badRequest("Request format is invalid.");
        }
        throw e;
      }
    }
    default: {
      return new Response(null, { status: 405 });
    }
  }
}
function createEndpoint(manifest) {
  const page = async (result) => {
    const params = result.params;
    if (!params.name) {
      return new Response(null, {
        status: 400,
        statusText: "Bad request"
      });
    }
    const componentId = params.name;
    const data = await getRequestData(result.request, manifest.serverIslandBodySizeLimit);
    if (data instanceof Response) {
      return data;
    }
    const serverIslandMappings = await manifest.serverIslandMappings?.();
    const serverIslandMap = await serverIslandMappings?.serverIslandMap;
    let imp = serverIslandMap?.get(componentId);
    if (!imp) {
      return new Response(null, {
        status: 404,
        statusText: "Not found"
      });
    }
    const key = await manifest.key;
    let componentExport;
    try {
      componentExport = await decryptString(key, data.encryptedComponentExport);
    } catch (_e) {
      return badRequest("Encrypted componentExport value is invalid.");
    }
    const encryptedProps = data.encryptedProps;
    let props = {};
    if (encryptedProps !== "") {
      try {
        const propString = await decryptString(key, encryptedProps);
        props = JSON.parse(propString);
      } catch (_e) {
        return badRequest("Encrypted props value is invalid.");
      }
    }
    let decryptedSlots = {};
    const encryptedSlots = data.encryptedSlots;
    if (encryptedSlots !== "") {
      try {
        const slotsString = await decryptString(key, encryptedSlots);
        decryptedSlots = JSON.parse(slotsString);
      } catch (_e) {
        return badRequest("Encrypted slots value is invalid.");
      }
    }
    const componentModule = await imp();
    let Component = componentModule[componentExport];
    const slots = {};
    for (const prop in decryptedSlots) {
      slots[prop] = createSlotValueFromString(decryptedSlots[prop]);
    }
    result.response.headers.set("X-Robots-Tag", "noindex");
    if (isAstroComponentFactory(Component)) {
      const ServerIsland = Component;
      Component = function(...args) {
        return ServerIsland.apply(this, args);
      };
      Object.assign(Component, ServerIsland);
      Component.propagation = "self";
    }
    return renderTemplate`${renderComponent(result, "Component", Component, props, slots)}`;
  };
  page.isAstroComponentFactory = true;
  const instance = {
    default: page,
    partial: true
  };
  return instance;
}

function createDefaultRoutes(manifest) {
  const root = new URL(manifest.rootDir);
  return [
    {
      instance: default404Instance,
      matchesComponent: (filePath) => filePath.href === new URL(DEFAULT_404_COMPONENT, root).href,
      route: DEFAULT_404_ROUTE.route,
      component: DEFAULT_404_COMPONENT
    },
    {
      instance: createEndpoint(manifest),
      matchesComponent: (filePath) => filePath.href === new URL(SERVER_ISLAND_COMPONENT, root).href,
      route: SERVER_ISLAND_ROUTE,
      component: SERVER_ISLAND_COMPONENT
    }
  ];
}

function deserializeManifest(serializedManifest, routesList) {
  const routes = [];
  if (serializedManifest.routes) {
    for (const serializedRoute of serializedManifest.routes) {
      routes.push({
        ...serializedRoute,
        routeData: deserializeRouteData(serializedRoute.routeData)
      });
      const route = serializedRoute;
      route.routeData = deserializeRouteData(serializedRoute.routeData);
    }
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    rootDir: new URL(serializedManifest.rootDir),
    srcDir: new URL(serializedManifest.srcDir),
    publicDir: new URL(serializedManifest.publicDir),
    outDir: new URL(serializedManifest.outDir),
    cacheDir: new URL(serializedManifest.cacheDir),
    buildClientDir: new URL(serializedManifest.buildClientDir),
    buildServerDir: new URL(serializedManifest.buildServerDir),
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    key
  };
}
function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin,
    distURL: rawRouteData.distURL
  };
}
function deserializeRouteInfo(rawRouteInfo) {
  return {
    styles: rawRouteInfo.styles,
    file: rawRouteInfo.file,
    links: rawRouteInfo.links,
    scripts: rawRouteInfo.scripts,
    routeData: deserializeRouteData(rawRouteInfo.routeData)
  };
}

class NodePool {
  textPool = [];
  htmlStringPool = [];
  componentPool = [];
  instructionPool = [];
  maxSize;
  enableStats;
  stats = {
    acquireFromPool: 0,
    acquireNew: 0,
    released: 0,
    releasedDropped: 0
  };
  /**
   * Creates a new object pool for queue nodes.
   *
   * @param maxSize - Maximum number of nodes to keep in the pool (default: 1000).
   *   The cap is shared across all typed sub-pools.
   * @param enableStats - Enable statistics tracking (default: false for performance)
   */
  constructor(maxSize = 1e3, enableStats = false) {
    this.maxSize = maxSize;
    this.enableStats = enableStats;
  }
  /**
   * Acquires a queue node from the pool or creates a new one if the pool is empty.
   * Pops from the type-specific sub-pool to reuse an existing object when available.
   *
   * @param type - The type of queue node to acquire
   * @param content - Optional content to set on the node (for text or html-string types)
   * @returns A queue node ready to be populated with data
   */
  acquire(type, content) {
    const pooledNode = this.popFromTypedPool(type);
    if (pooledNode) {
      if (this.enableStats) {
        this.stats.acquireFromPool = this.stats.acquireFromPool + 1;
      }
      this.resetNodeContent(pooledNode, type, content);
      return pooledNode;
    }
    if (this.enableStats) {
      this.stats.acquireNew = this.stats.acquireNew + 1;
    }
    return this.createNode(type, content);
  }
  /**
   * Creates a new node of the specified type with the given content.
   * Helper method to reduce branching in acquire().
   */
  createNode(type, content = "") {
    switch (type) {
      case "text":
        return { type: "text", content };
      case "html-string":
        return { type: "html-string", html: content };
      case "component":
        return { type: "component", instance: void 0 };
      case "instruction":
        return { type: "instruction", instruction: void 0 };
    }
  }
  /**
   * Pops a node from the type-specific sub-pool.
   * Returns undefined if the sub-pool for the requested type is empty.
   */
  popFromTypedPool(type) {
    switch (type) {
      case "text":
        return this.textPool.pop();
      case "html-string":
        return this.htmlStringPool.pop();
      case "component":
        return this.componentPool.pop();
      case "instruction":
        return this.instructionPool.pop();
    }
  }
  /**
   * Resets the content/value field on a reused pooled node.
   * The type discriminant is already correct since we pop from the matching sub-pool.
   */
  resetNodeContent(node, type, content) {
    switch (type) {
      case "text":
        node.content = content ?? "";
        break;
      case "html-string":
        node.html = content ?? "";
        break;
      case "component":
        node.instance = void 0;
        break;
      case "instruction":
        node.instruction = void 0;
        break;
    }
  }
  /**
   * Returns the total number of nodes across all typed sub-pools.
   */
  totalPoolSize() {
    return this.textPool.length + this.htmlStringPool.length + this.componentPool.length + this.instructionPool.length;
  }
  /**
   * Releases a queue node back to the pool for reuse.
   * If the pool is at max capacity, the node is discarded (will be GC'd).
   *
   * @param node - The node to release back to the pool
   */
  release(node) {
    if (this.totalPoolSize() >= this.maxSize) {
      if (this.enableStats) {
        this.stats.releasedDropped = this.stats.releasedDropped + 1;
      }
      return;
    }
    switch (node.type) {
      case "text":
        node.content = "";
        this.textPool.push(node);
        break;
      case "html-string":
        node.html = "";
        this.htmlStringPool.push(node);
        break;
      case "component":
        node.instance = void 0;
        this.componentPool.push(node);
        break;
      case "instruction":
        node.instruction = void 0;
        this.instructionPool.push(node);
        break;
    }
    if (this.enableStats) {
      this.stats.released = this.stats.released + 1;
    }
  }
  /**
   * Releases all nodes in an array back to the pool.
   * This is a convenience method for releasing multiple nodes at once.
   *
   * @param nodes - Array of nodes to release
   */
  releaseAll(nodes) {
    for (const node of nodes) {
      this.release(node);
    }
  }
  /**
   * Clears all typed sub-pools, discarding all cached nodes.
   * This can be useful if you want to free memory after a large render.
   */
  clear() {
    this.textPool.length = 0;
    this.htmlStringPool.length = 0;
    this.componentPool.length = 0;
    this.instructionPool.length = 0;
  }
  /**
   * Gets the current total number of nodes across all typed sub-pools.
   * Useful for monitoring pool usage and tuning maxSize.
   *
   * @returns Number of nodes currently available in the pool
   */
  size() {
    return this.totalPoolSize();
  }
  /**
   * Gets pool statistics for debugging.
   *
   * @returns Pool usage statistics including computed metrics
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.totalPoolSize(),
      maxSize: this.maxSize,
      hitRate: this.stats.acquireFromPool + this.stats.acquireNew > 0 ? this.stats.acquireFromPool / (this.stats.acquireFromPool + this.stats.acquireNew) * 100 : 0
    };
  }
  /**
   * Resets pool statistics.
   */
  resetStats() {
    this.stats = {
      acquireFromPool: 0,
      acquireNew: 0,
      released: 0,
      releasedDropped: 0
    };
  }
}

class HTMLStringCache {
  cache = /* @__PURE__ */ new Map();
  maxSize;
  constructor(maxSize = 1e3) {
    this.maxSize = maxSize;
    this.warm(COMMON_HTML_PATTERNS);
  }
  /**
   * Get or create an HTMLString for the given content.
   * If cached, the existing object is returned and moved to end (most recently used).
   * If not cached, a new HTMLString is created, cached, and returned.
   *
   * @param content - The HTML string content
   * @returns HTMLString object (cached or newly created)
   */
  getOrCreate(content) {
    const cached = this.cache.get(content);
    if (cached) {
      this.cache.delete(content);
      this.cache.set(content, cached);
      return cached;
    }
    const htmlString = new HTMLString(content);
    this.cache.set(content, htmlString);
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== void 0) {
        this.cache.delete(firstKey);
      }
    }
    return htmlString;
  }
  /**
   * Get current cache size
   */
  size() {
    return this.cache.size;
  }
  /**
   * Pre-warms the cache with common HTML patterns.
   * This ensures first-render cache hits for frequently used tags.
   *
   * @param patterns - Array of HTML strings to pre-cache
   */
  warm(patterns) {
    for (const pattern of patterns) {
      if (!this.cache.has(pattern)) {
        this.cache.set(pattern, new HTMLString(pattern));
      }
    }
  }
  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
  }
}
const COMMON_HTML_PATTERNS = [
  // Structural elements
  "<div>",
  "</div>",
  "<span>",
  "</span>",
  "<p>",
  "</p>",
  "<section>",
  "</section>",
  "<article>",
  "</article>",
  "<header>",
  "</header>",
  "<footer>",
  "</footer>",
  "<nav>",
  "</nav>",
  "<main>",
  "</main>",
  "<aside>",
  "</aside>",
  // List elements
  "<ul>",
  "</ul>",
  "<ol>",
  "</ol>",
  "<li>",
  "</li>",
  // Void/self-closing elements
  "<br>",
  "<hr>",
  "<br/>",
  "<hr/>",
  // Heading elements
  "<h1>",
  "</h1>",
  "<h2>",
  "</h2>",
  "<h3>",
  "</h3>",
  "<h4>",
  "</h4>",
  // Inline elements
  "<a>",
  "</a>",
  "<strong>",
  "</strong>",
  "<em>",
  "</em>",
  "<code>",
  "</code>",
  // Common whitespace
  " ",
  "\n"
];

class Pipeline {
  constructor(logger, manifest, runtimeMode, renderers, resolve, streaming, adapterName = manifest.adapterName, clientDirectives = manifest.clientDirectives, inlinedScripts = manifest.inlinedScripts, compressHTML = manifest.compressHTML, i18n = manifest.i18n, middleware = manifest.middleware, routeCache = new RouteCache(logger, runtimeMode), site = manifest.site ? new URL(manifest.site) : void 0, defaultRoutes = createDefaultRoutes(manifest), actions = manifest.actions, sessionDriver = manifest.sessionDriver, cacheProvider = manifest.cacheProvider, cacheConfig = manifest.cacheConfig, serverIslands = manifest.serverIslandMappings) {
    this.logger = logger;
    this.manifest = manifest;
    this.runtimeMode = runtimeMode;
    this.renderers = renderers;
    this.resolve = resolve;
    this.streaming = streaming;
    this.adapterName = adapterName;
    this.clientDirectives = clientDirectives;
    this.inlinedScripts = inlinedScripts;
    this.compressHTML = compressHTML;
    this.i18n = i18n;
    this.middleware = middleware;
    this.routeCache = routeCache;
    this.site = site;
    this.defaultRoutes = defaultRoutes;
    this.actions = actions;
    this.sessionDriver = sessionDriver;
    this.cacheProvider = cacheProvider;
    this.cacheConfig = cacheConfig;
    this.serverIslands = serverIslands;
    this.internalMiddleware = [];
    if (i18n?.strategy !== "manual") {
      this.internalMiddleware.push(
        createI18nMiddleware(i18n, manifest.base, manifest.trailingSlash, manifest.buildFormat)
      );
    }
    if (manifest.experimentalQueuedRendering.enabled) {
      this.nodePool = this.createNodePool(
        manifest.experimentalQueuedRendering.poolSize ?? 1e3,
        false
      );
      if (manifest.experimentalQueuedRendering.contentCache) {
        this.htmlStringCache = this.createStringCache();
      }
    }
  }
  internalMiddleware;
  resolvedMiddleware = void 0;
  resolvedActions = void 0;
  resolvedSessionDriver = void 0;
  resolvedCacheProvider = void 0;
  compiledCacheRoutes = void 0;
  nodePool;
  htmlStringCache;
  /**
   * Resolves the middleware from the manifest, and returns the `onRequest` function. If `onRequest` isn't there,
   * it returns a no-op function
   */
  async getMiddleware() {
    if (this.resolvedMiddleware) {
      return this.resolvedMiddleware;
    }
    if (this.middleware) {
      const middlewareInstance = await this.middleware();
      const onRequest = middlewareInstance.onRequest ?? NOOP_MIDDLEWARE_FN;
      const internalMiddlewares = [onRequest];
      if (this.manifest.checkOrigin) {
        internalMiddlewares.unshift(createOriginCheckMiddleware());
      }
      this.resolvedMiddleware = sequence(...internalMiddlewares);
      return this.resolvedMiddleware;
    } else {
      this.resolvedMiddleware = NOOP_MIDDLEWARE_FN;
      return this.resolvedMiddleware;
    }
  }
  /**
   * Clears the cached middleware so it is re-resolved on the next request.
   * Called via HMR when middleware files change during development.
   */
  clearMiddleware() {
    this.resolvedMiddleware = void 0;
  }
  async getActions() {
    if (this.resolvedActions) {
      return this.resolvedActions;
    } else if (this.actions) {
      return this.actions();
    }
    return NOOP_ACTIONS_MOD;
  }
  async getSessionDriver() {
    if (this.resolvedSessionDriver !== void 0) {
      return this.resolvedSessionDriver;
    }
    if (this.sessionDriver) {
      const driverModule = await this.sessionDriver();
      this.resolvedSessionDriver = driverModule?.default || null;
      return this.resolvedSessionDriver;
    }
    this.resolvedSessionDriver = null;
    return null;
  }
  async getCacheProvider() {
    if (this.resolvedCacheProvider !== void 0) {
      return this.resolvedCacheProvider;
    }
    if (this.cacheProvider) {
      const mod = await this.cacheProvider();
      const factory = mod?.default || null;
      this.resolvedCacheProvider = factory ? factory(this.cacheConfig?.options) : null;
      return this.resolvedCacheProvider;
    }
    this.resolvedCacheProvider = null;
    return null;
  }
  async getServerIslands() {
    if (this.serverIslands) {
      return this.serverIslands();
    }
    return {
      serverIslandMap: /* @__PURE__ */ new Map(),
      serverIslandNameMap: /* @__PURE__ */ new Map()
    };
  }
  async getAction(path) {
    const pathKeys = path.split(".").map((key) => decodeURIComponent(key));
    let { server } = await this.getActions();
    if (!server || !(typeof server === "object")) {
      throw new TypeError(
        `Expected \`server\` export in actions file to be an object. Received ${typeof server}.`
      );
    }
    for (const key of pathKeys) {
      if (!Object.hasOwn(server, key)) {
        throw new AstroError({
          ...ActionNotFoundError,
          message: ActionNotFoundError.message(pathKeys.join("."))
        });
      }
      server = server[key];
    }
    if (typeof server !== "function") {
      throw new TypeError(
        `Expected handler for action ${pathKeys.join(".")} to be a function. Received ${typeof server}.`
      );
    }
    return server;
  }
  async getModuleForRoute(route) {
    for (const defaultRoute of this.defaultRoutes) {
      if (route.component === defaultRoute.component) {
        return {
          page: () => Promise.resolve(defaultRoute.instance)
        };
      }
    }
    if (route.type === "redirect") {
      return RedirectSinglePageBuiltModule;
    } else {
      if (this.manifest.pageMap) {
        const importComponentInstance = this.manifest.pageMap.get(route.component);
        if (!importComponentInstance) {
          throw new Error(
            `Unexpectedly unable to find a component instance for route ${route.route}`
          );
        }
        return await importComponentInstance();
      } else if (this.manifest.pageModule) {
        return this.manifest.pageModule;
      }
      throw new Error(
        "Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error, please file an issue."
      );
    }
  }
  createNodePool(poolSize, stats) {
    return new NodePool(poolSize, stats);
  }
  createStringCache() {
    return new HTMLStringCache(1e3);
  }
}

function routeIsRedirect(route) {
  return route?.type === "redirect";
}
function routeIsFallback(route) {
  return route?.type === "fallback";
}
function getFallbackRoute(route, routeList) {
  const fallbackRoute = routeList.find((r) => {
    if (route.route === "/" && r.routeData.route === "/") {
      return true;
    }
    return r.routeData.fallbackRoutes.find((f) => {
      return f.route === route.route;
    });
  });
  if (!fallbackRoute) {
    throw new Error(`No fallback route found for route ${route.route}`);
  }
  return fallbackRoute.routeData;
}
function routeHasHtmlExtension(route) {
  return route.segments.some(
    (segment) => segment.some((part) => !part.dynamic && part.content.includes(".html"))
  );
}

async function getProps(opts) {
  const {
    logger,
    mod,
    routeData: route,
    routeCache,
    pathname,
    serverLike,
    base,
    trailingSlash
  } = opts;
  if (!route || route.pathname) {
    return {};
  }
  if (routeIsRedirect(route) || routeIsFallback(route) || route.component === DEFAULT_404_COMPONENT) {
    return {};
  }
  const staticPaths = await callGetStaticPaths({
    mod,
    route,
    routeCache,
    ssr: serverLike,
    base,
    trailingSlash
  });
  const params = getParams(route, pathname);
  const matchedStaticPath = findPathItemByKey(staticPaths, params, route, logger, trailingSlash);
  if (!matchedStaticPath && (serverLike ? route.prerender : true)) {
    throw new AstroError({
      ...NoMatchingStaticPathFound,
      message: NoMatchingStaticPathFound.message(pathname),
      hint: NoMatchingStaticPathFound.hint([route.component])
    });
  }
  if (mod) {
    validatePrerenderEndpointCollision(route, mod, params);
  }
  const props = matchedStaticPath?.props ? { ...matchedStaticPath.props } : {};
  return props;
}
function getParams(route, pathname) {
  if (!route.params.length) return {};
  const path = pathname.endsWith(".html") && !routeHasHtmlExtension(route) ? pathname.slice(0, -5) : pathname;
  const allPatterns = [route, ...route.fallbackRoutes].map((r) => r.pattern);
  const paramsMatch = allPatterns.map((pattern) => pattern.exec(path)).find((x) => x);
  if (!paramsMatch) return {};
  const params = {};
  route.params.forEach((key, i) => {
    if (key.startsWith("...")) {
      params[key.slice(3)] = paramsMatch[i + 1] ? paramsMatch[i + 1] : void 0;
    } else {
      params[key] = paramsMatch[i + 1];
    }
  });
  return params;
}
function validatePrerenderEndpointCollision(route, mod, params) {
  if (route.type === "endpoint" && mod.getStaticPaths) {
    const lastSegment = route.segments[route.segments.length - 1];
    const paramValues = Object.values(params);
    const lastParam = paramValues[paramValues.length - 1];
    if (lastSegment.length === 1 && lastSegment[0].dynamic && lastParam === void 0) {
      throw new AstroError({
        ...PrerenderDynamicEndpointPathCollide,
        message: PrerenderDynamicEndpointPathCollide.message(route.route),
        hint: PrerenderDynamicEndpointPathCollide.hint(route.component),
        location: {
          file: route.component
        }
      });
    }
  }
}

function getFunctionExpression(slot) {
  if (!slot) return;
  const expressions = slot?.expressions?.filter((e) => isRenderInstruction(e) === false);
  if (expressions?.length !== 1) return;
  return expressions[0];
}
class Slots {
  #result;
  #slots;
  #logger;
  constructor(result, slots, logger) {
    this.#result = result;
    this.#slots = slots;
    this.#logger = logger;
    if (slots) {
      for (const key of Object.keys(slots)) {
        if (this[key] !== void 0) {
          throw new AstroError({
            ...ReservedSlotName,
            message: ReservedSlotName.message(key)
          });
        }
        Object.defineProperty(this, key, {
          get() {
            return true;
          },
          enumerable: true
        });
      }
    }
  }
  has(name) {
    if (!this.#slots) return false;
    return Boolean(this.#slots[name]);
  }
  async render(name, args = []) {
    if (!this.#slots || !this.has(name)) return;
    const result = this.#result;
    if (!Array.isArray(args)) {
      this.#logger.warn(
        null,
        `Expected second parameter to be an array, received a ${typeof args}. If you're trying to pass an array as a single argument and getting unexpected results, make sure you're passing your array as an item of an array. Ex: Astro.slots.render('default', [["Hello", "World"]])`
      );
    } else if (args.length > 0) {
      const slotValue = this.#slots[name];
      const component = typeof slotValue === "function" ? await slotValue(result) : await slotValue;
      const expression = getFunctionExpression(component);
      if (expression) {
        const slot = async () => typeof expression === "function" ? expression(...args) : expression;
        return await renderSlotToString(result, slot).then((res) => {
          return res;
        });
      }
      if (typeof component === "function") {
        return await renderJSX(result, component(...args)).then(
          (res) => res != null ? String(res) : res
        );
      }
    }
    const content = await renderSlotToString(result, this.#slots[name]);
    const outHTML = chunkToString(result, content);
    return outHTML;
  }
}

function sequence(...handlers) {
  const filtered = handlers.filter((h) => !!h);
  const length = filtered.length;
  if (!length) {
    return defineMiddleware((_context, next) => {
      return next();
    });
  }
  return defineMiddleware((context, next) => {
    let carriedPayload = void 0;
    return applyHandle(0, context);
    function applyHandle(i, handleContext) {
      const handle = filtered[i];
      const result = handle(handleContext, async (payload) => {
        if (i < length - 1) {
          if (payload) {
            let newRequest;
            if (payload instanceof Request) {
              newRequest = payload;
            } else if (payload instanceof URL) {
              newRequest = new Request(payload, handleContext.request.clone());
            } else {
              newRequest = new Request(
                new URL(payload, handleContext.url.origin),
                handleContext.request.clone()
              );
            }
            const oldPathname = handleContext.url.pathname;
            const pipeline = Reflect.get(handleContext, pipelineSymbol);
            const { routeData, pathname } = await pipeline.tryRewrite(
              payload,
              handleContext.request
            );
            if (pipeline.manifest.serverLike === true && handleContext.isPrerendered === false && routeData.prerender === true) {
              throw new AstroError({
                ...ForbiddenRewrite,
                message: ForbiddenRewrite.message(
                  handleContext.url.pathname,
                  pathname,
                  routeData.component
                ),
                hint: ForbiddenRewrite.hint(routeData.component)
              });
            }
            carriedPayload = payload;
            handleContext.request = newRequest;
            handleContext.url = new URL(newRequest.url);
            handleContext.params = getParams(routeData, pathname);
            handleContext.routePattern = routeData.route;
            setOriginPathname(
              handleContext.request,
              oldPathname,
              pipeline.manifest.trailingSlash,
              pipeline.manifest.buildFormat
            );
          }
          return applyHandle(i + 1, handleContext);
        } else {
          return next(payload ?? carriedPayload);
        }
      });
      return result;
    }
  });
}

function isExternalURL(url) {
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//");
}
function redirectIsExternal(redirect) {
  if (typeof redirect === "string") {
    return isExternalURL(redirect);
  } else {
    return isExternalURL(redirect.destination);
  }
}
function computeRedirectStatus(method, redirect, redirectRoute) {
  return redirectRoute && typeof redirect === "object" ? redirect.status : method === "GET" ? 301 : 308;
}
function resolveRedirectTarget(params, redirect, redirectRoute, trailingSlash) {
  if (typeof redirectRoute !== "undefined") {
    const generate = getRouteGenerator(redirectRoute.segments, trailingSlash);
    return generate(params);
  } else if (typeof redirect === "string") {
    if (redirectIsExternal(redirect)) {
      return redirect;
    } else {
      let target = redirect;
      for (const param of Object.keys(params)) {
        const paramValue = params[param];
        target = target.replace(`[${param}]`, paramValue).replace(`[...${param}]`, paramValue);
      }
      return target;
    }
  } else if (typeof redirect === "undefined") {
    return "/";
  }
  return redirect.destination;
}
async function renderRedirect(renderContext) {
  const {
    request: { method },
    routeData
  } = renderContext;
  const { redirect, redirectRoute } = routeData;
  const status = computeRedirectStatus(method, redirect, redirectRoute);
  const headers = {
    location: encodeURI(
      resolveRedirectTarget(
        renderContext.params,
        redirect,
        redirectRoute,
        renderContext.pipeline.manifest.trailingSlash
      )
    )
  };
  if (redirect && redirectIsExternal(redirect)) {
    if (typeof redirect === "string") {
      return Response.redirect(redirect, status);
    } else {
      return Response.redirect(redirect.destination, status);
    }
  }
  return new Response(null, { status, headers });
}

function matchRoute(pathname, manifest) {
  if (isRoute404(pathname)) {
    const errorRoute = manifest.routes.find((route) => isRoute404(route.route));
    if (errorRoute) return errorRoute;
  }
  if (isRoute500(pathname)) {
    const errorRoute = manifest.routes.find((route) => isRoute500(route.route));
    if (errorRoute) return errorRoute;
  }
  return manifest.routes.find((route) => {
    return route.pattern.test(pathname) || route.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(pathname));
  });
}
function isRoute404or500(route) {
  return isRoute404(route.route) || isRoute500(route.route);
}
function isRouteServerIsland(route) {
  return route.component === SERVER_ISLAND_COMPONENT;
}
function isRouteExternalRedirect(route) {
  return !!(route.type === "redirect" && route.redirect && redirectIsExternal(route.redirect));
}

function defaultSetHeaders(options) {
  const headers = new Headers();
  const directives = [];
  if (options.maxAge !== void 0) {
    directives.push(`max-age=${options.maxAge}`);
  }
  if (options.swr !== void 0) {
    directives.push(`stale-while-revalidate=${options.swr}`);
  }
  if (directives.length > 0) {
    headers.set("CDN-Cache-Control", directives.join(", "));
  }
  if (options.tags && options.tags.length > 0) {
    headers.set("Cache-Tag", options.tags.join(", "));
  }
  if (options.lastModified) {
    headers.set("Last-Modified", options.lastModified.toUTCString());
  }
  if (options.etag) {
    headers.set("ETag", options.etag);
  }
  return headers;
}
function isLiveDataEntry(value) {
  return value != null && typeof value === "object" && "id" in value && "data" in value && "cacheHint" in value;
}

const APPLY_HEADERS = /* @__PURE__ */ Symbol.for("astro:cache:apply");
const IS_ACTIVE = /* @__PURE__ */ Symbol.for("astro:cache:active");
class AstroCache {
  #options = {};
  #tags = /* @__PURE__ */ new Set();
  #disabled = false;
  #provider;
  enabled = true;
  constructor(provider) {
    this.#provider = provider;
  }
  set(input) {
    if (input === false) {
      this.#disabled = true;
      this.#tags.clear();
      this.#options = {};
      return;
    }
    this.#disabled = false;
    let options;
    if (isLiveDataEntry(input)) {
      if (!input.cacheHint) return;
      options = input.cacheHint;
    } else {
      options = input;
    }
    if ("maxAge" in options && options.maxAge !== void 0) this.#options.maxAge = options.maxAge;
    if ("swr" in options && options.swr !== void 0)
      this.#options.swr = options.swr;
    if ("etag" in options && options.etag !== void 0)
      this.#options.etag = options.etag;
    if (options.lastModified !== void 0) {
      if (!this.#options.lastModified || options.lastModified > this.#options.lastModified) {
        this.#options.lastModified = options.lastModified;
      }
    }
    if (options.tags) {
      for (const tag of options.tags) this.#tags.add(tag);
    }
  }
  get tags() {
    return [...this.#tags];
  }
  /**
   * Get the current cache options (read-only snapshot).
   * Includes all accumulated options: maxAge, swr, tags, etag, lastModified.
   */
  get options() {
    return {
      ...this.#options,
      tags: this.tags
    };
  }
  async invalidate(input) {
    if (!this.#provider) {
      throw new AstroError(CacheNotEnabled);
    }
    let options;
    if (isLiveDataEntry(input)) {
      options = { tags: input.cacheHint?.tags ?? [] };
    } else {
      options = input;
    }
    return this.#provider.invalidate(options);
  }
  /** @internal */
  [APPLY_HEADERS](response) {
    if (this.#disabled) return;
    const finalOptions = { ...this.#options, tags: this.tags };
    if (finalOptions.maxAge === void 0 && !finalOptions.tags?.length) return;
    const headers = this.#provider?.setHeaders?.(finalOptions) ?? defaultSetHeaders(finalOptions);
    for (const [key, value] of headers) {
      response.headers.set(key, value);
    }
  }
  /** @internal */
  get [IS_ACTIVE]() {
    return !this.#disabled && (this.#options.maxAge !== void 0 || this.#tags.size > 0);
  }
}
function applyCacheHeaders(cache, response) {
  if (APPLY_HEADERS in cache) {
    cache[APPLY_HEADERS](response);
  }
}

const ROUTE_DYNAMIC_SPLIT = /\[(.+?\(.+?\)|.+?)\]/;
const ROUTE_SPREAD = /^\.{3}.+$/;
function getParts(part, file) {
  const result = [];
  part.split(ROUTE_DYNAMIC_SPLIT).map((str, i) => {
    if (!str) return;
    const dynamic = i % 2 === 1;
    const [, content] = dynamic ? /([^(]+)$/.exec(str) || [null, null] : [null, str];
    if (!content || dynamic && !/^(?:\.\.\.)?[\w$]+$/.test(content)) {
      throw new Error(`Invalid route ${file} \u2014 parameter name must match /^[a-zA-Z0-9_$]+$/`);
    }
    result.push({
      content,
      dynamic,
      spread: dynamic && ROUTE_SPREAD.test(content)
    });
  });
  return result;
}

function routeComparator(a, b) {
  const commonLength = Math.min(a.segments.length, b.segments.length);
  for (let index = 0; index < commonLength; index++) {
    const aSegment = a.segments[index];
    const bSegment = b.segments[index];
    const aIsStatic = aSegment.every((part) => !part.dynamic && !part.spread);
    const bIsStatic = bSegment.every((part) => !part.dynamic && !part.spread);
    if (aIsStatic && bIsStatic) {
      const aContent = aSegment.map((part) => part.content).join("");
      const bContent = bSegment.map((part) => part.content).join("");
      if (aContent !== bContent) {
        return aContent.localeCompare(bContent);
      }
    }
    if (aIsStatic !== bIsStatic) {
      return aIsStatic ? -1 : 1;
    }
    const aAllDynamic = aSegment.every((part) => part.dynamic);
    const bAllDynamic = bSegment.every((part) => part.dynamic);
    if (aAllDynamic !== bAllDynamic) {
      return aAllDynamic ? 1 : -1;
    }
    const aHasSpread = aSegment.some((part) => part.spread);
    const bHasSpread = bSegment.some((part) => part.spread);
    if (aHasSpread !== bHasSpread) {
      return aHasSpread ? 1 : -1;
    }
  }
  const aLength = a.segments.length;
  const bLength = b.segments.length;
  if (aLength !== bLength) {
    const aEndsInRest = a.segments.at(-1)?.some((part) => part.spread);
    const bEndsInRest = b.segments.at(-1)?.some((part) => part.spread);
    if (aEndsInRest !== bEndsInRest && Math.abs(aLength - bLength) === 1) {
      if (aLength > bLength && aEndsInRest) {
        return 1;
      }
      if (bLength > aLength && bEndsInRest) {
        return -1;
      }
    }
    return aLength > bLength ? -1 : 1;
  }
  if (a.type === "endpoint" !== (b.type === "endpoint")) {
    return a.type === "endpoint" ? -1 : 1;
  }
  return a.route.localeCompare(b.route);
}

function compileCacheRoutes(routes, base, trailingSlash) {
  const compiled = Object.entries(routes).map(([path, options]) => {
    const segments = removeLeadingForwardSlash(path).split("/").filter(Boolean).map((s) => getParts(s, path));
    const pattern = getPattern(segments, base, trailingSlash);
    return { pattern, options, segments, route: path };
  });
  compiled.sort(
    (a, b) => routeComparator(
      { segments: a.segments, route: a.route, type: "page" },
      { segments: b.segments, route: b.route, type: "page" }
    )
  );
  return compiled;
}
function matchCacheRoute(pathname, compiledRoutes) {
  for (const route of compiledRoutes) {
    if (route.pattern.test(pathname)) return route.options;
  }
  return null;
}

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify$1(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify$1(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}
function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

function defineDriver(factory) {
  return factory;
}

const DRIVER_NAME = "memory";
const memory = defineDriver(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify$1(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify$1(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify$1(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const PERSIST_SYMBOL = /* @__PURE__ */ Symbol();
const DEFAULT_COOKIE_NAME = "astro-session";
const VALID_COOKIE_REGEX = /^[\w-]+$/;
const unflatten = (parsed, _) => {
  return unflatten$1(parsed, {
    URL: (href) => new URL(href)
  });
};
const stringify = (data, _) => {
  return stringify$2(data, {
    // Support URL objects
    URL: (val) => val instanceof URL && val.href
  });
};
class AstroSession {
  // The cookies object.
  #cookies;
  // The session configuration.
  #config;
  // The cookie config
  #cookieConfig;
  // The cookie name
  #cookieName;
  // The unstorage object for the session driver.
  #storage;
  #data;
  // The session ID. A v4 UUID.
  #sessionID;
  // Sessions to destroy. Needed because we won't have the old session ID after it's destroyed locally.
  #toDestroy = /* @__PURE__ */ new Set();
  // Session keys to delete. Used for partial data sets to avoid overwriting the deleted value.
  #toDelete = /* @__PURE__ */ new Set();
  // Whether the session is dirty and needs to be saved.
  #dirty = false;
  // Whether the session cookie has been set.
  #cookieSet = false;
  // Whether the session ID was sourced from a client cookie rather than freshly generated.
  #sessionIDFromCookie = false;
  // The local data is "partial" if it has not been loaded from storage yet and only
  // contains values that have been set or deleted in-memory locally.
  // We do this to avoid the need to block on loading data when it is only being set.
  // When we load the data from storage, we need to merge it with the local partial data,
  // preserving in-memory changes and deletions.
  #partial = true;
  // The driver factory function provided by the pipeline
  #driverFactory;
  static #sharedStorage = /* @__PURE__ */ new Map();
  constructor({
    cookies,
    config,
    runtimeMode,
    driverFactory,
    mockStorage
  }) {
    if (!config) {
      throw new AstroError({
        ...SessionStorageInitError,
        message: SessionStorageInitError.message(
          "No driver was defined in the session configuration and the adapter did not provide a default driver."
        )
      });
    }
    this.#cookies = cookies;
    this.#driverFactory = driverFactory;
    const { cookie: cookieConfig = DEFAULT_COOKIE_NAME, ...configRest } = config;
    let cookieConfigObject;
    if (typeof cookieConfig === "object") {
      const { name = DEFAULT_COOKIE_NAME, ...rest } = cookieConfig;
      this.#cookieName = name;
      cookieConfigObject = rest;
    } else {
      this.#cookieName = cookieConfig || DEFAULT_COOKIE_NAME;
    }
    this.#cookieConfig = {
      sameSite: "lax",
      secure: runtimeMode === "production",
      path: "/",
      ...cookieConfigObject,
      httpOnly: true
    };
    this.#config = configRest;
    if (mockStorage) {
      this.#storage = mockStorage;
    }
  }
  /**
   * Gets a session value. Returns `undefined` if the session or value does not exist.
   */
  async get(key) {
    return (await this.#ensureData()).get(key)?.data;
  }
  /**
   * Checks if a session value exists.
   */
  async has(key) {
    return (await this.#ensureData()).has(key);
  }
  /**
   * Gets all session values.
   */
  async keys() {
    return (await this.#ensureData()).keys();
  }
  /**
   * Gets all session values.
   */
  async values() {
    return [...(await this.#ensureData()).values()].map((entry) => entry.data);
  }
  /**
   * Gets all session entries.
   */
  async entries() {
    return [...(await this.#ensureData()).entries()].map(([key, entry]) => [key, entry.data]);
  }
  /**
   * Deletes a session value.
   */
  delete(key) {
    this.#data?.delete(key);
    if (this.#partial) {
      this.#toDelete.add(key);
    }
    this.#dirty = true;
  }
  /**
   * Sets a session value. The session is created if it does not exist.
   */
  set(key, value, { ttl } = {}) {
    if (!key) {
      throw new AstroError({
        ...SessionStorageSaveError,
        message: "The session key was not provided."
      });
    }
    let cloned;
    try {
      cloned = unflatten(JSON.parse(stringify(value)));
    } catch (err) {
      throw new AstroError(
        {
          ...SessionStorageSaveError,
          message: `The session data for ${key} could not be serialized.`,
          hint: "See the devalue library for all supported types: https://github.com/rich-harris/devalue"
        },
        { cause: err }
      );
    }
    if (!this.#cookieSet) {
      this.#setCookie();
      this.#cookieSet = true;
    }
    this.#data ??= /* @__PURE__ */ new Map();
    const lifetime = ttl ?? this.#config.ttl;
    const expires = typeof lifetime === "number" ? Date.now() + lifetime * 1e3 : lifetime;
    this.#data.set(key, {
      data: cloned,
      expires
    });
    this.#dirty = true;
  }
  /**
   * Destroys the session, clearing the cookie and storage if it exists.
   */
  destroy() {
    const sessionId = this.#sessionID ?? this.#cookies.get(this.#cookieName)?.value;
    if (sessionId) {
      this.#toDestroy.add(sessionId);
    }
    this.#cookies.delete(this.#cookieName, this.#cookieConfig);
    this.#sessionID = void 0;
    this.#data = void 0;
    this.#dirty = true;
  }
  /**
   * Regenerates the session, creating a new session ID. The existing session data is preserved.
   */
  async regenerate() {
    let data = /* @__PURE__ */ new Map();
    try {
      data = await this.#ensureData();
    } catch (err) {
      console.error("Failed to load session data during regeneration:", err);
    }
    const oldSessionId = this.#sessionID;
    this.#sessionID = crypto.randomUUID();
    this.#sessionIDFromCookie = false;
    this.#data = data;
    this.#dirty = true;
    await this.#setCookie();
    if (oldSessionId && this.#storage) {
      this.#storage.removeItem(oldSessionId).catch((err) => {
        console.error("Failed to remove old session data:", err);
      });
    }
  }
  // Persists the session data to storage.
  // This is called automatically at the end of the request.
  // Uses a symbol to prevent users from calling it directly.
  async [PERSIST_SYMBOL]() {
    if (!this.#dirty && !this.#toDestroy.size) {
      return;
    }
    const storage = await this.#ensureStorage();
    if (this.#dirty && this.#data) {
      const data = await this.#ensureData();
      this.#toDelete.forEach((key2) => data.delete(key2));
      const key = this.#ensureSessionID();
      let serialized;
      try {
        serialized = stringify(data);
      } catch (err) {
        throw new AstroError(
          {
            ...SessionStorageSaveError,
            message: SessionStorageSaveError.message(
              "The session data could not be serialized.",
              this.#config.driver
            )
          },
          { cause: err }
        );
      }
      await storage.setItem(key, serialized);
      this.#dirty = false;
    }
    if (this.#toDestroy.size > 0) {
      const cleanupPromises = [...this.#toDestroy].map(
        (sessionId) => storage.removeItem(sessionId).catch((err) => {
          console.error(`Failed to clean up session ${sessionId}:`, err);
        })
      );
      await Promise.all(cleanupPromises);
      this.#toDestroy.clear();
    }
  }
  get sessionID() {
    return this.#sessionID;
  }
  /**
   * Loads a session from storage with the given ID, and replaces the current session.
   * Any changes made to the current session will be lost.
   * This is not normally needed, as the session is automatically loaded using the cookie.
   * However it can be used to restore a session where the ID has been recorded somewhere
   * else (e.g. in a database).
   */
  async load(sessionID) {
    this.#sessionID = sessionID;
    this.#data = void 0;
    await this.#setCookie();
    await this.#ensureData();
  }
  /**
   * Sets the session cookie.
   */
  async #setCookie() {
    if (!VALID_COOKIE_REGEX.test(this.#cookieName)) {
      throw new AstroError({
        ...SessionStorageSaveError,
        message: "Invalid cookie name. Cookie names can only contain letters, numbers, and dashes."
      });
    }
    const value = this.#ensureSessionID();
    this.#cookies.set(this.#cookieName, value, this.#cookieConfig);
  }
  /**
   * Attempts to load the session data from storage, or creates a new data object if none exists.
   * If there is existing partial data, it will be merged into the new data object.
   */
  async #ensureData() {
    const storage = await this.#ensureStorage();
    if (this.#data && !this.#partial) {
      return this.#data;
    }
    this.#data ??= /* @__PURE__ */ new Map();
    const raw = await storage.get(this.#ensureSessionID());
    if (!raw) {
      if (this.#sessionIDFromCookie) {
        this.#sessionID = crypto.randomUUID();
        this.#sessionIDFromCookie = false;
        if (this.#cookieSet) {
          await this.#setCookie();
        }
      }
      return this.#data;
    }
    try {
      const storedMap = unflatten(raw);
      if (!(storedMap instanceof Map)) {
        await this.destroy();
        throw new AstroError({
          ...SessionStorageInitError,
          message: SessionStorageInitError.message(
            "The session data was an invalid type.",
            this.#config.driver
          )
        });
      }
      const now = Date.now();
      for (const [key, value] of storedMap) {
        const expired = typeof value.expires === "number" && value.expires < now;
        if (!this.#data.has(key) && !this.#toDelete.has(key) && !expired) {
          this.#data.set(key, value);
        }
      }
      this.#partial = false;
      return this.#data;
    } catch (err) {
      await this.destroy();
      if (err instanceof AstroError) {
        throw err;
      }
      throw new AstroError(
        {
          ...SessionStorageInitError,
          message: SessionStorageInitError.message(
            "The session data could not be parsed.",
            this.#config.driver
          )
        },
        { cause: err }
      );
    }
  }
  /**
   * Returns the session ID, generating a new one if it does not exist.
   */
  #ensureSessionID() {
    if (!this.#sessionID) {
      const cookieValue = this.#cookies.get(this.#cookieName)?.value;
      if (cookieValue) {
        this.#sessionID = cookieValue;
        this.#sessionIDFromCookie = true;
      } else {
        this.#sessionID = crypto.randomUUID();
      }
    }
    return this.#sessionID;
  }
  /**
   * Ensures the storage is initialized.
   * This is called automatically when a storage operation is needed.
   */
  async #ensureStorage() {
    if (this.#storage) {
      return this.#storage;
    }
    if (AstroSession.#sharedStorage.has(this.#config.driver)) {
      this.#storage = AstroSession.#sharedStorage.get(this.#config.driver);
      return this.#storage;
    }
    if (!this.#driverFactory) {
      throw new AstroError({
        ...SessionStorageInitError,
        message: SessionStorageInitError.message(
          "Astro could not load the driver correctly. Does it exist?",
          this.#config.driver
        )
      });
    }
    const driver = this.#driverFactory;
    try {
      this.#storage = createStorage({
        driver: {
          ...driver(this.#config.options),
          // Unused methods
          hasItem() {
            return false;
          },
          getKeys() {
            return [];
          }
        }
      });
      AstroSession.#sharedStorage.set(this.#config.driver, this.#storage);
      return this.#storage;
    } catch (err) {
      throw new AstroError(
        {
          ...SessionStorageInitError,
          message: SessionStorageInitError.message("Unknown error", this.#config.driver)
        },
        { cause: err }
      );
    }
  }
}

function validateAndDecodePathname(pathname) {
  let decoded;
  try {
    decoded = decodeURI(pathname);
  } catch (_e) {
    throw new Error("Invalid URL encoding");
  }
  const hasDecoding = decoded !== pathname;
  const decodedStillHasEncoding = /%[0-9a-fA-F]{2}/.test(decoded);
  if (hasDecoding && decodedStillHasEncoding) {
    throw new Error("Multi-level URL encoding is not allowed");
  }
  return decoded;
}

class RenderContext {
  constructor(pipeline, locals, middleware, actions, serverIslands, pathname, request, routeData, status, clientAddress, cookies = new AstroCookies(request), params = getParams(routeData, pathname), url = RenderContext.#createNormalizedUrl(request.url), props = {}, partial = void 0, shouldInjectCspMetaTags = pipeline.manifest.shouldInjectCspMetaTags, session = void 0, cache, skipMiddleware = false) {
    this.pipeline = pipeline;
    this.locals = locals;
    this.middleware = middleware;
    this.actions = actions;
    this.serverIslands = serverIslands;
    this.pathname = pathname;
    this.request = request;
    this.routeData = routeData;
    this.status = status;
    this.clientAddress = clientAddress;
    this.cookies = cookies;
    this.params = params;
    this.url = url;
    this.props = props;
    this.partial = partial;
    this.shouldInjectCspMetaTags = shouldInjectCspMetaTags;
    this.session = session;
    this.cache = cache;
    this.skipMiddleware = skipMiddleware;
  }
  static #createNormalizedUrl(requestUrl) {
    const url = new URL(requestUrl);
    try {
      url.pathname = validateAndDecodePathname(url.pathname);
    } catch {
      try {
        url.pathname = decodeURI(url.pathname);
      } catch {
      }
    }
    url.pathname = collapseDuplicateSlashes(url.pathname);
    return url;
  }
  /**
   * A flag that tells the render content if the rewriting was triggered
   */
  isRewriting = false;
  /**
   * A safety net in case of loops
   */
  counter = 0;
  result = void 0;
  static async create({
    locals = {},
    pathname,
    pipeline,
    request,
    routeData,
    clientAddress,
    status = 200,
    props,
    partial = void 0,
    shouldInjectCspMetaTags,
    skipMiddleware = false
  }) {
    const pipelineMiddleware = await pipeline.getMiddleware();
    const pipelineActions = await pipeline.getActions();
    const pipelineSessionDriver = await pipeline.getSessionDriver();
    const serverIslands = await pipeline.getServerIslands();
    setOriginPathname(
      request,
      pathname,
      pipeline.manifest.trailingSlash,
      pipeline.manifest.buildFormat
    );
    const cookies = new AstroCookies(request);
    const session = pipeline.manifest.sessionConfig && pipelineSessionDriver ? new AstroSession({
      cookies,
      config: pipeline.manifest.sessionConfig,
      runtimeMode: pipeline.runtimeMode,
      driverFactory: pipelineSessionDriver,
      mockStorage: null
    }) : void 0;
    let cache;
    if (!pipeline.cacheConfig) {
      cache = new DisabledAstroCache(pipeline.logger);
    } else if (pipeline.runtimeMode === "development") {
      cache = new NoopAstroCache();
    } else {
      const cacheProvider = await pipeline.getCacheProvider();
      cache = new AstroCache(cacheProvider);
      if (pipeline.cacheConfig?.routes) {
        if (!pipeline.compiledCacheRoutes) {
          pipeline.compiledCacheRoutes = compileCacheRoutes(
            pipeline.cacheConfig.routes,
            pipeline.manifest.base,
            pipeline.manifest.trailingSlash
          );
        }
        const matched = matchCacheRoute(pathname, pipeline.compiledCacheRoutes);
        if (matched) {
          cache.set(matched);
        }
      }
    }
    return new RenderContext(
      pipeline,
      locals,
      sequence(...pipeline.internalMiddleware, pipelineMiddleware),
      pipelineActions,
      serverIslands,
      pathname,
      request,
      routeData,
      status,
      clientAddress,
      cookies,
      void 0,
      void 0,
      props,
      partial,
      shouldInjectCspMetaTags ?? pipeline.manifest.shouldInjectCspMetaTags,
      session,
      cache,
      skipMiddleware
    );
  }
  /**
   * The main function of the RenderContext.
   *
   * Use this function to render any route known to Astro.
   * It attempts to render a route. A route can be a:
   *
   * - page
   * - redirect
   * - endpoint
   * - fallback
   */
  async render(componentInstance, slots = {}) {
    const { middleware, pipeline } = this;
    const { logger, streaming, manifest } = pipeline;
    const props = Object.keys(this.props).length > 0 ? this.props : await getProps({
      mod: componentInstance,
      routeData: this.routeData,
      routeCache: this.pipeline.routeCache,
      pathname: this.pathname,
      logger,
      serverLike: manifest.serverLike,
      base: manifest.base,
      trailingSlash: manifest.trailingSlash
    });
    const actionApiContext = this.createActionAPIContext();
    const apiContext = this.createAPIContext(props, actionApiContext);
    this.counter++;
    if (this.counter === 4) {
      return new Response("Loop Detected", {
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
        status: 508,
        statusText: "Astro detected a loop where you tried to call the rewriting logic more than four times."
      });
    }
    const lastNext = async (ctx, payload) => {
      if (payload) {
        const oldPathname = this.pathname;
        pipeline.logger.debug("router", "Called rewriting to:", payload);
        const {
          routeData,
          componentInstance: newComponent,
          pathname,
          newUrl
        } = await pipeline.tryRewrite(payload, this.request);
        if (this.pipeline.manifest.serverLike === true && this.routeData.prerender === false && routeData.prerender === true) {
          throw new AstroError({
            ...ForbiddenRewrite,
            message: ForbiddenRewrite.message(this.pathname, pathname, routeData.component),
            hint: ForbiddenRewrite.hint(routeData.component)
          });
        }
        this.routeData = routeData;
        componentInstance = newComponent;
        if (payload instanceof Request) {
          this.request = payload;
        } else {
          this.request = copyRequest(
            newUrl,
            this.request,
            // need to send the flag of the previous routeData
            routeData.prerender,
            this.pipeline.logger,
            this.routeData.route
          );
        }
        this.isRewriting = true;
        this.url = RenderContext.#createNormalizedUrl(this.request.url);
        this.params = getParams(routeData, pathname);
        this.pathname = pathname;
        this.status = 200;
        setOriginPathname(
          this.request,
          oldPathname,
          this.pipeline.manifest.trailingSlash,
          this.pipeline.manifest.buildFormat
        );
      }
      let response2;
      if (!ctx.isPrerendered && !this.skipMiddleware) {
        const { action, setActionResult, serializeActionResult } = getActionContext(ctx);
        if (action?.calledFrom === "form") {
          const actionResult = await action.handler();
          setActionResult(action.name, serializeActionResult(actionResult));
        }
      }
      switch (this.routeData.type) {
        case "endpoint": {
          response2 = await renderEndpoint(
            componentInstance,
            ctx,
            this.routeData.prerender,
            logger
          );
          break;
        }
        case "redirect":
          return renderRedirect(this);
        case "page": {
          this.result = await this.createResult(componentInstance, actionApiContext);
          try {
            response2 = await renderPage(
              this.result,
              componentInstance?.default,
              props,
              slots,
              streaming,
              this.routeData
            );
          } catch (e) {
            this.result.cancelled = true;
            throw e;
          }
          response2.headers.set(ROUTE_TYPE_HEADER, "page");
          if (this.routeData.route === "/404" || this.routeData.route === "/500") {
            response2.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
          }
          if (this.isRewriting) {
            response2.headers.set(REWRITE_DIRECTIVE_HEADER_KEY, REWRITE_DIRECTIVE_HEADER_VALUE);
          }
          break;
        }
        case "fallback": {
          return new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: "fallback" } });
        }
      }
      const responseCookies = getCookiesFromResponse(response2);
      if (responseCookies) {
        this.cookies.merge(responseCookies);
      }
      return response2;
    };
    if (isRouteExternalRedirect(this.routeData)) {
      return renderRedirect(this);
    }
    const response = this.skipMiddleware ? await lastNext(apiContext) : await callMiddleware(middleware, apiContext, lastNext);
    if (response.headers.get(ROUTE_TYPE_HEADER)) {
      response.headers.delete(ROUTE_TYPE_HEADER);
    }
    attachCookiesToResponse(response, this.cookies);
    return response;
  }
  createAPIContext(props, context) {
    const redirect = (path, status = 302) => new Response(null, { status, headers: { Location: path } });
    const rewrite = async (reroutePayload) => {
      return await this.#executeRewrite(reroutePayload);
    };
    Reflect.set(context, pipelineSymbol, this.pipeline);
    return Object.assign(context, {
      props,
      redirect,
      rewrite,
      getActionResult: createGetActionResult(context.locals),
      callAction: createCallAction(context)
    });
  }
  async #executeRewrite(reroutePayload) {
    this.pipeline.logger.debug("router", "Calling rewrite: ", reroutePayload);
    const oldPathname = this.pathname;
    const { routeData, componentInstance, newUrl, pathname } = await this.pipeline.tryRewrite(
      reroutePayload,
      this.request
    );
    const isI18nFallback = routeData.fallbackRoutes && routeData.fallbackRoutes.length > 0;
    if (this.pipeline.manifest.serverLike && !this.routeData.prerender && routeData.prerender && !isI18nFallback) {
      throw new AstroError({
        ...ForbiddenRewrite,
        message: ForbiddenRewrite.message(this.pathname, pathname, routeData.component),
        hint: ForbiddenRewrite.hint(routeData.component)
      });
    }
    this.routeData = routeData;
    if (reroutePayload instanceof Request) {
      this.request = reroutePayload;
    } else {
      this.request = copyRequest(
        newUrl,
        this.request,
        // need to send the flag of the previous routeData
        routeData.prerender,
        this.pipeline.logger,
        this.routeData.route
      );
    }
    this.url = RenderContext.#createNormalizedUrl(this.request.url);
    const newCookies = new AstroCookies(this.request);
    if (this.cookies) {
      newCookies.merge(this.cookies);
    }
    this.cookies = newCookies;
    this.params = getParams(routeData, pathname);
    this.pathname = pathname;
    this.isRewriting = true;
    this.status = 200;
    setOriginPathname(
      this.request,
      oldPathname,
      this.pipeline.manifest.trailingSlash,
      this.pipeline.manifest.buildFormat
    );
    return await this.render(componentInstance);
  }
  createActionAPIContext() {
    const renderContext = this;
    const { params, pipeline, url } = this;
    return {
      // Don't allow reassignment of cookies because it doesn't work
      get cookies() {
        return renderContext.cookies;
      },
      routePattern: this.routeData.route,
      isPrerendered: this.routeData.prerender,
      get clientAddress() {
        return renderContext.getClientAddress();
      },
      get currentLocale() {
        return renderContext.computeCurrentLocale();
      },
      generator: ASTRO_GENERATOR,
      get locals() {
        return renderContext.locals;
      },
      set locals(_) {
        throw new AstroError(LocalsReassigned);
      },
      params,
      get preferredLocale() {
        return renderContext.computePreferredLocale();
      },
      get preferredLocaleList() {
        return renderContext.computePreferredLocaleList();
      },
      request: this.request,
      site: pipeline.site,
      url,
      get originPathname() {
        return getOriginPathname(renderContext.request);
      },
      get session() {
        if (this.isPrerendered) {
          pipeline.logger.warn(
            "session",
            `context.session was used when rendering the route ${s.green(this.routePattern)}, but it is not available on prerendered routes. If you need access to sessions, make sure that the route is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your routes server-rendered by default. For more information, see https://docs.astro.build/en/guides/sessions/`
          );
          return void 0;
        }
        if (!renderContext.session) {
          pipeline.logger.warn(
            "session",
            `context.session was used when rendering the route ${s.green(this.routePattern)}, but no storage configuration was provided. Either configure the storage manually or use an adapter that provides session storage. For more information, see https://docs.astro.build/en/guides/sessions/`
          );
          return void 0;
        }
        return renderContext.session;
      },
      get cache() {
        return renderContext.cache;
      },
      get csp() {
        if (!pipeline.manifest.csp) {
          if (pipeline.runtimeMode === "production") {
            pipeline.logger.warn(
              "csp",
              `context.csp was used when rendering the route ${s.green(this.routePattern)}, but CSP was not configured. For more information, see https://docs.astro.build/en/reference/experimental-flags/csp/`
            );
          }
          return void 0;
        }
        return {
          insertDirective(payload) {
            if (renderContext?.result?.directives) {
              renderContext.result.directives = pushDirective(
                renderContext.result.directives,
                payload
              );
            } else {
              renderContext?.result?.directives.push(payload);
            }
          },
          insertScriptResource(resource) {
            renderContext.result?.scriptResources.push(resource);
          },
          insertStyleResource(resource) {
            renderContext.result?.styleResources.push(resource);
          },
          insertStyleHash(hash) {
            renderContext.result?.styleHashes.push(hash);
          },
          insertScriptHash(hash) {
            renderContext.result?.scriptHashes.push(hash);
          }
        };
      }
    };
  }
  async createResult(mod, ctx) {
    const { cookies, pathname, pipeline, routeData, status } = this;
    const { clientDirectives, inlinedScripts, compressHTML, manifest, renderers, resolve } = pipeline;
    const { links, scripts, styles } = await pipeline.headElements(routeData);
    const extraStyleHashes = [];
    const extraScriptHashes = [];
    const shouldInjectCspMetaTags = this.shouldInjectCspMetaTags;
    const cspAlgorithm = manifest.csp?.algorithm ?? "SHA-256";
    if (shouldInjectCspMetaTags) {
      for (const style of styles) {
        extraStyleHashes.push(await generateCspDigest(style.children, cspAlgorithm));
      }
      for (const script of scripts) {
        extraScriptHashes.push(await generateCspDigest(script.children, cspAlgorithm));
      }
    }
    const componentMetadata = await pipeline.componentMetadata(routeData) ?? manifest.componentMetadata;
    const headers = new Headers({ "Content-Type": "text/html" });
    const partial = typeof this.partial === "boolean" ? this.partial : Boolean(mod.partial);
    const actionResult = hasActionPayload(this.locals) ? deserializeActionResult(this.locals._actionPayload.actionResult) : void 0;
    const response = {
      status: actionResult?.error ? actionResult?.error.status : status,
      statusText: actionResult?.error ? actionResult?.error.type : "OK",
      get headers() {
        return headers;
      },
      // Disallow `Astro.response.headers = new Headers`
      set headers(_) {
        throw new AstroError(AstroResponseHeadersReassigned);
      }
    };
    const result = {
      base: manifest.base,
      userAssetsBase: manifest.userAssetsBase,
      cancelled: false,
      clientDirectives,
      inlinedScripts,
      componentMetadata,
      compressHTML,
      cookies,
      /** This function returns the `Astro` faux-global */
      createAstro: (props, slots) => this.createAstro(result, props, slots, ctx),
      links,
      params: this.params,
      partial,
      pathname,
      renderers,
      resolve,
      response,
      request: this.request,
      scripts,
      styles,
      actionResult,
      serverIslandNameMap: this.serverIslands.serverIslandNameMap ?? /* @__PURE__ */ new Map(),
      key: manifest.key,
      trailingSlash: manifest.trailingSlash,
      _experimentalQueuedRendering: {
        pool: pipeline.nodePool,
        htmlStringCache: pipeline.htmlStringCache,
        enabled: manifest.experimentalQueuedRendering?.enabled,
        poolSize: manifest.experimentalQueuedRendering?.poolSize,
        contentCache: manifest.experimentalQueuedRendering?.contentCache
      },
      _metadata: {
        hasHydrationScript: false,
        rendererSpecificHydrationScripts: /* @__PURE__ */ new Set(),
        hasRenderedHead: false,
        renderedScripts: /* @__PURE__ */ new Set(),
        hasDirectives: /* @__PURE__ */ new Set(),
        hasRenderedServerIslandRuntime: false,
        headInTree: false,
        extraHead: [],
        extraStyleHashes,
        extraScriptHashes,
        propagators: /* @__PURE__ */ new Set()
      },
      cspDestination: manifest.csp?.cspDestination ?? (routeData.prerender ? "meta" : "header"),
      shouldInjectCspMetaTags,
      cspAlgorithm,
      // The following arrays must be cloned; otherwise, they become mutable across routes.
      scriptHashes: manifest.csp?.scriptHashes ? [...manifest.csp.scriptHashes] : [],
      scriptResources: manifest.csp?.scriptResources ? [...manifest.csp.scriptResources] : [],
      styleHashes: manifest.csp?.styleHashes ? [...manifest.csp.styleHashes] : [],
      styleResources: manifest.csp?.styleResources ? [...manifest.csp.styleResources] : [],
      directives: manifest.csp?.directives ? [...manifest.csp.directives] : [],
      isStrictDynamic: manifest.csp?.isStrictDynamic ?? false,
      internalFetchHeaders: manifest.internalFetchHeaders
    };
    return result;
  }
  #astroPagePartial;
  /**
   * The Astro global is sourced in 3 different phases:
   * - **Static**: `.generator` and `.glob` is printed by the compiler, instantiated once per process per astro file
   * - **Page-level**: `.request`, `.cookies`, `.locals` etc. These remain the same for the duration of the request.
   * - **Component-level**: `.props`, `.slots`, and `.self` are unique to each _use_ of each component.
   *
   * The page level partial is used as the prototype of the user-visible `Astro` global object, which is instantiated once per use of a component.
   */
  createAstro(result, props, slotValues, apiContext) {
    let astroPagePartial;
    if (this.isRewriting) {
      astroPagePartial = this.#astroPagePartial = this.createAstroPagePartial(result, apiContext);
    } else {
      astroPagePartial = this.#astroPagePartial ??= this.createAstroPagePartial(result, apiContext);
    }
    const astroComponentPartial = { props, self: null };
    const Astro = Object.assign(
      Object.create(astroPagePartial),
      astroComponentPartial
    );
    let _slots;
    Object.defineProperty(Astro, "slots", {
      get: () => {
        if (!_slots) {
          _slots = new Slots(
            result,
            slotValues,
            this.pipeline.logger
          );
        }
        return _slots;
      }
    });
    return Astro;
  }
  createAstroPagePartial(result, apiContext) {
    const renderContext = this;
    const { cookies, locals, params, pipeline, url } = this;
    const { response } = result;
    const redirect = (path, status = 302) => {
      if (this.request[responseSentSymbol$1]) {
        throw new AstroError({
          ...ResponseSentError
        });
      }
      return new Response(null, { status, headers: { Location: path } });
    };
    const rewrite = async (reroutePayload) => {
      return await this.#executeRewrite(reroutePayload);
    };
    const callAction = createCallAction(apiContext);
    return {
      generator: ASTRO_GENERATOR,
      routePattern: this.routeData.route,
      isPrerendered: this.routeData.prerender,
      cookies,
      get session() {
        if (this.isPrerendered) {
          pipeline.logger.warn(
            "session",
            `Astro.session was used when rendering the route ${s.green(this.routePattern)}, but it is not available on prerendered pages. If you need access to sessions, make sure that the page is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your pages server-rendered by default. For more information, see https://docs.astro.build/en/guides/sessions/`
          );
          return void 0;
        }
        if (!renderContext.session) {
          pipeline.logger.warn(
            "session",
            `Astro.session was used when rendering the route ${s.green(this.routePattern)}, but no storage configuration was provided. Either configure the storage manually or use an adapter that provides session storage. For more information, see https://docs.astro.build/en/guides/sessions/`
          );
          return void 0;
        }
        return renderContext.session;
      },
      get cache() {
        return renderContext.cache;
      },
      get clientAddress() {
        return renderContext.getClientAddress();
      },
      get currentLocale() {
        return renderContext.computeCurrentLocale();
      },
      params,
      get preferredLocale() {
        return renderContext.computePreferredLocale();
      },
      get preferredLocaleList() {
        return renderContext.computePreferredLocaleList();
      },
      locals,
      redirect,
      rewrite,
      request: this.request,
      response,
      site: pipeline.site,
      getActionResult: createGetActionResult(locals),
      get callAction() {
        return callAction;
      },
      url,
      get originPathname() {
        return getOriginPathname(renderContext.request);
      },
      get csp() {
        if (!pipeline.manifest.csp) {
          if (pipeline.runtimeMode === "production") {
            pipeline.logger.warn(
              "csp",
              `Astro.csp was used when rendering the route ${s.green(this.routePattern)}, but CSP was not configured. For more information, see https://docs.astro.build/en/reference/experimental-flags/csp/`
            );
          }
          return void 0;
        }
        return {
          insertDirective(payload) {
            if (renderContext?.result?.directives) {
              renderContext.result.directives = pushDirective(
                renderContext.result.directives,
                payload
              );
            } else {
              renderContext?.result?.directives.push(payload);
            }
          },
          insertScriptResource(resource) {
            renderContext.result?.scriptResources.push(resource);
          },
          insertStyleResource(resource) {
            renderContext.result?.styleResources.push(resource);
          },
          insertStyleHash(hash) {
            renderContext.result?.styleHashes.push(hash);
          },
          insertScriptHash(hash) {
            renderContext.result?.scriptHashes.push(hash);
          }
        };
      }
    };
  }
  getClientAddress() {
    const { pipeline, routeData, clientAddress } = this;
    if (routeData.prerender) {
      throw new AstroError({
        ...PrerenderClientAddressNotAvailable,
        message: PrerenderClientAddressNotAvailable.message(routeData.component)
      });
    }
    if (clientAddress) {
      return clientAddress;
    }
    if (pipeline.adapterName) {
      throw new AstroError({
        ...ClientAddressNotAvailable,
        message: ClientAddressNotAvailable.message(pipeline.adapterName)
      });
    }
    throw new AstroError(StaticClientAddressNotAvailable);
  }
  /**
   * API Context may be created multiple times per request, i18n data needs to be computed only once.
   * So, it is computed and saved here on creation of the first APIContext and reused for later ones.
   */
  #currentLocale;
  computeCurrentLocale() {
    const {
      url,
      pipeline: { i18n },
      routeData
    } = this;
    if (!i18n) return;
    const { defaultLocale, locales, strategy } = i18n;
    const fallbackTo = strategy === "pathname-prefix-other-locales" || strategy === "domains-prefix-other-locales" ? defaultLocale : void 0;
    if (this.#currentLocale) {
      return this.#currentLocale;
    }
    let computedLocale;
    if (isRouteServerIsland(routeData)) {
      let referer = this.request.headers.get("referer");
      if (referer) {
        if (URL.canParse(referer)) {
          referer = new URL(referer).pathname;
        }
        computedLocale = computeCurrentLocale(referer, locales, defaultLocale);
      }
    } else {
      let pathname = routeData.pathname;
      if (!routeData.pattern.test(url.pathname)) {
        for (const fallbackRoute of routeData.fallbackRoutes) {
          if (fallbackRoute.pattern.test(url.pathname)) {
            pathname = fallbackRoute.pathname;
            break;
          }
        }
      }
      pathname = pathname && !isRoute404or500(routeData) ? pathname : url.pathname;
      computedLocale = computeCurrentLocale(pathname, locales, defaultLocale);
      if (routeData.params.length > 0) {
        const localeFromParams = computeCurrentLocaleFromParams(this.params, locales);
        if (localeFromParams) {
          computedLocale = localeFromParams;
        }
      }
    }
    this.#currentLocale = computedLocale ?? fallbackTo;
    return this.#currentLocale;
  }
  #preferredLocale;
  computePreferredLocale() {
    const {
      pipeline: { i18n },
      request
    } = this;
    if (!i18n) return;
    return this.#preferredLocale ??= computePreferredLocale(request, i18n.locales);
  }
  #preferredLocaleList;
  computePreferredLocaleList() {
    const {
      pipeline: { i18n },
      request
    } = this;
    if (!i18n) return;
    return this.#preferredLocaleList ??= computePreferredLocaleList(request, i18n.locales);
  }
}

function redirectTemplate({
  status,
  absoluteLocation,
  relativeLocation,
  from
}) {
  const delay = status === 302 ? 2 : 0;
  return `<!doctype html>
<title>Redirecting to: ${relativeLocation}</title>
<meta http-equiv="refresh" content="${delay};url=${relativeLocation}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${absoluteLocation}">
<body>
	<a href="${relativeLocation}">Redirecting ${from ? `from <code>${from}</code> ` : ""}to <code>${relativeLocation}</code></a>
</body>`;
}

function ensure404Route(manifest) {
  if (!manifest.routes.some((route) => route.route === "/404")) {
    manifest.routes.push(DEFAULT_404_ROUTE);
  }
  return manifest;
}

class Router {
  #routes;
  #base;
  #baseWithoutTrailingSlash;
  #buildFormat;
  #trailingSlash;
  constructor(routes, options) {
    this.#routes = [...routes].sort(routeComparator);
    this.#base = normalizeBase(options.base);
    this.#baseWithoutTrailingSlash = removeTrailingForwardSlash(this.#base);
    this.#buildFormat = options.buildFormat;
    this.#trailingSlash = options.trailingSlash;
  }
  /**
   * Match an input pathname against the route list.
   * If allowWithoutBase is true, a non-base-prefixed path is still considered.
   */
  match(inputPathname, { allowWithoutBase = false } = {}) {
    const normalized = getRedirectForPathname(inputPathname);
    if (normalized.redirect) {
      return { type: "redirect", location: normalized.redirect, status: 301 };
    }
    if (this.#base !== "/") {
      const baseWithSlash = `${this.#baseWithoutTrailingSlash}/`;
      if (this.#trailingSlash === "always" && (normalized.pathname === this.#baseWithoutTrailingSlash || normalized.pathname === this.#base)) {
        return { type: "redirect", location: baseWithSlash, status: 301 };
      }
      if (this.#trailingSlash === "never" && normalized.pathname === baseWithSlash) {
        return { type: "redirect", location: this.#baseWithoutTrailingSlash, status: 301 };
      }
    }
    const baseResult = stripBase(
      normalized.pathname,
      this.#base,
      this.#baseWithoutTrailingSlash,
      this.#trailingSlash
    );
    if (!baseResult) {
      if (!allowWithoutBase) {
        return { type: "none", reason: "outside-base" };
      }
    }
    let pathname = baseResult ?? normalized.pathname;
    if (this.#buildFormat === "file") {
      pathname = normalizeFileFormatPathname(pathname);
    }
    const route = this.#routes.find((candidate) => {
      if (candidate.pattern.test(pathname)) return true;
      return candidate.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(pathname));
    });
    if (!route) {
      return { type: "none", reason: "no-match" };
    }
    const params = getParams(route, pathname);
    return { type: "match", route, params, pathname };
  }
}
function normalizeBase(base) {
  if (!base) return "/";
  if (base === "/") return base;
  return prependForwardSlash$1(base);
}
function getRedirectForPathname(pathname) {
  let value = prependForwardSlash$1(pathname);
  if (value.startsWith("//")) {
    const collapsed = `/${value.replace(/^\/+/, "")}`;
    return { pathname: value, redirect: collapsed };
  }
  return { pathname: value };
}
function stripBase(pathname, base, baseWithoutTrailingSlash, trailingSlash) {
  if (base === "/") return pathname;
  const baseWithSlash = `${baseWithoutTrailingSlash}/`;
  if (pathname === baseWithoutTrailingSlash || pathname === base) {
    return trailingSlash === "always" ? null : "/";
  }
  if (pathname === baseWithSlash) {
    return trailingSlash === "never" ? null : "/";
  }
  if (pathname.startsWith(baseWithSlash)) {
    return pathname.slice(baseWithoutTrailingSlash.length);
  }
  return null;
}
function normalizeFileFormatPathname(pathname) {
  if (pathname.endsWith("/index.html")) {
    const trimmed = pathname.slice(0, -"/index.html".length);
    return trimmed === "" ? "/" : trimmed;
  }
  if (pathname.endsWith(".html")) {
    const trimmed = pathname.slice(0, -".html".length);
    return trimmed === "" ? "/" : trimmed;
  }
  return pathname;
}

class BaseApp {
  manifest;
  manifestData;
  pipeline;
  adapterLogger;
  baseWithoutTrailingSlash;
  logger;
  #router;
  constructor(manifest, streaming = true, ...args) {
    this.manifest = manifest;
    this.manifestData = { routes: manifest.routes.map((route) => route.routeData) };
    this.baseWithoutTrailingSlash = removeTrailingForwardSlash(manifest.base);
    this.pipeline = this.createPipeline(streaming, manifest, ...args);
    this.logger = new Logger({
      dest: consoleLogDestination,
      level: manifest.logLevel
    });
    this.adapterLogger = new AstroIntegrationLogger(this.logger.options, manifest.adapterName);
    ensure404Route(this.manifestData);
    this.#router = this.createRouter(this.manifestData);
  }
  async createRenderContext(payload) {
    return RenderContext.create(payload);
  }
  getAdapterLogger() {
    return this.adapterLogger;
  }
  getAllowedDomains() {
    return this.manifest.allowedDomains;
  }
  matchesAllowedDomains(forwardedHost, protocol) {
    return BaseApp.validateForwardedHost(forwardedHost, this.manifest.allowedDomains, protocol);
  }
  static validateForwardedHost(forwardedHost, allowedDomains, protocol) {
    if (!allowedDomains || allowedDomains.length === 0) {
      return false;
    }
    try {
      const testUrl = new URL(`${protocol || "https"}://${forwardedHost}`);
      return allowedDomains.some((pattern) => {
        return matchPattern(testUrl, pattern);
      });
    } catch {
      return false;
    }
  }
  set setManifestData(newManifestData) {
    this.manifestData = newManifestData;
    this.#router = this.createRouter(this.manifestData);
  }
  removeBase(pathname) {
    pathname = collapseDuplicateLeadingSlashes(pathname);
    if (pathname.startsWith(this.manifest.base)) {
      return pathname.slice(this.baseWithoutTrailingSlash.length + 1);
    }
    return pathname;
  }
  /**
   * It removes the base from the request URL, prepends it with a forward slash and attempts to decoded it.
   *
   * If the decoding fails, it logs the error and return the pathname as is.
   * @param request
   */
  getPathnameFromRequest(request) {
    const url = new URL(request.url);
    const pathname = prependForwardSlash$1(this.removeBase(url.pathname));
    try {
      return decodeURI(pathname);
    } catch (e) {
      this.getAdapterLogger().error(e.toString());
      return pathname;
    }
  }
  /**
   * Given a `Request`, it returns the `RouteData` that matches its `pathname`. By default, prerendered
   * routes aren't returned, even if they are matched.
   *
   * When `allowPrerenderedRoutes` is `true`, the function returns matched prerendered routes too.
   * @param request
   * @param allowPrerenderedRoutes
   */
  match(request, allowPrerenderedRoutes = false) {
    const url = new URL(request.url);
    if (this.manifest.assets.has(url.pathname)) return void 0;
    let pathname = this.computePathnameFromDomain(request);
    if (!pathname) {
      pathname = prependForwardSlash$1(this.removeBase(url.pathname));
    }
    const match = this.#router.match(decodeURI(pathname), { allowWithoutBase: true });
    if (match.type !== "match") return void 0;
    const routeData = match.route;
    if (allowPrerenderedRoutes) {
      return routeData;
    } else if (routeData.prerender) {
      return void 0;
    }
    return routeData;
  }
  createRouter(manifestData) {
    return new Router(manifestData.routes, {
      base: this.manifest.base,
      trailingSlash: this.manifest.trailingSlash,
      buildFormat: this.manifest.buildFormat
    });
  }
  /**
   * A matching route function to use in the development server.
   * Contrary to the `.match` function, this function resolves props and params, returning the correct
   * route based on the priority, segments. It also returns the correct, resolved pathname.
   * @param pathname
   */
  devMatch(pathname) {
    return void 0;
  }
  computePathnameFromDomain(request) {
    let pathname = void 0;
    const url = new URL(request.url);
    if (this.manifest.i18n && (this.manifest.i18n.strategy === "domains-prefix-always" || this.manifest.i18n.strategy === "domains-prefix-other-locales" || this.manifest.i18n.strategy === "domains-prefix-always-no-redirect")) {
      let host = request.headers.get("X-Forwarded-Host");
      let protocol = request.headers.get("X-Forwarded-Proto");
      if (protocol) {
        protocol = protocol + ":";
      } else {
        protocol = url.protocol;
      }
      if (!host) {
        host = request.headers.get("Host");
      }
      if (host && protocol) {
        host = host.split(":")[0];
        try {
          let locale;
          const hostAsUrl = new URL(`${protocol}//${host}`);
          for (const [domainKey, localeValue] of Object.entries(
            this.manifest.i18n.domainLookupTable
          )) {
            const domainKeyAsUrl = new URL(domainKey);
            if (hostAsUrl.host === domainKeyAsUrl.host && hostAsUrl.protocol === domainKeyAsUrl.protocol) {
              locale = localeValue;
              break;
            }
          }
          if (locale) {
            pathname = prependForwardSlash$1(
              joinPaths(normalizeTheLocale(locale), this.removeBase(url.pathname))
            );
            if (url.pathname.endsWith("/")) {
              pathname = appendForwardSlash(pathname);
            }
          }
        } catch (e) {
          this.logger.error(
            "router",
            `Astro tried to parse ${protocol}//${host} as an URL, but it threw a parsing error. Check the X-Forwarded-Host and X-Forwarded-Proto headers.`
          );
          this.logger.error("router", `Error: ${e}`);
        }
      }
    }
    return pathname;
  }
  redirectTrailingSlash(pathname) {
    const { trailingSlash } = this.manifest;
    if (pathname === "/" || isInternalPath(pathname)) {
      return pathname;
    }
    const path = collapseDuplicateTrailingSlashes(pathname, trailingSlash !== "never");
    if (path !== pathname) {
      return path;
    }
    if (trailingSlash === "ignore") {
      return pathname;
    }
    if (trailingSlash === "always" && !hasFileExtension(pathname)) {
      return appendForwardSlash(pathname);
    }
    if (trailingSlash === "never") {
      return removeTrailingForwardSlash(pathname);
    }
    return pathname;
  }
  async render(request, {
    addCookieHeader = false,
    clientAddress = Reflect.get(request, clientAddressSymbol),
    locals,
    prerenderedErrorPageFetch = fetch,
    routeData
  } = {}) {
    const timeStart = performance.now();
    const url = new URL(request.url);
    const redirect = this.redirectTrailingSlash(url.pathname);
    if (redirect !== url.pathname) {
      const status = request.method === "GET" ? 301 : 308;
      const response2 = new Response(
        redirectTemplate({
          status,
          relativeLocation: url.pathname,
          absoluteLocation: redirect,
          from: request.url
        }),
        {
          status,
          headers: {
            location: redirect + url.search
          }
        }
      );
      this.#prepareResponse(response2, { addCookieHeader });
      return response2;
    }
    if (routeData) {
      this.logger.debug(
        "router",
        "The adapter " + this.manifest.adapterName + " provided a custom RouteData for ",
        request.url
      );
      this.logger.debug("router", "RouteData");
      this.logger.debug("router", routeData);
    }
    const resolvedRenderOptions = {
      addCookieHeader,
      clientAddress,
      prerenderedErrorPageFetch,
      locals,
      routeData
    };
    if (locals) {
      if (typeof locals !== "object") {
        const error = new AstroError(LocalsNotAnObject);
        this.logger.error(null, error.stack);
        return this.renderError(request, {
          ...resolvedRenderOptions,
          // If locals are invalid, we don't want to include them when
          // rendering the error page
          locals: void 0,
          status: 500,
          error
        });
      }
    }
    if (!routeData) {
      if (this.isDev()) {
        const result = await this.devMatch(this.getPathnameFromRequest(request));
        if (result) {
          routeData = result.routeData;
        }
      } else {
        routeData = this.match(request);
      }
      this.logger.debug("router", "Astro matched the following route for " + request.url);
      this.logger.debug("router", "RouteData:\n" + routeData);
    }
    if (!routeData) {
      routeData = this.manifestData.routes.find(
        (route) => route.component === "404.astro" || route.component === DEFAULT_404_COMPONENT
      );
    }
    if (!routeData) {
      this.logger.debug("router", "Astro hasn't found routes that match " + request.url);
      this.logger.debug("router", "Here's the available routes:\n", this.manifestData);
      return this.renderError(request, {
        ...resolvedRenderOptions,
        status: 404
      });
    }
    let pathname = this.getPathnameFromRequest(request);
    if (this.isDev() && !routeHasHtmlExtension(routeData)) {
      pathname = pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
    }
    const defaultStatus = this.getDefaultStatusCode(routeData, pathname);
    let response;
    let session;
    let cache;
    try {
      const componentInstance = await this.pipeline.getComponentByRoute(routeData);
      const renderContext = await this.createRenderContext({
        pipeline: this.pipeline,
        locals,
        pathname,
        request,
        routeData,
        status: defaultStatus,
        clientAddress
      });
      session = renderContext.session;
      cache = renderContext.cache;
      if (this.pipeline.cacheProvider) {
        const cacheProvider = await this.pipeline.getCacheProvider();
        if (cacheProvider?.onRequest) {
          response = await cacheProvider.onRequest(
            {
              request,
              url: new URL(request.url)
            },
            async () => {
              const res = await renderContext.render(componentInstance);
              applyCacheHeaders(cache, res);
              return res;
            }
          );
          response.headers.delete("CDN-Cache-Control");
          response.headers.delete("Cache-Tag");
        } else {
          response = await renderContext.render(componentInstance);
          applyCacheHeaders(cache, response);
        }
      } else {
        response = await renderContext.render(componentInstance);
      }
      const isRewrite = response.headers.has(REWRITE_DIRECTIVE_HEADER_KEY);
      this.logThisRequest({
        pathname,
        method: request.method,
        statusCode: response.status,
        isRewrite,
        timeStart
      });
    } catch (err) {
      this.logger.error(null, err.stack || err.message || String(err));
      return this.renderError(request, {
        ...resolvedRenderOptions,
        status: 500,
        error: err
      });
    } finally {
      await session?.[PERSIST_SYMBOL]();
    }
    if (REROUTABLE_STATUS_CODES.includes(response.status) && // If the body isn't null, that means the user sets the 404 status
    // but uses the current route to handle the 404
    response.body === null && response.headers.get(REROUTE_DIRECTIVE_HEADER) !== "no") {
      return this.renderError(request, {
        ...resolvedRenderOptions,
        response,
        status: response.status,
        // We don't have an error to report here. Passing null means we pass nothing intentionally
        // while undefined means there's no error
        error: response.status === 500 ? null : void 0
      });
    }
    this.#prepareResponse(response, { addCookieHeader });
    return response;
  }
  #prepareResponse(response, { addCookieHeader }) {
    for (const headerName of [
      REROUTE_DIRECTIVE_HEADER,
      REWRITE_DIRECTIVE_HEADER_KEY,
      NOOP_MIDDLEWARE_HEADER,
      ROUTE_TYPE_HEADER
    ]) {
      if (response.headers.has(headerName)) {
        response.headers.delete(headerName);
      }
    }
    if (addCookieHeader) {
      for (const setCookieHeaderValue of getSetCookiesFromResponse(response)) {
        response.headers.append("set-cookie", setCookieHeaderValue);
      }
    }
    Reflect.set(response, responseSentSymbol$1, true);
  }
  setCookieHeaders(response) {
    return getSetCookiesFromResponse(response);
  }
  /**
   * Reads all the cookies written by `Astro.cookie.set()` onto the passed response.
   * For example,
   * ```ts
   * for (const cookie_ of App.getSetCookieFromResponse(response)) {
   *     const cookie: string = cookie_
   * }
   * ```
   * @param response The response to read cookies from.
   * @returns An iterator that yields key-value pairs as equal-sign-separated strings.
   */
  static getSetCookieFromResponse = getSetCookiesFromResponse;
  /**
   * If it is a known error code, try sending the according page (e.g. 404.astro / 500.astro).
   * This also handles pre-rendered /404 or /500 routes
   */
  async renderError(request, {
    status,
    response: originalResponse,
    skipMiddleware = false,
    error,
    ...resolvedRenderOptions
  }) {
    const errorRoutePath = `/${status}${this.manifest.trailingSlash === "always" ? "/" : ""}`;
    const errorRouteData = matchRoute(errorRoutePath, this.manifestData);
    const url = new URL(request.url);
    if (errorRouteData) {
      if (errorRouteData.prerender) {
        const maybeDotHtml = errorRouteData.route.endsWith(`/${status}`) ? ".html" : "";
        const statusURL = new URL(`${this.baseWithoutTrailingSlash}/${status}${maybeDotHtml}`, url);
        if (statusURL.toString() !== request.url && resolvedRenderOptions.prerenderedErrorPageFetch) {
          const response2 = await resolvedRenderOptions.prerenderedErrorPageFetch(
            statusURL.toString()
          );
          const override = { status, removeContentEncodingHeaders: true };
          const newResponse = this.mergeResponses(response2, originalResponse, override);
          this.#prepareResponse(newResponse, resolvedRenderOptions);
          return newResponse;
        }
      }
      const mod = await this.pipeline.getComponentByRoute(errorRouteData);
      let session;
      try {
        const renderContext = await this.createRenderContext({
          locals: resolvedRenderOptions.locals,
          pipeline: this.pipeline,
          skipMiddleware,
          pathname: this.getPathnameFromRequest(request),
          request,
          routeData: errorRouteData,
          status,
          props: { error },
          clientAddress: resolvedRenderOptions.clientAddress
        });
        session = renderContext.session;
        const response2 = await renderContext.render(mod);
        const newResponse = this.mergeResponses(response2, originalResponse);
        this.#prepareResponse(newResponse, resolvedRenderOptions);
        return newResponse;
      } catch {
        if (skipMiddleware === false) {
          return this.renderError(request, {
            ...resolvedRenderOptions,
            status,
            response: originalResponse,
            skipMiddleware: true
          });
        }
      } finally {
        await session?.[PERSIST_SYMBOL]();
      }
    }
    const response = this.mergeResponses(new Response(null, { status }), originalResponse);
    this.#prepareResponse(response, resolvedRenderOptions);
    return response;
  }
  mergeResponses(newResponse, originalResponse, override) {
    let newResponseHeaders = newResponse.headers;
    if (override?.removeContentEncodingHeaders) {
      newResponseHeaders = new Headers(newResponseHeaders);
      newResponseHeaders.delete("Content-Encoding");
      newResponseHeaders.delete("Content-Length");
    }
    if (!originalResponse) {
      if (override !== void 0) {
        return new Response(newResponse.body, {
          status: override.status,
          statusText: newResponse.statusText,
          headers: newResponseHeaders
        });
      }
      return newResponse;
    }
    const status = override?.status ? override.status : originalResponse.status === 200 ? newResponse.status : originalResponse.status;
    try {
      originalResponse.headers.delete("Content-type");
      originalResponse.headers.delete("Content-Length");
      originalResponse.headers.delete("Transfer-Encoding");
    } catch {
    }
    const newHeaders = new Headers();
    const seen = /* @__PURE__ */ new Set();
    for (const [name, value] of originalResponse.headers) {
      newHeaders.append(name, value);
      seen.add(name.toLowerCase());
    }
    for (const [name, value] of newResponseHeaders) {
      if (!seen.has(name.toLowerCase())) {
        newHeaders.append(name, value);
      }
    }
    const mergedResponse = new Response(newResponse.body, {
      status,
      statusText: status === 200 ? newResponse.statusText : originalResponse.statusText,
      // If you're looking at here for possible bugs, it means that it's not a bug.
      // With the middleware, users can meddle with headers, and we should pass to the 404/500.
      // If users see something weird, it's because they are setting some headers they should not.
      //
      // Although, we don't want it to replace the content-type, because the error page must return `text/html`
      headers: newHeaders
    });
    const originalCookies = getCookiesFromResponse(originalResponse);
    const newCookies = getCookiesFromResponse(newResponse);
    if (originalCookies) {
      if (newCookies) {
        for (const cookieValue of AstroCookies.consume(newCookies)) {
          originalResponse.headers.append("set-cookie", cookieValue);
        }
      }
      attachCookiesToResponse(mergedResponse, originalCookies);
    } else if (newCookies) {
      attachCookiesToResponse(mergedResponse, newCookies);
    }
    return mergedResponse;
  }
  getDefaultStatusCode(routeData, pathname) {
    if (!routeData.pattern.test(pathname)) {
      for (const fallbackRoute of routeData.fallbackRoutes) {
        if (fallbackRoute.pattern.test(pathname)) {
          return 302;
        }
      }
    }
    const route = removeTrailingForwardSlash(routeData.route);
    if (route.endsWith("/404")) return 404;
    if (route.endsWith("/500")) return 500;
    return 200;
  }
  getManifest() {
    return this.pipeline.manifest;
  }
  logThisRequest({
    pathname,
    method,
    statusCode,
    isRewrite,
    timeStart
  }) {
    const timeEnd = performance.now();
    this.logRequest({
      pathname,
      method,
      statusCode,
      isRewrite,
      reqTime: timeEnd - timeStart
    });
  }
}

function getAssetsPrefix(fileExtension, assetsPrefix) {
  let prefix = "";
  if (!assetsPrefix) {
    prefix = "";
  } else if (typeof assetsPrefix === "string") {
    prefix = assetsPrefix;
  } else {
    const dotLessFileExtension = fileExtension.slice(1);
    prefix = assetsPrefix[dotLessFileExtension] || assetsPrefix.fallback;
  }
  return prefix;
}

const URL_PARSE_BASE = "https://astro.build";
function splitAssetPath(path) {
  const parsed = new URL(path, URL_PARSE_BASE);
  const isAbsolute = URL.canParse(path);
  const pathname = !isAbsolute && !path.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
  return {
    pathname,
    suffix: `${parsed.search}${parsed.hash}`
  };
}
function createAssetLink(href, base, assetsPrefix, queryParams) {
  const { pathname, suffix } = splitAssetPath(href);
  let url = "";
  if (assetsPrefix) {
    const pf = getAssetsPrefix(fileExtension(pathname), assetsPrefix);
    url = joinPaths(pf, slash(pathname)) + suffix;
  } else if (base) {
    url = prependForwardSlash$1(joinPaths(base, slash(pathname))) + suffix;
  } else {
    url = href;
  }
  return url;
}
function createStylesheetElement(stylesheet, base, assetsPrefix, queryParams) {
  if (stylesheet.type === "inline") {
    return {
      props: {},
      children: stylesheet.content
    };
  } else {
    return {
      props: {
        rel: "stylesheet",
        href: createAssetLink(stylesheet.src, base, assetsPrefix)
      },
      children: ""
    };
  }
}
function createStylesheetElementSet(stylesheets, base, assetsPrefix, queryParams) {
  return new Set(
    stylesheets.map((s) => createStylesheetElement(s, base, assetsPrefix))
  );
}
function createModuleScriptElement(script, base, assetsPrefix, queryParams) {
  if (script.type === "external") {
    return createModuleScriptElementWithSrc(script.value, base, assetsPrefix);
  } else {
    return {
      props: {
        type: "module"
      },
      children: script.value
    };
  }
}
function createModuleScriptElementWithSrc(src, base, assetsPrefix, queryParams) {
  return {
    props: {
      type: "module",
      src: createAssetLink(src, base, assetsPrefix)
    },
    children: ""
  };
}

function createConsoleLogger(level) {
  return new Logger({
    dest: consoleLogDestination,
    level: level ?? "info"
  });
}

class AppPipeline extends Pipeline {
  getName() {
    return "AppPipeline";
  }
  static create({ manifest, streaming }) {
    const resolve = async function resolve2(specifier) {
      if (!(specifier in manifest.entryModules)) {
        throw new Error(`Unable to resolve [${specifier}]`);
      }
      const bundlePath = manifest.entryModules[specifier];
      if (bundlePath.startsWith("data:") || bundlePath.length === 0) {
        return bundlePath;
      } else {
        return createAssetLink(bundlePath, manifest.base, manifest.assetsPrefix);
      }
    };
    const logger = createConsoleLogger(manifest.logLevel);
    const pipeline = new AppPipeline(
      logger,
      manifest,
      "production",
      manifest.renderers,
      resolve,
      streaming,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0
    );
    return pipeline;
  }
  async headElements(routeData) {
    const { assetsPrefix, base } = this.manifest;
    const routeInfo = this.manifest.routes.find(
      (route) => route.routeData.route === routeData.route
    );
    const links = /* @__PURE__ */ new Set();
    const scripts = /* @__PURE__ */ new Set();
    const styles = createStylesheetElementSet(routeInfo?.styles ?? [], base, assetsPrefix);
    for (const script of routeInfo?.scripts ?? []) {
      if ("stage" in script) {
        if (script.stage === "head-inline") {
          scripts.add({
            props: {},
            children: script.children
          });
        }
      } else {
        scripts.add(createModuleScriptElement(script, base, assetsPrefix));
      }
    }
    return { links, styles, scripts };
  }
  componentMetadata() {
  }
  async getComponentByRoute(routeData) {
    const module = await this.getModuleForRoute(routeData);
    return module.page();
  }
  async getModuleForRoute(route) {
    for (const defaultRoute of this.defaultRoutes) {
      if (route.component === defaultRoute.component) {
        return {
          page: () => Promise.resolve(defaultRoute.instance)
        };
      }
    }
    let routeToProcess = route;
    if (routeIsRedirect(route)) {
      if (route.redirectRoute) {
        routeToProcess = route.redirectRoute;
      } else {
        return RedirectSinglePageBuiltModule;
      }
    } else if (routeIsFallback(route)) {
      routeToProcess = getFallbackRoute(route, this.manifest.routes);
    }
    if (this.manifest.pageMap) {
      const importComponentInstance = this.manifest.pageMap.get(routeToProcess.component);
      if (!importComponentInstance) {
        throw new Error(
          `Unexpectedly unable to find a component instance for route ${route.route}`
        );
      }
      return await importComponentInstance();
    } else if (this.manifest.pageModule) {
      return this.manifest.pageModule;
    }
    throw new Error(
      "Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error, please file an issue."
    );
  }
  async tryRewrite(payload, request) {
    const { newUrl, pathname, routeData } = findRouteToRewrite({
      payload,
      request,
      routes: this.manifest?.routes.map((r) => r.routeData),
      trailingSlash: this.manifest.trailingSlash,
      buildFormat: this.manifest.buildFormat,
      base: this.manifest.base,
      outDir: this.manifest?.serverLike ? this.manifest.buildClientDir : this.manifest.outDir
    });
    const componentInstance = await this.getComponentByRoute(routeData);
    return { newUrl, pathname, componentInstance, routeData };
  }
}

class App extends BaseApp {
  createPipeline(streaming) {
    return AppPipeline.create({
      manifest: this.manifest,
      streaming
    });
  }
  isDev() {
    return false;
  }
  // Should we log something for our users?
  logRequest(_options) {
  }
}

const renderers = [];

const serializedData = [{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","distURL":[],"_meta":{"trailingSlash":"ignore"}}}];
				serializedData.map(deserializeRouteInfo);

const pageMap = new Map([
    
]);

const _manifest = deserializeManifest(({"rootDir":"file:///home/felixicaza/dev/astro-aura/tests/fixtures/ssr-node-custom-base/","cacheDir":"file:///home/felixicaza/dev/astro-aura/tests/fixtures/ssr-node-custom-base/node_modules/.astro/","outDir":"file:///home/felixicaza/dev/astro-aura/tests/fixtures/ssr-node-custom-base/dist/","srcDir":"file:///home/felixicaza/dev/astro-aura/tests/fixtures/ssr-node-custom-base/src/","publicDir":"file:///home/felixicaza/dev/astro-aura/tests/fixtures/ssr-node-custom-base/public/","buildClientDir":"file:///home/felixicaza/dev/astro-aura/tests/fixtures/ssr-node-custom-base/dist/client/","buildServerDir":"file:///home/felixicaza/dev/astro-aura/tests/fixtures/ssr-node-custom-base/dist/server/","adapterName":"@astrojs/node","assetsDir":"_weird-name1","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","distURL":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"inline","content":"[data-astro-lqip]{--opacity:1;--z-index:0;width:fit-content;height:fit-content;display:inline-block;position:relative}[data-astro-lqip]:after{content:\"\";pointer-events:none;width:100%;height:100%;opacity:var(--opacity);z-index:var(--z-index);background:var(--lqip-background);background-position:50%;background-size:cover;transition:opacity 1s;position:absolute;inset:0}[data-astro-lqip] img{z-index:1;position:relative;overflow:hidden}@media(scripting:none){[data-astro-lqip]{--opacity:0;--z-index:1}}[data-astro-lqip-bg]{display:contents}section[data-astro-cid-j7pv25f6]{background:var(--background)}.custom-background[data-astro-cid-j7pv25f6]{background:var(--custom-background)}section[data-astro-cid-j7pv25f6],.custom-background[data-astro-cid-j7pv25f6]{background-size:cover;background-position:center;width:100%;height:300px}\n"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"serverLike":true,"middlewareMode":"classic","base":"/new-base","trailingSlash":"ignore","compressHTML":false,"experimentalQueuedRendering":{"enabled":false,"poolSize":0,"contentCache":false},"componentMetadata":[["/home/felixicaza/dev/astro-aura/tests/fixtures/ssr-node-custom-base/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000virtual:astro:actions/noop-entrypoint":"chunks/noop-entrypoint_BOlrdqWF.mjs","\u0000noop-middleware":"virtual_astro_middleware.mjs","\u0000virtual:astro:session-driver":"chunks/_virtual_astro_session-driver_CqFkrO5f.mjs","\u0000virtual:astro:server-island-manifest":"chunks/_virtual_astro_server-island-manifest_CQQ1F5PF.mjs","/home/felixicaza/dev/astro-aura/node_modules/.pnpm/astro@6.1.2_@types+node@25.5.0_jiti@2.6.1_lightningcss@1.32.0_rollup@4.60.1_typescript@5.9.3_yaml@2.8.3/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_CJ_cjCH-.mjs","astro/entrypoints/prerender":"prerender-entry.D9w86fp9.mjs","@astrojs/node/server.js":"entry.mjs","virtual:astro:noop":"_weird-name1/_virtual_astro_noop.hkMvWsZl.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/new-base/_weird-name1/pexels-fabianwiktor-3470482.BFMY_gvF.jpg","/new-base/_weird-name1/pexels-fabianwiktor-3470872.DAdQtAbe.jpg","/new-base/index.html"],"buildFormat":"directory","checkOrigin":true,"actionBodySizeLimit":1048576,"serverIslandBodySizeLimit":1048576,"allowedDomains":[],"key":"0oO/AFPe1XNLYmIOR8wleIHQZD8TgOblt51HbGD3OiU=","sessionConfig":{"driver":"unstorage/drivers/fs-lite","options":{"base":"/home/felixicaza/dev/astro-aura/tests/fixtures/ssr-node-custom-base/node_modules/.astro/sessions"}},"image":{},"devToolbar":{"enabled":false,"debugInfoOutput":""},"logLevel":"info","shouldInjectCspMetaTags":false}));
					const manifestRoutes = _manifest.routes;
					
					const manifest = Object.assign(_manifest, {
					  renderers,
					  actions: () => import('./chunks/noop-entrypoint_BOlrdqWF.mjs'),
					  middleware: () => import('./virtual_astro_middleware.mjs'),
					  sessionDriver: () => import('./chunks/_virtual_astro_session-driver_CqFkrO5f.mjs'),
					  
					  serverIslandMappings: () => import('./chunks/_virtual_astro_server-island-manifest_CQQ1F5PF.mjs'),
					  routes: manifestRoutes,
					  pageMap,
					});

const createApp$1 = ({ streaming } = {}) => {
  return new App(manifest, streaming);
};

const createApp = createApp$1;

const mode = "standalone";
const client = "file:///home/felixicaza/dev/astro-aura/tests/fixtures/ssr-node-custom-base/dist/client/";
const server = "file:///home/felixicaza/dev/astro-aura/tests/fixtures/ssr-node-custom-base/dist/server/";
const host = false;
const port = 4321;
const staticHeaders = false;
const bodySizeLimit = 1073741824;
const experimentalDisableStreaming = false;

const options = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  bodySizeLimit,
  client,
  experimentalDisableStreaming,
  host,
  mode,
  port,
  server,
  staticHeaders
}, Symbol.toStringTag, { value: 'Module' }));

const createOutgoingHttpHeaders = (headers) => {
  if (!headers) {
    return void 0;
  }
  const nodeHeaders = Object.fromEntries(headers.entries());
  if (Object.keys(nodeHeaders).length === 0) {
    return void 0;
  }
  if (headers.has("set-cookie")) {
    const cookieHeaders = headers.getSetCookie();
    if (cookieHeaders.length > 1) {
      nodeHeaders["set-cookie"] = cookieHeaders;
    }
  }
  return nodeHeaders;
};

function getFirstForwardedValue(multiValueHeader) {
  return multiValueHeader?.toString().split(",").map((e) => e.trim())[0];
}
function sanitizeHost(hostname) {
  if (!hostname) return void 0;
  if (/[/\\]/.test(hostname)) return void 0;
  return hostname;
}
function parseHost(host) {
  const parts = host.split(":");
  return {
    hostname: parts[0],
    port: parts[1]
  };
}
function matchesAllowedDomains(hostname, protocol, port, allowedDomains) {
  const hostWithPort = port ? `${hostname}:${port}` : hostname;
  const urlString = `${protocol}://${hostWithPort}`;
  if (!URL.canParse(urlString)) {
    return false;
  }
  const testUrl = new URL(urlString);
  return allowedDomains.some((pattern) => matchPattern(testUrl, pattern));
}
function validateHost(host, protocol, allowedDomains) {
  if (!host || host.length === 0) return void 0;
  if (!allowedDomains || allowedDomains.length === 0) return void 0;
  const sanitized = sanitizeHost(host);
  if (!sanitized) return void 0;
  const { hostname, port } = parseHost(sanitized);
  if (matchesAllowedDomains(hostname, protocol, port, allowedDomains)) {
    return sanitized;
  }
  return void 0;
}
function validateForwardedHeaders(forwardedProtocol, forwardedHost, forwardedPort, allowedDomains) {
  const result = {};
  if (forwardedProtocol) {
    if (allowedDomains && allowedDomains.length > 0) {
      const hasProtocolPatterns = allowedDomains.some((pattern) => pattern.protocol !== void 0);
      if (hasProtocolPatterns) {
        try {
          const testUrl = new URL(`${forwardedProtocol}://example.com`);
          const isAllowed = allowedDomains.some(
            (pattern) => matchPattern(testUrl, { protocol: pattern.protocol })
          );
          if (isAllowed) {
            result.protocol = forwardedProtocol;
          }
        } catch {
        }
      } else if (/^https?$/.test(forwardedProtocol)) {
        result.protocol = forwardedProtocol;
      }
    }
  }
  if (forwardedPort && allowedDomains && allowedDomains.length > 0) {
    const hasPortPatterns = allowedDomains.some((pattern) => pattern.port !== void 0);
    if (hasPortPatterns) {
      const isAllowed = allowedDomains.some((pattern) => pattern.port === forwardedPort);
      if (isAllowed) {
        result.port = forwardedPort;
      }
    }
  }
  if (forwardedHost && forwardedHost.length > 0 && allowedDomains && allowedDomains.length > 0) {
    const protoForValidation = result.protocol || "https";
    const sanitized = sanitizeHost(forwardedHost);
    if (sanitized) {
      const { hostname, port: portFromHost } = parseHost(sanitized);
      const portForValidation = result.port || portFromHost;
      if (matchesAllowedDomains(hostname, protoForValidation, portForValidation, allowedDomains)) {
        result.host = sanitized;
      }
    }
  }
  return result;
}

function createRequest(req, {
  skipBody = false,
  allowedDomains = [],
  bodySizeLimit,
  port: serverPort
} = {}) {
  const controller = new AbortController();
  const isEncrypted = "encrypted" in req.socket && req.socket.encrypted;
  const providedProtocol = isEncrypted ? "https" : "http";
  const untrustedHostname = req.headers.host ?? req.headers[":authority"];
  const validated = validateForwardedHeaders(
    getFirstForwardedValue(req.headers["x-forwarded-proto"]),
    getFirstForwardedValue(req.headers["x-forwarded-host"]),
    getFirstForwardedValue(req.headers["x-forwarded-port"]),
    allowedDomains
  );
  const protocol = validated.protocol ?? providedProtocol;
  const validatedHostname = validateHost(
    typeof untrustedHostname === "string" ? untrustedHostname : void 0,
    protocol,
    allowedDomains
  );
  const hostname = validated.host ?? validatedHostname ?? "localhost";
  const port = validated.port ?? (!validated.host && !validatedHostname && serverPort ? String(serverPort) : void 0);
  let url;
  try {
    const hostnamePort = getHostnamePort(hostname, port);
    url = new URL(`${protocol}://${hostnamePort}${req.url}`);
  } catch {
    const hostnamePort = getHostnamePort(hostname, port);
    url = new URL(`${protocol}://${hostnamePort}`);
  }
  const options = {
    method: req.method || "GET",
    headers: makeRequestHeaders(req),
    signal: controller.signal
  };
  const bodyAllowed = options.method !== "HEAD" && options.method !== "GET" && skipBody === false;
  if (bodyAllowed) {
    Object.assign(options, makeRequestBody(req, bodySizeLimit));
  }
  const request = new Request(url, options);
  const socket = getRequestSocket(req);
  if (socket && typeof socket.on === "function") {
    const existingCleanup = getAbortControllerCleanup(req);
    if (existingCleanup) {
      existingCleanup();
    }
    let cleanedUp = false;
    const removeSocketListener = () => {
      if (typeof socket.off === "function") {
        socket.off("close", onSocketClose);
      } else if (typeof socket.removeListener === "function") {
        socket.removeListener("close", onSocketClose);
      }
    };
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      removeSocketListener();
      controller.signal.removeEventListener("abort", cleanup);
      Reflect.deleteProperty(req, nodeRequestAbortControllerCleanupSymbol);
    };
    const onSocketClose = () => {
      cleanup();
      if (!controller.signal.aborted) {
        controller.abort();
      }
    };
    socket.on("close", onSocketClose);
    controller.signal.addEventListener("abort", cleanup, { once: true });
    Reflect.set(req, nodeRequestAbortControllerCleanupSymbol, cleanup);
    if (socket.destroyed) {
      onSocketClose();
    }
  }
  const hostValidated = validated.host !== void 0 || validatedHostname !== void 0;
  const forwardedClientIp = hostValidated ? getFirstForwardedValue(req.headers["x-forwarded-for"]) : void 0;
  const clientIp = forwardedClientIp || req.socket?.remoteAddress;
  if (clientIp) {
    Reflect.set(request, clientAddressSymbol, clientIp);
  }
  return request;
}
async function writeResponse(source, destination) {
  const { status, headers, body, statusText } = source;
  if (!(destination instanceof Http2ServerResponse)) {
    destination.statusMessage = statusText;
  }
  destination.writeHead(status, createOutgoingHttpHeaders(headers));
  const cleanupAbortFromDestination = getAbortControllerCleanup(
    destination.req ?? void 0
  );
  if (cleanupAbortFromDestination) {
    const runCleanup = () => {
      cleanupAbortFromDestination();
      if (typeof destination.off === "function") {
        destination.off("finish", runCleanup);
        destination.off("close", runCleanup);
      } else {
        destination.removeListener?.("finish", runCleanup);
        destination.removeListener?.("close", runCleanup);
      }
    };
    destination.on("finish", runCleanup);
    destination.on("close", runCleanup);
  }
  if (!body) return destination.end();
  try {
    const reader = body.getReader();
    destination.on("close", () => {
      reader.cancel().catch((err) => {
        console.error(
          `There was an uncaught error in the middle of the stream while rendering ${destination.req.url}.`,
          err
        );
      });
    });
    let result = await reader.read();
    while (!result.done) {
      destination.write(result.value);
      result = await reader.read();
    }
    destination.end();
  } catch (err) {
    destination.write("Internal server error", () => {
      err instanceof Error ? destination.destroy(err) : destination.destroy();
    });
  }
}
function getHostnamePort(hostname, port) {
  const portInHostname = typeof hostname === "string" && /:\d+$/.test(hostname);
  const hostnamePort = portInHostname ? hostname : `${hostname}${port ? `:${port}` : ""}`;
  return hostnamePort;
}
function makeRequestHeaders(req) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === void 0) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else {
      headers.append(name, value);
    }
  }
  return headers;
}
function makeRequestBody(req, bodySizeLimit) {
  if (req.body !== void 0) {
    if (typeof req.body === "string" && req.body.length > 0) {
      return { body: Buffer.from(req.body) };
    }
    if (typeof req.body === "object" && req.body !== null && Object.keys(req.body).length > 0) {
      return { body: Buffer.from(JSON.stringify(req.body)) };
    }
    if (typeof req.body === "object" && req.body !== null && typeof req.body[Symbol.asyncIterator] !== "undefined") {
      return asyncIterableToBodyProps(req.body, bodySizeLimit);
    }
  }
  return asyncIterableToBodyProps(req, bodySizeLimit);
}
function asyncIterableToBodyProps(iterable, bodySizeLimit) {
  const source = bodySizeLimit != null ? limitAsyncIterable(iterable, bodySizeLimit) : iterable;
  return {
    // Node uses undici for the Request implementation. Undici accepts
    // a non-standard async iterable for the body.
    // @ts-expect-error
    body: source,
    // The duplex property is required when using a ReadableStream or async
    // iterable for the body. The type definitions do not include the duplex
    // property because they are not up-to-date.
    duplex: "half"
  };
}
async function* limitAsyncIterable(iterable, limit) {
  let received = 0;
  for await (const chunk of iterable) {
    const byteLength = chunk instanceof Uint8Array ? chunk.byteLength : typeof chunk === "string" ? Buffer.byteLength(chunk) : 0;
    received += byteLength;
    if (received > limit) {
      throw new Error(`Body size limit exceeded: received more than ${limit} bytes`);
    }
    yield chunk;
  }
}
function getAbortControllerCleanup(req) {
  if (!req) return void 0;
  const cleanup = Reflect.get(req, nodeRequestAbortControllerCleanupSymbol);
  return typeof cleanup === "function" ? cleanup : void 0;
}
function getRequestSocket(req) {
  if (req.socket && typeof req.socket.on === "function") {
    return req.socket;
  }
  const http2Socket = req.stream?.session?.socket;
  if (http2Socket && typeof http2Socket.on === "function") {
    return http2Socket;
  }
  return void 0;
}

function resolveClientDir(options) {
  const clientURLRaw = new URL(options.client);
  const serverURLRaw = new URL(options.server);
  const rel = path.relative(url.fileURLToPath(serverURLRaw), url.fileURLToPath(clientURLRaw));
  const serverFolder = path.basename(options.server);
  let serverEntryFolderURL = path.dirname(import.meta.url);
  let previous = "";
  while (!serverEntryFolderURL.endsWith(serverFolder)) {
    if (serverEntryFolderURL === previous) {
      throw new Error(
        `[@astrojs/node] Could not find the server directory "${serverFolder}" by walking up from "${import.meta.url}". This can happen when the server entry point is bundled into a single file (e.g. with esbuild) so that import.meta.url no longer contains the original "${serverFolder}" path segment. When bundling the server entry, make sure the output path contains a "${serverFolder}" directory segment, or avoid bundling the server entry entirely.`
      );
    }
    previous = serverEntryFolderURL;
    serverEntryFolderURL = path.dirname(serverEntryFolderURL);
  }
  const serverEntryURL = serverEntryFolderURL + "/entry.mjs";
  const clientURL = new URL(appendForwardSlash(rel), serverEntryURL);
  return url.fileURLToPath(clientURL);
}

async function readErrorPageFromDisk(client, status) {
  const filePaths = [`${status}.html`, `${status}/index.html`];
  for (const filePath of filePaths) {
    const fullPath = path.join(client, filePath);
    let stream;
    try {
      stream = createReadStream(fullPath);
      await new Promise((resolve, reject) => {
        stream.once("open", () => resolve());
        stream.once("error", reject);
      });
      const webStream = Readable.toWeb(stream);
      return new Response(webStream, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    } catch {
      stream?.destroy();
    }
  }
  return void 0;
}
function createAppHandler(app, options) {
  const als = new AsyncLocalStorage();
  const logger = app.getAdapterLogger();
  process.on("unhandledRejection", (reason) => {
    const requestUrl = als.getStore();
    logger.error(`Unhandled rejection while rendering ${requestUrl}`);
    console.error(reason);
  });
  const client = resolveClientDir(options);
  const prerenderedErrorPageFetch = async (url) => {
    const { pathname } = new URL(url);
    if (pathname.endsWith("/404.html") || pathname.endsWith("/404/index.html")) {
      const response = await readErrorPageFromDisk(client, 404);
      if (response) return response;
    }
    if (pathname.endsWith("/500.html") || pathname.endsWith("/500/index.html")) {
      const response = await readErrorPageFromDisk(client, 500);
      if (response) return response;
    }
    return new Response(null, { status: 404 });
  };
  const effectiveBodySizeLimit = options.bodySizeLimit === 0 || options.bodySizeLimit === Number.POSITIVE_INFINITY ? void 0 : options.bodySizeLimit;
  return async (req, res, next, locals) => {
    let request;
    try {
      request = createRequest(req, {
        allowedDomains: app.getAllowedDomains?.() ?? [],
        bodySizeLimit: effectiveBodySizeLimit,
        port: options.port
      });
    } catch (err) {
      logger.error(`Could not render ${req.url}`);
      console.error(err);
      res.statusCode = 500;
      res.end("Internal Server Error");
      return;
    }
    const routeData = app.match(request, true);
    if (routeData && !(routeData.type === "page" && routeData.prerender)) {
      const response = await als.run(
        request.url,
        () => app.render(request, {
          addCookieHeader: true,
          locals,
          routeData,
          prerenderedErrorPageFetch
        })
      );
      await writeResponse(response, res);
    } else if (next) {
      const cleanup = getAbortControllerCleanup(req);
      if (cleanup) cleanup();
      return next();
    } else {
      const response = await app.render(request, {
        addCookieHeader: true,
        prerenderedErrorPageFetch
      });
      await writeResponse(response, res);
    }
  };
}

var serverDestroy;
var hasRequiredServerDestroy;

function requireServerDestroy () {
	if (hasRequiredServerDestroy) return serverDestroy;
	hasRequiredServerDestroy = 1;
	serverDestroy = enableDestroy;

	function enableDestroy(server) {
	  var connections = {};

	  server.on('connection', function(conn) {
	    var key = conn.remoteAddress + ':' + conn.remotePort;
	    connections[key] = conn;
	    conn.on('close', function() {
	      delete connections[key];
	    });
	  });

	  server.destroy = function(cb) {
	    server.close(cb);
	    for (var key in connections)
	      connections[key].destroy();
	  };
	}
	return serverDestroy;
}

var serverDestroyExports = requireServerDestroy();
const enableDestroy = /*@__PURE__*/getDefaultExportFromCjs(serverDestroyExports);

const wildcardHosts = /* @__PURE__ */ new Set(["0.0.0.0", "::", "0000:0000:0000:0000:0000:0000:0000:0000"]);
async function logListeningOn(logger, server, configuredHost) {
  await new Promise((resolve) => server.once("listening", resolve));
  const protocol = server instanceof https.Server ? "https" : "http";
  const host = getResolvedHostForHttpServer(configuredHost);
  const { port } = server.address();
  const address = getNetworkAddress(protocol, host, port);
  if (host === void 0 || wildcardHosts.has(host)) {
    logger.info(
      `Server listening on 
  local: ${address.local[0]} 	
  network: ${address.network[0]}
`
    );
  } else {
    logger.info(`Server listening on ${address.local[0]}`);
  }
}
function getResolvedHostForHttpServer(host) {
  if (host === false) {
    return "localhost";
  } else if (host === true) {
    return void 0;
  } else {
    return host;
  }
}
function getNetworkAddress(protocol = "http", hostname, port, base) {
  const NetworkAddress = {
    local: [],
    network: []
  };
  Object.values(os.networkInterfaces()).flatMap((nInterface) => nInterface ?? []).filter((detail) => detail && detail.address && detail.family === "IPv4").forEach((detail) => {
    let host = detail.address.replace(
      "127.0.0.1",
      hostname === void 0 || wildcardHosts.has(hostname) ? "localhost" : hostname
    );
    if (host.includes(":")) {
      host = `[${host}]`;
    }
    const url = `${protocol}://${host}:${port}${""}`;
    if (detail.address.includes("127.0.0.1")) {
      NetworkAddress.local.push(url);
    } else {
      NetworkAddress.network.push(url);
    }
  });
  return NetworkAddress;
}

var httpErrors = {exports: {}};

/*!
 * depd
 * Copyright(c) 2014-2018 Douglas Christopher Wilson
 * MIT Licensed
 */

var depd_1;
var hasRequiredDepd;

function requireDepd () {
	if (hasRequiredDepd) return depd_1;
	hasRequiredDepd = 1;
	/**
	 * Module dependencies.
	 */

	var relative = require$$0$2.relative;

	/**
	 * Module exports.
	 */

	depd_1 = depd;

	/**
	 * Get the path to base files on.
	 */

	var basePath = process.cwd();

	/**
	 * Determine if namespace is contained in the string.
	 */

	function containsNamespace (str, namespace) {
	  var vals = str.split(/[ ,]+/);
	  var ns = String(namespace).toLowerCase();

	  for (var i = 0; i < vals.length; i++) {
	    var val = vals[i];

	    // namespace contained
	    if (val && (val === '*' || val.toLowerCase() === ns)) {
	      return true
	    }
	  }

	  return false
	}

	/**
	 * Convert a data descriptor to accessor descriptor.
	 */

	function convertDataDescriptorToAccessor (obj, prop, message) {
	  var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
	  var value = descriptor.value;

	  descriptor.get = function getter () { return value };

	  if (descriptor.writable) {
	    descriptor.set = function setter (val) { return (value = val) };
	  }

	  delete descriptor.value;
	  delete descriptor.writable;

	  Object.defineProperty(obj, prop, descriptor);

	  return descriptor
	}

	/**
	 * Create arguments string to keep arity.
	 */

	function createArgumentsString (arity) {
	  var str = '';

	  for (var i = 0; i < arity; i++) {
	    str += ', arg' + i;
	  }

	  return str.substr(2)
	}

	/**
	 * Create stack string from stack.
	 */

	function createStackString (stack) {
	  var str = this.name + ': ' + this.namespace;

	  if (this.message) {
	    str += ' deprecated ' + this.message;
	  }

	  for (var i = 0; i < stack.length; i++) {
	    str += '\n    at ' + stack[i].toString();
	  }

	  return str
	}

	/**
	 * Create deprecate for namespace in caller.
	 */

	function depd (namespace) {
	  if (!namespace) {
	    throw new TypeError('argument namespace is required')
	  }

	  var stack = getStack();
	  var site = callSiteLocation(stack[1]);
	  var file = site[0];

	  function deprecate (message) {
	    // call to self as log
	    log.call(deprecate, message);
	  }

	  deprecate._file = file;
	  deprecate._ignored = isignored(namespace);
	  deprecate._namespace = namespace;
	  deprecate._traced = istraced(namespace);
	  deprecate._warned = Object.create(null);

	  deprecate.function = wrapfunction;
	  deprecate.property = wrapproperty;

	  return deprecate
	}

	/**
	 * Determine if event emitter has listeners of a given type.
	 *
	 * The way to do this check is done three different ways in Node.js >= 0.8
	 * so this consolidates them into a minimal set using instance methods.
	 *
	 * @param {EventEmitter} emitter
	 * @param {string} type
	 * @returns {boolean}
	 * @private
	 */

	function eehaslisteners (emitter, type) {
	  var count = typeof emitter.listenerCount !== 'function'
	    ? emitter.listeners(type).length
	    : emitter.listenerCount(type);

	  return count > 0
	}

	/**
	 * Determine if namespace is ignored.
	 */

	function isignored (namespace) {
	  if (process.noDeprecation) {
	    // --no-deprecation support
	    return true
	  }

	  var str = process.env.NO_DEPRECATION || '';

	  // namespace ignored
	  return containsNamespace(str, namespace)
	}

	/**
	 * Determine if namespace is traced.
	 */

	function istraced (namespace) {
	  if (process.traceDeprecation) {
	    // --trace-deprecation support
	    return true
	  }

	  var str = process.env.TRACE_DEPRECATION || '';

	  // namespace traced
	  return containsNamespace(str, namespace)
	}

	/**
	 * Display deprecation message.
	 */

	function log (message, site) {
	  var haslisteners = eehaslisteners(process, 'deprecation');

	  // abort early if no destination
	  if (!haslisteners && this._ignored) {
	    return
	  }

	  var caller;
	  var callFile;
	  var callSite;
	  var depSite;
	  var i = 0;
	  var seen = false;
	  var stack = getStack();
	  var file = this._file;

	  if (site) {
	    // provided site
	    depSite = site;
	    callSite = callSiteLocation(stack[1]);
	    callSite.name = depSite.name;
	    file = callSite[0];
	  } else {
	    // get call site
	    i = 2;
	    depSite = callSiteLocation(stack[i]);
	    callSite = depSite;
	  }

	  // get caller of deprecated thing in relation to file
	  for (; i < stack.length; i++) {
	    caller = callSiteLocation(stack[i]);
	    callFile = caller[0];

	    if (callFile === file) {
	      seen = true;
	    } else if (callFile === this._file) {
	      file = this._file;
	    } else if (seen) {
	      break
	    }
	  }

	  var key = caller
	    ? depSite.join(':') + '__' + caller.join(':')
	    : undefined;

	  if (key !== undefined && key in this._warned) {
	    // already warned
	    return
	  }

	  this._warned[key] = true;

	  // generate automatic message from call site
	  var msg = message;
	  if (!msg) {
	    msg = callSite === depSite || !callSite.name
	      ? defaultMessage(depSite)
	      : defaultMessage(callSite);
	  }

	  // emit deprecation if listeners exist
	  if (haslisteners) {
	    var err = DeprecationError(this._namespace, msg, stack.slice(i));
	    process.emit('deprecation', err);
	    return
	  }

	  // format and write message
	  var format = process.stderr.isTTY
	    ? formatColor
	    : formatPlain;
	  var output = format.call(this, msg, caller, stack.slice(i));
	  process.stderr.write(output + '\n', 'utf8');
	}

	/**
	 * Get call site location as array.
	 */

	function callSiteLocation (callSite) {
	  var file = callSite.getFileName() || '<anonymous>';
	  var line = callSite.getLineNumber();
	  var colm = callSite.getColumnNumber();

	  if (callSite.isEval()) {
	    file = callSite.getEvalOrigin() + ', ' + file;
	  }

	  var site = [file, line, colm];

	  site.callSite = callSite;
	  site.name = callSite.getFunctionName();

	  return site
	}

	/**
	 * Generate a default message from the site.
	 */

	function defaultMessage (site) {
	  var callSite = site.callSite;
	  var funcName = site.name;

	  // make useful anonymous name
	  if (!funcName) {
	    funcName = '<anonymous@' + formatLocation(site) + '>';
	  }

	  var context = callSite.getThis();
	  var typeName = context && callSite.getTypeName();

	  // ignore useless type name
	  if (typeName === 'Object') {
	    typeName = undefined;
	  }

	  // make useful type name
	  if (typeName === 'Function') {
	    typeName = context.name || typeName;
	  }

	  return typeName && callSite.getMethodName()
	    ? typeName + '.' + funcName
	    : funcName
	}

	/**
	 * Format deprecation message without color.
	 */

	function formatPlain (msg, caller, stack) {
	  var timestamp = new Date().toUTCString();

	  var formatted = timestamp +
	    ' ' + this._namespace +
	    ' deprecated ' + msg;

	  // add stack trace
	  if (this._traced) {
	    for (var i = 0; i < stack.length; i++) {
	      formatted += '\n    at ' + stack[i].toString();
	    }

	    return formatted
	  }

	  if (caller) {
	    formatted += ' at ' + formatLocation(caller);
	  }

	  return formatted
	}

	/**
	 * Format deprecation message with color.
	 */

	function formatColor (msg, caller, stack) {
	  var formatted = '\x1b[36;1m' + this._namespace + '\x1b[22;39m' + // bold cyan
	    ' \x1b[33;1mdeprecated\x1b[22;39m' + // bold yellow
	    ' \x1b[0m' + msg + '\x1b[39m'; // reset

	  // add stack trace
	  if (this._traced) {
	    for (var i = 0; i < stack.length; i++) {
	      formatted += '\n    \x1b[36mat ' + stack[i].toString() + '\x1b[39m'; // cyan
	    }

	    return formatted
	  }

	  if (caller) {
	    formatted += ' \x1b[36m' + formatLocation(caller) + '\x1b[39m'; // cyan
	  }

	  return formatted
	}

	/**
	 * Format call site location.
	 */

	function formatLocation (callSite) {
	  return relative(basePath, callSite[0]) +
	    ':' + callSite[1] +
	    ':' + callSite[2]
	}

	/**
	 * Get the stack as array of call sites.
	 */

	function getStack () {
	  var limit = Error.stackTraceLimit;
	  var obj = {};
	  var prep = Error.prepareStackTrace;

	  Error.prepareStackTrace = prepareObjectStackTrace;
	  Error.stackTraceLimit = Math.max(10, limit);

	  // capture the stack
	  Error.captureStackTrace(obj);

	  // slice this function off the top
	  var stack = obj.stack.slice(1);

	  Error.prepareStackTrace = prep;
	  Error.stackTraceLimit = limit;

	  return stack
	}

	/**
	 * Capture call site stack from v8.
	 */

	function prepareObjectStackTrace (obj, stack) {
	  return stack
	}

	/**
	 * Return a wrapped function in a deprecation message.
	 */

	function wrapfunction (fn, message) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('argument fn must be a function')
	  }

	  var args = createArgumentsString(fn.length);
	  var stack = getStack();
	  var site = callSiteLocation(stack[1]);

	  site.name = fn.name;

	  // eslint-disable-next-line no-new-func
	  var deprecatedfn = new Function('fn', 'log', 'deprecate', 'message', 'site',
	    '"use strict"\n' +
	    'return function (' + args + ') {' +
	    'log.call(deprecate, message, site)\n' +
	    'return fn.apply(this, arguments)\n' +
	    '}')(fn, log, this, message, site);

	  return deprecatedfn
	}

	/**
	 * Wrap property in a deprecation message.
	 */

	function wrapproperty (obj, prop, message) {
	  if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
	    throw new TypeError('argument obj must be object')
	  }

	  var descriptor = Object.getOwnPropertyDescriptor(obj, prop);

	  if (!descriptor) {
	    throw new TypeError('must call property on owner object')
	  }

	  if (!descriptor.configurable) {
	    throw new TypeError('property must be configurable')
	  }

	  var deprecate = this;
	  var stack = getStack();
	  var site = callSiteLocation(stack[1]);

	  // set site name
	  site.name = prop;

	  // convert data descriptor
	  if ('value' in descriptor) {
	    descriptor = convertDataDescriptorToAccessor(obj, prop);
	  }

	  var get = descriptor.get;
	  var set = descriptor.set;

	  // wrap getter
	  if (typeof get === 'function') {
	    descriptor.get = function getter () {
	      log.call(deprecate, message, site);
	      return get.apply(this, arguments)
	    };
	  }

	  // wrap setter
	  if (typeof set === 'function') {
	    descriptor.set = function setter () {
	      log.call(deprecate, message, site);
	      return set.apply(this, arguments)
	    };
	  }

	  Object.defineProperty(obj, prop, descriptor);
	}

	/**
	 * Create DeprecationError for deprecation
	 */

	function DeprecationError (namespace, message, stack) {
	  var error = new Error();
	  var stackString;

	  Object.defineProperty(error, 'constructor', {
	    value: DeprecationError
	  });

	  Object.defineProperty(error, 'message', {
	    configurable: true,
	    enumerable: false,
	    value: message,
	    writable: true
	  });

	  Object.defineProperty(error, 'name', {
	    enumerable: false,
	    configurable: true,
	    value: 'DeprecationError',
	    writable: true
	  });

	  Object.defineProperty(error, 'namespace', {
	    configurable: true,
	    enumerable: false,
	    value: namespace,
	    writable: true
	  });

	  Object.defineProperty(error, 'stack', {
	    configurable: true,
	    enumerable: false,
	    get: function () {
	      if (stackString !== undefined) {
	        return stackString
	      }

	      // prepare stack trace
	      return (stackString = createStackString.call(this, stack))
	    },
	    set: function setter (val) {
	      stackString = val;
	    }
	  });

	  return error
	}
	return depd_1;
}

var setprototypeof;
var hasRequiredSetprototypeof;

function requireSetprototypeof () {
	if (hasRequiredSetprototypeof) return setprototypeof;
	hasRequiredSetprototypeof = 1;
	/* eslint no-proto: 0 */
	setprototypeof = Object.setPrototypeOf || ({ __proto__: [] } instanceof Array ? setProtoOf : mixinProperties);

	function setProtoOf (obj, proto) {
	  obj.__proto__ = proto;
	  return obj
	}

	function mixinProperties (obj, proto) {
	  for (var prop in proto) {
	    if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
	      obj[prop] = proto[prop];
	    }
	  }
	  return obj
	}
	return setprototypeof;
}

const require$$0$1 = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "103": "Early Hints",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "208": "Already Reported",
  "226": "IM Used",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Found",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Timeout",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "416": "Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a Teapot",
  "421": "Misdirected Request",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Too Early",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "451": "Unavailable For Legal Reasons",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "508": "Loop Detected",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required",
};

/*!
 * statuses
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2016 Douglas Christopher Wilson
 * MIT Licensed
 */

var statuses;
var hasRequiredStatuses;

function requireStatuses () {
	if (hasRequiredStatuses) return statuses;
	hasRequiredStatuses = 1;

	/**
	 * Module dependencies.
	 * @private
	 */

	var codes = require$$0$1;

	/**
	 * Module exports.
	 * @public
	 */

	statuses = status;

	// status code to message map
	status.message = codes;

	// status message (lower-case) to code map
	status.code = createMessageToStatusCodeMap(codes);

	// array of status codes
	status.codes = createStatusCodeList(codes);

	// status codes for redirects
	status.redirect = {
	  300: true,
	  301: true,
	  302: true,
	  303: true,
	  305: true,
	  307: true,
	  308: true
	};

	// status codes for empty bodies
	status.empty = {
	  204: true,
	  205: true,
	  304: true
	};

	// status codes for when you should retry the request
	status.retry = {
	  502: true,
	  503: true,
	  504: true
	};

	/**
	 * Create a map of message to status code.
	 * @private
	 */

	function createMessageToStatusCodeMap (codes) {
	  var map = {};

	  Object.keys(codes).forEach(function forEachCode (code) {
	    var message = codes[code];
	    var status = Number(code);

	    // populate map
	    map[message.toLowerCase()] = status;
	  });

	  return map
	}

	/**
	 * Create a list of all status codes.
	 * @private
	 */

	function createStatusCodeList (codes) {
	  return Object.keys(codes).map(function mapCode (code) {
	    return Number(code)
	  })
	}

	/**
	 * Get the status code for given message.
	 * @private
	 */

	function getStatusCode (message) {
	  var msg = message.toLowerCase();

	  if (!Object.prototype.hasOwnProperty.call(status.code, msg)) {
	    throw new Error('invalid status message: "' + message + '"')
	  }

	  return status.code[msg]
	}

	/**
	 * Get the status message for given code.
	 * @private
	 */

	function getStatusMessage (code) {
	  if (!Object.prototype.hasOwnProperty.call(status.message, code)) {
	    throw new Error('invalid status code: ' + code)
	  }

	  return status.message[code]
	}

	/**
	 * Get the status code.
	 *
	 * Given a number, this will throw if it is not a known status
	 * code, otherwise the code will be returned. Given a string,
	 * the string will be parsed for a number and return the code
	 * if valid, otherwise will lookup the code assuming this is
	 * the status message.
	 *
	 * @param {string|number} code
	 * @returns {number}
	 * @public
	 */

	function status (code) {
	  if (typeof code === 'number') {
	    return getStatusMessage(code)
	  }

	  if (typeof code !== 'string') {
	    throw new TypeError('code must be a number or string')
	  }

	  // '403'
	  var n = parseInt(code, 10);
	  if (!isNaN(n)) {
	    return getStatusMessage(n)
	  }

	  return getStatusCode(code)
	}
	return statuses;
}

var inherits = {exports: {}};

var inherits_browser = {exports: {}};

var hasRequiredInherits_browser;

function requireInherits_browser () {
	if (hasRequiredInherits_browser) return inherits_browser.exports;
	hasRequiredInherits_browser = 1;
	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  inherits_browser.exports = function inherits(ctor, superCtor) {
	    if (superCtor) {
	      ctor.super_ = superCtor;
	      ctor.prototype = Object.create(superCtor.prototype, {
	        constructor: {
	          value: ctor,
	          enumerable: false,
	          writable: true,
	          configurable: true
	        }
	      });
	    }
	  };
	} else {
	  // old school shim for old browsers
	  inherits_browser.exports = function inherits(ctor, superCtor) {
	    if (superCtor) {
	      ctor.super_ = superCtor;
	      var TempCtor = function () {};
	      TempCtor.prototype = superCtor.prototype;
	      ctor.prototype = new TempCtor();
	      ctor.prototype.constructor = ctor;
	    }
	  };
	}
	return inherits_browser.exports;
}

var hasRequiredInherits;

function requireInherits () {
	if (hasRequiredInherits) return inherits.exports;
	hasRequiredInherits = 1;
	try {
	  var util = require('util');
	  /* istanbul ignore next */
	  if (typeof util.inherits !== 'function') throw '';
	  inherits.exports = util.inherits;
	} catch (e) {
	  /* istanbul ignore next */
	  inherits.exports = requireInherits_browser();
	}
	return inherits.exports;
}

/*!
 * toidentifier
 * Copyright(c) 2016 Douglas Christopher Wilson
 * MIT Licensed
 */

var toidentifier;
var hasRequiredToidentifier;

function requireToidentifier () {
	if (hasRequiredToidentifier) return toidentifier;
	hasRequiredToidentifier = 1;

	/**
	 * Module exports.
	 * @public
	 */

	toidentifier = toIdentifier;

	/**
	 * Trasform the given string into a JavaScript identifier
	 *
	 * @param {string} str
	 * @returns {string}
	 * @public
	 */

	function toIdentifier (str) {
	  return str
	    .split(' ')
	    .map(function (token) {
	      return token.slice(0, 1).toUpperCase() + token.slice(1)
	    })
	    .join('')
	    .replace(/[^ _0-9a-z]/gi, '')
	}
	return toidentifier;
}

/*!
 * http-errors
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2016 Douglas Christopher Wilson
 * MIT Licensed
 */

var hasRequiredHttpErrors;

function requireHttpErrors () {
	if (hasRequiredHttpErrors) return httpErrors.exports;
	hasRequiredHttpErrors = 1;
	(function (module) {

		/**
		 * Module dependencies.
		 * @private
		 */

		var deprecate = requireDepd()('http-errors');
		var setPrototypeOf = requireSetprototypeof();
		var statuses = requireStatuses();
		var inherits = requireInherits();
		var toIdentifier = requireToidentifier();

		/**
		 * Module exports.
		 * @public
		 */

		module.exports = createError;
		module.exports.HttpError = createHttpErrorConstructor();
		module.exports.isHttpError = createIsHttpErrorFunction(module.exports.HttpError);

		// Populate exports for all constructors
		populateConstructorExports(module.exports, statuses.codes, module.exports.HttpError);

		/**
		 * Get the code class of a status code.
		 * @private
		 */

		function codeClass (status) {
		  return Number(String(status).charAt(0) + '00')
		}

		/**
		 * Create a new HTTP Error.
		 *
		 * @returns {Error}
		 * @public
		 */

		function createError () {
		  // so much arity going on ~_~
		  var err;
		  var msg;
		  var status = 500;
		  var props = {};
		  for (var i = 0; i < arguments.length; i++) {
		    var arg = arguments[i];
		    var type = typeof arg;
		    if (type === 'object' && arg instanceof Error) {
		      err = arg;
		      status = err.status || err.statusCode || status;
		    } else if (type === 'number' && i === 0) {
		      status = arg;
		    } else if (type === 'string') {
		      msg = arg;
		    } else if (type === 'object') {
		      props = arg;
		    } else {
		      throw new TypeError('argument #' + (i + 1) + ' unsupported type ' + type)
		    }
		  }

		  if (typeof status === 'number' && (status < 400 || status >= 600)) {
		    deprecate('non-error status code; use only 4xx or 5xx status codes');
		  }

		  if (typeof status !== 'number' ||
		    (!statuses.message[status] && (status < 400 || status >= 600))) {
		    status = 500;
		  }

		  // constructor
		  var HttpError = createError[status] || createError[codeClass(status)];

		  if (!err) {
		    // create error
		    err = HttpError
		      ? new HttpError(msg)
		      : new Error(msg || statuses.message[status]);
		    Error.captureStackTrace(err, createError);
		  }

		  if (!HttpError || !(err instanceof HttpError) || err.status !== status) {
		    // add properties to generic error
		    err.expose = status < 500;
		    err.status = err.statusCode = status;
		  }

		  for (var key in props) {
		    if (key !== 'status' && key !== 'statusCode') {
		      err[key] = props[key];
		    }
		  }

		  return err
		}

		/**
		 * Create HTTP error abstract base class.
		 * @private
		 */

		function createHttpErrorConstructor () {
		  function HttpError () {
		    throw new TypeError('cannot construct abstract class')
		  }

		  inherits(HttpError, Error);

		  return HttpError
		}

		/**
		 * Create a constructor for a client error.
		 * @private
		 */

		function createClientErrorConstructor (HttpError, name, code) {
		  var className = toClassName(name);

		  function ClientError (message) {
		    // create the error object
		    var msg = message != null ? message : statuses.message[code];
		    var err = new Error(msg);

		    // capture a stack trace to the construction point
		    Error.captureStackTrace(err, ClientError);

		    // adjust the [[Prototype]]
		    setPrototypeOf(err, ClientError.prototype);

		    // redefine the error message
		    Object.defineProperty(err, 'message', {
		      enumerable: true,
		      configurable: true,
		      value: msg,
		      writable: true
		    });

		    // redefine the error name
		    Object.defineProperty(err, 'name', {
		      enumerable: false,
		      configurable: true,
		      value: className,
		      writable: true
		    });

		    return err
		  }

		  inherits(ClientError, HttpError);
		  nameFunc(ClientError, className);

		  ClientError.prototype.status = code;
		  ClientError.prototype.statusCode = code;
		  ClientError.prototype.expose = true;

		  return ClientError
		}

		/**
		 * Create function to test is a value is a HttpError.
		 * @private
		 */

		function createIsHttpErrorFunction (HttpError) {
		  return function isHttpError (val) {
		    if (!val || typeof val !== 'object') {
		      return false
		    }

		    if (val instanceof HttpError) {
		      return true
		    }

		    return val instanceof Error &&
		      typeof val.expose === 'boolean' &&
		      typeof val.statusCode === 'number' && val.status === val.statusCode
		  }
		}

		/**
		 * Create a constructor for a server error.
		 * @private
		 */

		function createServerErrorConstructor (HttpError, name, code) {
		  var className = toClassName(name);

		  function ServerError (message) {
		    // create the error object
		    var msg = message != null ? message : statuses.message[code];
		    var err = new Error(msg);

		    // capture a stack trace to the construction point
		    Error.captureStackTrace(err, ServerError);

		    // adjust the [[Prototype]]
		    setPrototypeOf(err, ServerError.prototype);

		    // redefine the error message
		    Object.defineProperty(err, 'message', {
		      enumerable: true,
		      configurable: true,
		      value: msg,
		      writable: true
		    });

		    // redefine the error name
		    Object.defineProperty(err, 'name', {
		      enumerable: false,
		      configurable: true,
		      value: className,
		      writable: true
		    });

		    return err
		  }

		  inherits(ServerError, HttpError);
		  nameFunc(ServerError, className);

		  ServerError.prototype.status = code;
		  ServerError.prototype.statusCode = code;
		  ServerError.prototype.expose = false;

		  return ServerError
		}

		/**
		 * Set the name of a function, if possible.
		 * @private
		 */

		function nameFunc (func, name) {
		  var desc = Object.getOwnPropertyDescriptor(func, 'name');

		  if (desc && desc.configurable) {
		    desc.value = name;
		    Object.defineProperty(func, 'name', desc);
		  }
		}

		/**
		 * Populate the exports object with constructors for every error class.
		 * @private
		 */

		function populateConstructorExports (exports$1, codes, HttpError) {
		  codes.forEach(function forEachCode (code) {
		    var CodeError;
		    var name = toIdentifier(statuses.message[code]);

		    switch (codeClass(code)) {
		      case 400:
		        CodeError = createClientErrorConstructor(HttpError, name, code);
		        break
		      case 500:
		        CodeError = createServerErrorConstructor(HttpError, name, code);
		        break
		    }

		    if (CodeError) {
		      // export the constructor
		      exports$1[code] = CodeError;
		      exports$1[name] = CodeError;
		    }
		  });
		}

		/**
		 * Get a class name from a name identifier.
		 *
		 * @param {string} name
		 * @returns {string}
		 * @private
		 */

		function toClassName (name) {
		  return name.slice(-5) === 'Error' ? name : name + 'Error'
		} 
	} (httpErrors));
	return httpErrors.exports;
}

var src = {exports: {}};

var browser = {exports: {}};

/**
 * Helpers.
 */

var ms;
var hasRequiredMs;

function requireMs () {
	if (hasRequiredMs) return ms;
	hasRequiredMs = 1;
	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;

	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} [options]
	 * @throws {Error} throw an error if val is not a non-empty string or a number
	 * @return {String|Number}
	 * @api public
	 */

	ms = function (val, options) {
	  options = options || {};
	  var type = typeof val;
	  if (type === 'string' && val.length > 0) {
	    return parse(val);
	  } else if (type === 'number' && isFinite(val)) {
	    return options.long ? fmtLong(val) : fmtShort(val);
	  }
	  throw new Error(
	    'val is not a non-empty string or a valid number. val=' +
	      JSON.stringify(val)
	  );
	};

	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */

	function parse(str) {
	  str = String(str);
	  if (str.length > 100) {
	    return;
	  }
	  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
	    str
	  );
	  if (!match) {
	    return;
	  }
	  var n = parseFloat(match[1]);
	  var type = (match[2] || 'ms').toLowerCase();
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'yrs':
	    case 'yr':
	    case 'y':
	      return n * y;
	    case 'weeks':
	    case 'week':
	    case 'w':
	      return n * w;
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d;
	    case 'hours':
	    case 'hour':
	    case 'hrs':
	    case 'hr':
	    case 'h':
	      return n * h;
	    case 'minutes':
	    case 'minute':
	    case 'mins':
	    case 'min':
	    case 'm':
	      return n * m;
	    case 'seconds':
	    case 'second':
	    case 'secs':
	    case 'sec':
	    case 's':
	      return n * s;
	    case 'milliseconds':
	    case 'millisecond':
	    case 'msecs':
	    case 'msec':
	    case 'ms':
	      return n;
	    default:
	      return undefined;
	  }
	}

	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtShort(ms) {
	  var msAbs = Math.abs(ms);
	  if (msAbs >= d) {
	    return Math.round(ms / d) + 'd';
	  }
	  if (msAbs >= h) {
	    return Math.round(ms / h) + 'h';
	  }
	  if (msAbs >= m) {
	    return Math.round(ms / m) + 'm';
	  }
	  if (msAbs >= s) {
	    return Math.round(ms / s) + 's';
	  }
	  return ms + 'ms';
	}

	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtLong(ms) {
	  var msAbs = Math.abs(ms);
	  if (msAbs >= d) {
	    return plural(ms, msAbs, d, 'day');
	  }
	  if (msAbs >= h) {
	    return plural(ms, msAbs, h, 'hour');
	  }
	  if (msAbs >= m) {
	    return plural(ms, msAbs, m, 'minute');
	  }
	  if (msAbs >= s) {
	    return plural(ms, msAbs, s, 'second');
	  }
	  return ms + ' ms';
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, msAbs, n, name) {
	  var isPlural = msAbs >= n * 1.5;
	  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
	}
	return ms;
}

var common;
var hasRequiredCommon;

function requireCommon () {
	if (hasRequiredCommon) return common;
	hasRequiredCommon = 1;
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 */

	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = requireMs();
		createDebug.destroy = destroy;

		Object.keys(env).forEach(key => {
			createDebug[key] = env[key];
		});

		/**
		* The currently active debug mode names, and names to skip.
		*/

		createDebug.names = [];
		createDebug.skips = [];

		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};

		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;

			for (let i = 0; i < namespace.length; i++) {
				hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
				hash |= 0; // Convert to 32bit integer
			}

			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;

		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;

			function debug(...args) {
				// Disabled?
				if (!debug.enabled) {
					return;
				}

				const self = debug;

				// Set `diff` timestamp
				const curr = Number(new Date());
				const ms = curr - (prevTime || curr);
				self.diff = ms;
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;

				args[0] = createDebug.coerce(args[0]);

				if (typeof args[0] !== 'string') {
					// Anything else let's inspect with %O
					args.unshift('%O');
				}

				// Apply any `formatters` transformations
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					// If we encounter an escaped % then don't increase the array index
					if (match === '%%') {
						return '%';
					}
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === 'function') {
						const val = args[index];
						match = formatter.call(self, val);

						// Now we need to remove `args[index]` since it's inlined in the `format`
						args.splice(index, 1);
						index--;
					}
					return match;
				});

				// Apply env-specific formatting (colors, etc.)
				createDebug.formatArgs.call(self, args);

				const logFn = self.log || createDebug.log;
				logFn.apply(self, args);
			}

			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

			Object.defineProperty(debug, 'enabled', {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) {
						return enableOverride;
					}
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}

					return enabledCache;
				},
				set: v => {
					enableOverride = v;
				}
			});

			// Env-specific initialization logic for debug instances
			if (typeof createDebug.init === 'function') {
				createDebug.init(debug);
			}

			return debug;
		}

		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}

		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;

			createDebug.names = [];
			createDebug.skips = [];

			const split = (typeof namespaces === 'string' ? namespaces : '')
				.trim()
				.replace(/\s+/g, ',')
				.split(',')
				.filter(Boolean);

			for (const ns of split) {
				if (ns[0] === '-') {
					createDebug.skips.push(ns.slice(1));
				} else {
					createDebug.names.push(ns);
				}
			}
		}

		/**
		 * Checks if the given string matches a namespace template, honoring
		 * asterisks as wildcards.
		 *
		 * @param {String} search
		 * @param {String} template
		 * @return {Boolean}
		 */
		function matchesTemplate(search, template) {
			let searchIndex = 0;
			let templateIndex = 0;
			let starIndex = -1;
			let matchIndex = 0;

			while (searchIndex < search.length) {
				if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === '*')) {
					// Match character or proceed with wildcard
					if (template[templateIndex] === '*') {
						starIndex = templateIndex;
						matchIndex = searchIndex;
						templateIndex++; // Skip the '*'
					} else {
						searchIndex++;
						templateIndex++;
					}
				} else if (starIndex !== -1) { // eslint-disable-line no-negated-condition
					// Backtrack to the last '*' and try to match more characters
					templateIndex = starIndex + 1;
					matchIndex++;
					searchIndex = matchIndex;
				} else {
					return false; // No match
				}
			}

			// Handle trailing '*' in template
			while (templateIndex < template.length && template[templateIndex] === '*') {
				templateIndex++;
			}

			return templateIndex === template.length;
		}

		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [
				...createDebug.names,
				...createDebug.skips.map(namespace => '-' + namespace)
			].join(',');
			createDebug.enable('');
			return namespaces;
		}

		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			for (const skip of createDebug.skips) {
				if (matchesTemplate(name, skip)) {
					return false;
				}
			}

			for (const ns of createDebug.names) {
				if (matchesTemplate(name, ns)) {
					return true;
				}
			}

			return false;
		}

		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) {
				return val.stack || val.message;
			}
			return val;
		}

		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}

		createDebug.enable(createDebug.load());

		return createDebug;
	}

	common = setup;
	return common;
}

/* eslint-env browser */

var hasRequiredBrowser;

function requireBrowser () {
	if (hasRequiredBrowser) return browser.exports;
	hasRequiredBrowser = 1;
	(function (module, exports$1) {
		/**
		 * This is the web browser implementation of `debug()`.
		 */

		exports$1.formatArgs = formatArgs;
		exports$1.save = save;
		exports$1.load = load;
		exports$1.useColors = useColors;
		exports$1.storage = localstorage();
		exports$1.destroy = (() => {
			let warned = false;

			return () => {
				if (!warned) {
					warned = true;
					console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
				}
			};
		})();

		/**
		 * Colors.
		 */

		exports$1.colors = [
			'#0000CC',
			'#0000FF',
			'#0033CC',
			'#0033FF',
			'#0066CC',
			'#0066FF',
			'#0099CC',
			'#0099FF',
			'#00CC00',
			'#00CC33',
			'#00CC66',
			'#00CC99',
			'#00CCCC',
			'#00CCFF',
			'#3300CC',
			'#3300FF',
			'#3333CC',
			'#3333FF',
			'#3366CC',
			'#3366FF',
			'#3399CC',
			'#3399FF',
			'#33CC00',
			'#33CC33',
			'#33CC66',
			'#33CC99',
			'#33CCCC',
			'#33CCFF',
			'#6600CC',
			'#6600FF',
			'#6633CC',
			'#6633FF',
			'#66CC00',
			'#66CC33',
			'#9900CC',
			'#9900FF',
			'#9933CC',
			'#9933FF',
			'#99CC00',
			'#99CC33',
			'#CC0000',
			'#CC0033',
			'#CC0066',
			'#CC0099',
			'#CC00CC',
			'#CC00FF',
			'#CC3300',
			'#CC3333',
			'#CC3366',
			'#CC3399',
			'#CC33CC',
			'#CC33FF',
			'#CC6600',
			'#CC6633',
			'#CC9900',
			'#CC9933',
			'#CCCC00',
			'#CCCC33',
			'#FF0000',
			'#FF0033',
			'#FF0066',
			'#FF0099',
			'#FF00CC',
			'#FF00FF',
			'#FF3300',
			'#FF3333',
			'#FF3366',
			'#FF3399',
			'#FF33CC',
			'#FF33FF',
			'#FF6600',
			'#FF6633',
			'#FF9900',
			'#FF9933',
			'#FFCC00',
			'#FFCC33'
		];

		/**
		 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
		 * and the Firebug extension (any Firefox version) are known
		 * to support "%c" CSS customizations.
		 *
		 * TODO: add a `localStorage` variable to explicitly enable/disable colors
		 */

		// eslint-disable-next-line complexity
		function useColors() {
			// NB: In an Electron preload script, document will be defined but not fully
			// initialized. Since we know we're in Chrome, we'll just detect this case
			// explicitly
			if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
				return true;
			}

			// Internet Explorer and Edge do not support colors.
			if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
				return false;
			}

			let m;

			// Is webkit? http://stackoverflow.com/a/16459606/376773
			// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
			// eslint-disable-next-line no-return-assign
			return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
				// Is firebug? http://stackoverflow.com/a/398120/376773
				(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
				// Is firefox >= v31?
				// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
				(typeof navigator !== 'undefined' && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31) ||
				// Double check webkit in userAgent just in case we are in a worker
				(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
		}

		/**
		 * Colorize log arguments if enabled.
		 *
		 * @api public
		 */

		function formatArgs(args) {
			args[0] = (this.useColors ? '%c' : '') +
				this.namespace +
				(this.useColors ? ' %c' : ' ') +
				args[0] +
				(this.useColors ? '%c ' : ' ') +
				'+' + module.exports.humanize(this.diff);

			if (!this.useColors) {
				return;
			}

			const c = 'color: ' + this.color;
			args.splice(1, 0, c, 'color: inherit');

			// The final "%c" is somewhat tricky, because there could be other
			// arguments passed either before or after the %c, so we need to
			// figure out the correct index to insert the CSS into
			let index = 0;
			let lastC = 0;
			args[0].replace(/%[a-zA-Z%]/g, match => {
				if (match === '%%') {
					return;
				}
				index++;
				if (match === '%c') {
					// We only are interested in the *last* %c
					// (the user may have provided their own)
					lastC = index;
				}
			});

			args.splice(lastC, 0, c);
		}

		/**
		 * Invokes `console.debug()` when available.
		 * No-op when `console.debug` is not a "function".
		 * If `console.debug` is not available, falls back
		 * to `console.log`.
		 *
		 * @api public
		 */
		exports$1.log = console.debug || console.log || (() => {});

		/**
		 * Save `namespaces`.
		 *
		 * @param {String} namespaces
		 * @api private
		 */
		function save(namespaces) {
			try {
				if (namespaces) {
					exports$1.storage.setItem('debug', namespaces);
				} else {
					exports$1.storage.removeItem('debug');
				}
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}
		}

		/**
		 * Load `namespaces`.
		 *
		 * @return {String} returns the previously persisted debug modes
		 * @api private
		 */
		function load() {
			let r;
			try {
				r = exports$1.storage.getItem('debug') || exports$1.storage.getItem('DEBUG') ;
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}

			// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
			if (!r && typeof process !== 'undefined' && 'env' in process) {
				r = process.env.DEBUG;
			}

			return r;
		}

		/**
		 * Localstorage attempts to return the localstorage.
		 *
		 * This is necessary because safari throws
		 * when a user disables cookies/localstorage
		 * and you attempt to access it.
		 *
		 * @return {LocalStorage}
		 * @api private
		 */

		function localstorage() {
			try {
				// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
				// The Browser also has localStorage in the global context.
				return localStorage;
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}
		}

		module.exports = requireCommon()(exports$1);

		const {formatters} = module.exports;

		/**
		 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
		 */

		formatters.j = function (v) {
			try {
				return JSON.stringify(v);
			} catch (error) {
				return '[UnexpectedJSONParseError]: ' + error.message;
			}
		}; 
	} (browser, browser.exports));
	return browser.exports;
}

var node = {exports: {}};

var hasFlag;
var hasRequiredHasFlag;

function requireHasFlag () {
	if (hasRequiredHasFlag) return hasFlag;
	hasRequiredHasFlag = 1;

	hasFlag = (flag, argv = process.argv) => {
		const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
		const position = argv.indexOf(prefix + flag);
		const terminatorPosition = argv.indexOf('--');
		return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
	};
	return hasFlag;
}

var supportsColor_1;
var hasRequiredSupportsColor;

function requireSupportsColor () {
	if (hasRequiredSupportsColor) return supportsColor_1;
	hasRequiredSupportsColor = 1;
	const os = require$$0$3;
	const tty = require$$1;
	const hasFlag = requireHasFlag();

	const {env} = process;

	let flagForceColor;
	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false') ||
		hasFlag('color=never')) {
		flagForceColor = 0;
	} else if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		flagForceColor = 1;
	}

	function envForceColor() {
		if ('FORCE_COLOR' in env) {
			if (env.FORCE_COLOR === 'true') {
				return 1;
			}

			if (env.FORCE_COLOR === 'false') {
				return 0;
			}

			return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
		}
	}

	function translateLevel(level) {
		if (level === 0) {
			return false;
		}

		return {
			level,
			hasBasic: true,
			has256: level >= 2,
			has16m: level >= 3
		};
	}

	function supportsColor(haveStream, {streamIsTTY, sniffFlags = true} = {}) {
		const noFlagForceColor = envForceColor();
		if (noFlagForceColor !== undefined) {
			flagForceColor = noFlagForceColor;
		}

		const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;

		if (forceColor === 0) {
			return 0;
		}

		if (sniffFlags) {
			if (hasFlag('color=16m') ||
				hasFlag('color=full') ||
				hasFlag('color=truecolor')) {
				return 3;
			}

			if (hasFlag('color=256')) {
				return 2;
			}
		}

		if (haveStream && !streamIsTTY && forceColor === undefined) {
			return 0;
		}

		const min = forceColor || 0;

		if (env.TERM === 'dumb') {
			return min;
		}

		if (process.platform === 'win32') {
			// Windows 10 build 10586 is the first Windows release that supports 256 colors.
			// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
			const osRelease = os.release().split('.');
			if (
				Number(osRelease[0]) >= 10 &&
				Number(osRelease[2]) >= 10586
			) {
				return Number(osRelease[2]) >= 14931 ? 3 : 2;
			}

			return 1;
		}

		if ('CI' in env) {
			if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI', 'GITHUB_ACTIONS', 'BUILDKITE', 'DRONE'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
				return 1;
			}

			return min;
		}

		if ('TEAMCITY_VERSION' in env) {
			return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
		}

		if (env.COLORTERM === 'truecolor') {
			return 3;
		}

		if ('TERM_PROGRAM' in env) {
			const version = Number.parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

			switch (env.TERM_PROGRAM) {
				case 'iTerm.app':
					return version >= 3 ? 3 : 2;
				case 'Apple_Terminal':
					return 2;
				// No default
			}
		}

		if (/-256(color)?$/i.test(env.TERM)) {
			return 2;
		}

		if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
			return 1;
		}

		if ('COLORTERM' in env) {
			return 1;
		}

		return min;
	}

	function getSupportLevel(stream, options = {}) {
		const level = supportsColor(stream, {
			streamIsTTY: stream && stream.isTTY,
			...options
		});

		return translateLevel(level);
	}

	supportsColor_1 = {
		supportsColor: getSupportLevel,
		stdout: getSupportLevel({isTTY: tty.isatty(1)}),
		stderr: getSupportLevel({isTTY: tty.isatty(2)})
	};
	return supportsColor_1;
}

/**
 * Module dependencies.
 */

var hasRequiredNode;

function requireNode () {
	if (hasRequiredNode) return node.exports;
	hasRequiredNode = 1;
	(function (module, exports$1) {
		const tty = require$$1;
		const util = require$$1$1;

		/**
		 * This is the Node.js implementation of `debug()`.
		 */

		exports$1.init = init;
		exports$1.log = log;
		exports$1.formatArgs = formatArgs;
		exports$1.save = save;
		exports$1.load = load;
		exports$1.useColors = useColors;
		exports$1.destroy = util.deprecate(
			() => {},
			'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
		);

		/**
		 * Colors.
		 */

		exports$1.colors = [6, 2, 3, 4, 5, 1];

		try {
			// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
			// eslint-disable-next-line import/no-extraneous-dependencies
			const supportsColor = requireSupportsColor();

			if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
				exports$1.colors = [
					20,
					21,
					26,
					27,
					32,
					33,
					38,
					39,
					40,
					41,
					42,
					43,
					44,
					45,
					56,
					57,
					62,
					63,
					68,
					69,
					74,
					75,
					76,
					77,
					78,
					79,
					80,
					81,
					92,
					93,
					98,
					99,
					112,
					113,
					128,
					129,
					134,
					135,
					148,
					149,
					160,
					161,
					162,
					163,
					164,
					165,
					166,
					167,
					168,
					169,
					170,
					171,
					172,
					173,
					178,
					179,
					184,
					185,
					196,
					197,
					198,
					199,
					200,
					201,
					202,
					203,
					204,
					205,
					206,
					207,
					208,
					209,
					214,
					215,
					220,
					221
				];
			}
		} catch (error) {
			// Swallow - we only care if `supports-color` is available; it doesn't have to be.
		}

		/**
		 * Build up the default `inspectOpts` object from the environment variables.
		 *
		 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
		 */

		exports$1.inspectOpts = Object.keys(process.env).filter(key => {
			return /^debug_/i.test(key);
		}).reduce((obj, key) => {
			// Camel-case
			const prop = key
				.substring(6)
				.toLowerCase()
				.replace(/_([a-z])/g, (_, k) => {
					return k.toUpperCase();
				});

			// Coerce string value into JS value
			let val = process.env[key];
			if (/^(yes|on|true|enabled)$/i.test(val)) {
				val = true;
			} else if (/^(no|off|false|disabled)$/i.test(val)) {
				val = false;
			} else if (val === 'null') {
				val = null;
			} else {
				val = Number(val);
			}

			obj[prop] = val;
			return obj;
		}, {});

		/**
		 * Is stdout a TTY? Colored output is enabled when `true`.
		 */

		function useColors() {
			return 'colors' in exports$1.inspectOpts ?
				Boolean(exports$1.inspectOpts.colors) :
				tty.isatty(process.stderr.fd);
		}

		/**
		 * Adds ANSI color escape codes if enabled.
		 *
		 * @api public
		 */

		function formatArgs(args) {
			const {namespace: name, useColors} = this;

			if (useColors) {
				const c = this.color;
				const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
				const prefix = `  ${colorCode};1m${name} \u001B[0m`;

				args[0] = prefix + args[0].split('\n').join('\n' + prefix);
				args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
			} else {
				args[0] = getDate() + name + ' ' + args[0];
			}
		}

		function getDate() {
			if (exports$1.inspectOpts.hideDate) {
				return '';
			}
			return new Date().toISOString() + ' ';
		}

		/**
		 * Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
		 */

		function log(...args) {
			return process.stderr.write(util.formatWithOptions(exports$1.inspectOpts, ...args) + '\n');
		}

		/**
		 * Save `namespaces`.
		 *
		 * @param {String} namespaces
		 * @api private
		 */
		function save(namespaces) {
			if (namespaces) {
				process.env.DEBUG = namespaces;
			} else {
				// If you set a process.env field to null or undefined, it gets cast to the
				// string 'null' or 'undefined'. Just delete instead.
				delete process.env.DEBUG;
			}
		}

		/**
		 * Load `namespaces`.
		 *
		 * @return {String} returns the previously persisted debug modes
		 * @api private
		 */

		function load() {
			return process.env.DEBUG;
		}

		/**
		 * Init logic for `debug` instances.
		 *
		 * Create a new `inspectOpts` object in case `useColors` is set
		 * differently for a particular `debug` instance.
		 */

		function init(debug) {
			debug.inspectOpts = {};

			const keys = Object.keys(exports$1.inspectOpts);
			for (let i = 0; i < keys.length; i++) {
				debug.inspectOpts[keys[i]] = exports$1.inspectOpts[keys[i]];
			}
		}

		module.exports = requireCommon()(exports$1);

		const {formatters} = module.exports;

		/**
		 * Map %o to `util.inspect()`, all on a single line.
		 */

		formatters.o = function (v) {
			this.inspectOpts.colors = this.useColors;
			return util.inspect(v, this.inspectOpts)
				.split('\n')
				.map(str => str.trim())
				.join(' ');
		};

		/**
		 * Map %O to `util.inspect()`, allowing multiple lines if needed.
		 */

		formatters.O = function (v) {
			this.inspectOpts.colors = this.useColors;
			return util.inspect(v, this.inspectOpts);
		}; 
	} (node, node.exports));
	return node.exports;
}

/**
 * Detect Electron renderer / nwjs process, which is node, but we should
 * treat as a browser.
 */

var hasRequiredSrc;

function requireSrc () {
	if (hasRequiredSrc) return src.exports;
	hasRequiredSrc = 1;
	if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
		src.exports = requireBrowser();
	} else {
		src.exports = requireNode();
	}
	return src.exports;
}

/*!
 * encodeurl
 * Copyright(c) 2016 Douglas Christopher Wilson
 * MIT Licensed
 */

var encodeurl;
var hasRequiredEncodeurl;

function requireEncodeurl () {
	if (hasRequiredEncodeurl) return encodeurl;
	hasRequiredEncodeurl = 1;

	/**
	 * Module exports.
	 * @public
	 */

	encodeurl = encodeUrl;

	/**
	 * RegExp to match non-URL code points, *after* encoding (i.e. not including "%")
	 * and including invalid escape sequences.
	 * @private
	 */

	var ENCODE_CHARS_REGEXP = /(?:[^\x21\x23-\x3B\x3D\x3F-\x5F\x61-\x7A\x7C\x7E]|%(?:[^0-9A-Fa-f]|[0-9A-Fa-f][^0-9A-Fa-f]|$))+/g;

	/**
	 * RegExp to match unmatched surrogate pair.
	 * @private
	 */

	var UNMATCHED_SURROGATE_PAIR_REGEXP = /(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]|[\uD800-\uDBFF]([^\uDC00-\uDFFF]|$)/g;

	/**
	 * String to replace unmatched surrogate pair with.
	 * @private
	 */

	var UNMATCHED_SURROGATE_PAIR_REPLACE = '$1\uFFFD$2';

	/**
	 * Encode a URL to a percent-encoded form, excluding already-encoded sequences.
	 *
	 * This function will take an already-encoded URL and encode all the non-URL
	 * code points. This function will not encode the "%" character unless it is
	 * not part of a valid sequence (`%20` will be left as-is, but `%foo` will
	 * be encoded as `%25foo`).
	 *
	 * This encode is meant to be "safe" and does not throw errors. It will try as
	 * hard as it can to properly encode the given URL, including replacing any raw,
	 * unpaired surrogate pairs with the Unicode replacement character prior to
	 * encoding.
	 *
	 * @param {string} url
	 * @return {string}
	 * @public
	 */

	function encodeUrl (url) {
	  return String(url)
	    .replace(UNMATCHED_SURROGATE_PAIR_REGEXP, UNMATCHED_SURROGATE_PAIR_REPLACE)
	    .replace(ENCODE_CHARS_REGEXP, encodeURI)
	}
	return encodeurl;
}

/*!
 * escape-html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * MIT Licensed
 */

var escapeHtml_1;
var hasRequiredEscapeHtml;

function requireEscapeHtml () {
	if (hasRequiredEscapeHtml) return escapeHtml_1;
	hasRequiredEscapeHtml = 1;

	/**
	 * Module variables.
	 * @private
	 */

	var matchHtmlRegExp = /["'&<>]/;

	/**
	 * Module exports.
	 * @public
	 */

	escapeHtml_1 = escapeHtml;

	/**
	 * Escape special characters in the given string of html.
	 *
	 * @param  {string} string The string to escape for inserting into HTML
	 * @return {string}
	 * @public
	 */

	function escapeHtml(string) {
	  var str = '' + string;
	  var match = matchHtmlRegExp.exec(str);

	  if (!match) {
	    return str;
	  }

	  var escape;
	  var html = '';
	  var index = 0;
	  var lastIndex = 0;

	  for (index = match.index; index < str.length; index++) {
	    switch (str.charCodeAt(index)) {
	      case 34: // "
	        escape = '&quot;';
	        break;
	      case 38: // &
	        escape = '&amp;';
	        break;
	      case 39: // '
	        escape = '&#39;';
	        break;
	      case 60: // <
	        escape = '&lt;';
	        break;
	      case 62: // >
	        escape = '&gt;';
	        break;
	      default:
	        continue;
	    }

	    if (lastIndex !== index) {
	      html += str.substring(lastIndex, index);
	    }

	    lastIndex = index + 1;
	    html += escape;
	  }

	  return lastIndex !== index
	    ? html + str.substring(lastIndex, index)
	    : html;
	}
	return escapeHtml_1;
}

/*!
 * etag
 * Copyright(c) 2014-2016 Douglas Christopher Wilson
 * MIT Licensed
 */

var etag_1;
var hasRequiredEtag;

function requireEtag () {
	if (hasRequiredEtag) return etag_1;
	hasRequiredEtag = 1;

	/**
	 * Module exports.
	 * @public
	 */

	etag_1 = etag;

	/**
	 * Module dependencies.
	 * @private
	 */

	var crypto = require$$0$4;
	var Stats = require$$1$2.Stats;

	/**
	 * Module variables.
	 * @private
	 */

	var toString = Object.prototype.toString;

	/**
	 * Generate an entity tag.
	 *
	 * @param {Buffer|string} entity
	 * @return {string}
	 * @private
	 */

	function entitytag (entity) {
	  if (entity.length === 0) {
	    // fast-path empty
	    return '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"'
	  }

	  // compute hash of entity
	  var hash = crypto
	    .createHash('sha1')
	    .update(entity, 'utf8')
	    .digest('base64')
	    .substring(0, 27);

	  // compute length of entity
	  var len = typeof entity === 'string'
	    ? Buffer.byteLength(entity, 'utf8')
	    : entity.length;

	  return '"' + len.toString(16) + '-' + hash + '"'
	}

	/**
	 * Create a simple ETag.
	 *
	 * @param {string|Buffer|Stats} entity
	 * @param {object} [options]
	 * @param {boolean} [options.weak]
	 * @return {String}
	 * @public
	 */

	function etag (entity, options) {
	  if (entity == null) {
	    throw new TypeError('argument entity is required')
	  }

	  // support fs.Stats object
	  var isStats = isstats(entity);
	  var weak = options && typeof options.weak === 'boolean'
	    ? options.weak
	    : isStats;

	  // validate argument
	  if (!isStats && typeof entity !== 'string' && !Buffer.isBuffer(entity)) {
	    throw new TypeError('argument entity must be string, Buffer, or fs.Stats')
	  }

	  // generate entity tag
	  var tag = isStats
	    ? stattag(entity)
	    : entitytag(entity);

	  return weak
	    ? 'W/' + tag
	    : tag
	}

	/**
	 * Determine if object is a Stats object.
	 *
	 * @param {object} obj
	 * @return {boolean}
	 * @api private
	 */

	function isstats (obj) {
	  // genuine fs.Stats
	  if (typeof Stats === 'function' && obj instanceof Stats) {
	    return true
	  }

	  // quack quack
	  return obj && typeof obj === 'object' &&
	    'ctime' in obj && toString.call(obj.ctime) === '[object Date]' &&
	    'mtime' in obj && toString.call(obj.mtime) === '[object Date]' &&
	    'ino' in obj && typeof obj.ino === 'number' &&
	    'size' in obj && typeof obj.size === 'number'
	}

	/**
	 * Generate a tag for a stat.
	 *
	 * @param {object} stat
	 * @return {string}
	 * @private
	 */

	function stattag (stat) {
	  var mtime = stat.mtime.getTime().toString(16);
	  var size = stat.size.toString(16);

	  return '"' + size + '-' + mtime + '"'
	}
	return etag_1;
}

/*!
 * fresh
 * Copyright(c) 2012 TJ Holowaychuk
 * Copyright(c) 2016-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

var fresh_1;
var hasRequiredFresh;

function requireFresh () {
	if (hasRequiredFresh) return fresh_1;
	hasRequiredFresh = 1;

	/**
	 * RegExp to check for no-cache token in Cache-Control.
	 * @private
	 */

	var CACHE_CONTROL_NO_CACHE_REGEXP = /(?:^|,)\s*?no-cache\s*?(?:,|$)/;

	/**
	 * Module exports.
	 * @public
	 */

	fresh_1 = fresh;

	/**
	 * Check freshness of the response using request and response headers.
	 *
	 * @param {Object} reqHeaders
	 * @param {Object} resHeaders
	 * @return {Boolean}
	 * @public
	 */

	function fresh (reqHeaders, resHeaders) {
	  // fields
	  var modifiedSince = reqHeaders['if-modified-since'];
	  var noneMatch = reqHeaders['if-none-match'];

	  // unconditional request
	  if (!modifiedSince && !noneMatch) {
	    return false
	  }

	  // Always return stale when Cache-Control: no-cache
	  // to support end-to-end reload requests
	  // https://tools.ietf.org/html/rfc2616#section-14.9.4
	  var cacheControl = reqHeaders['cache-control'];
	  if (cacheControl && CACHE_CONTROL_NO_CACHE_REGEXP.test(cacheControl)) {
	    return false
	  }

	  // if-none-match takes precedent over if-modified-since
	  if (noneMatch) {
	    if (noneMatch === '*') {
	      return true
	    }
	    var etag = resHeaders.etag;

	    if (!etag) {
	      return false
	    }

	    var matches = parseTokenList(noneMatch);
	    for (var i = 0; i < matches.length; i++) {
	      var match = matches[i];
	      if (match === etag || match === 'W/' + etag || 'W/' + match === etag) {
	        return true
	      }
	    }

	    return false
	  }

	  // if-modified-since
	  if (modifiedSince) {
	    var lastModified = resHeaders['last-modified'];
	    var modifiedStale = !lastModified || !(parseHttpDate(lastModified) <= parseHttpDate(modifiedSince));

	    if (modifiedStale) {
	      return false
	    }
	  }

	  return true
	}

	/**
	 * Parse an HTTP Date into a number.
	 *
	 * @param {string} date
	 * @private
	 */

	function parseHttpDate (date) {
	  var timestamp = date && Date.parse(date);

	  // istanbul ignore next: guard against date.js Date.parse patching
	  return typeof timestamp === 'number'
	    ? timestamp
	    : NaN
	}

	/**
	 * Parse a HTTP token list.
	 *
	 * @param {string} str
	 * @private
	 */

	function parseTokenList (str) {
	  var end = 0;
	  var list = [];
	  var start = 0;

	  // gather tokens
	  for (var i = 0, len = str.length; i < len; i++) {
	    switch (str.charCodeAt(i)) {
	      case 0x20: /*   */
	        if (start === end) {
	          start = end = i + 1;
	        }
	        break
	      case 0x2c: /* , */
	        list.push(str.substring(start, end));
	        start = end = i + 1;
	        break
	      default:
	        end = i + 1;
	        break
	    }
	  }

	  // final token
	  list.push(str.substring(start, end));

	  return list
	}
	return fresh_1;
}

var mimeTypes = {};

const require$$0 = {
  "application/1d-interleaved-parityfec": {"source":"iana"},
  "application/3gpdash-qoe-report+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/3gpp-ims+xml": {"source":"iana","compressible":true},
  "application/3gpphal+json": {"source":"iana","compressible":true},
  "application/3gpphalforms+json": {"source":"iana","compressible":true},
  "application/a2l": {"source":"iana"},
  "application/ace+cbor": {"source":"iana"},
  "application/ace+json": {"source":"iana","compressible":true},
  "application/ace-groupcomm+cbor": {"source":"iana"},
  "application/ace-trl+cbor": {"source":"iana"},
  "application/activemessage": {"source":"iana"},
  "application/activity+json": {"source":"iana","compressible":true},
  "application/aif+cbor": {"source":"iana"},
  "application/aif+json": {"source":"iana","compressible":true},
  "application/alto-cdni+json": {"source":"iana","compressible":true},
  "application/alto-cdnifilter+json": {"source":"iana","compressible":true},
  "application/alto-costmap+json": {"source":"iana","compressible":true},
  "application/alto-costmapfilter+json": {"source":"iana","compressible":true},
  "application/alto-directory+json": {"source":"iana","compressible":true},
  "application/alto-endpointcost+json": {"source":"iana","compressible":true},
  "application/alto-endpointcostparams+json": {"source":"iana","compressible":true},
  "application/alto-endpointprop+json": {"source":"iana","compressible":true},
  "application/alto-endpointpropparams+json": {"source":"iana","compressible":true},
  "application/alto-error+json": {"source":"iana","compressible":true},
  "application/alto-networkmap+json": {"source":"iana","compressible":true},
  "application/alto-networkmapfilter+json": {"source":"iana","compressible":true},
  "application/alto-propmap+json": {"source":"iana","compressible":true},
  "application/alto-propmapparams+json": {"source":"iana","compressible":true},
  "application/alto-tips+json": {"source":"iana","compressible":true},
  "application/alto-tipsparams+json": {"source":"iana","compressible":true},
  "application/alto-updatestreamcontrol+json": {"source":"iana","compressible":true},
  "application/alto-updatestreamparams+json": {"source":"iana","compressible":true},
  "application/aml": {"source":"iana"},
  "application/andrew-inset": {"source":"iana","extensions":["ez"]},
  "application/appinstaller": {"compressible":false,"extensions":["appinstaller"]},
  "application/applefile": {"source":"iana"},
  "application/applixware": {"source":"apache","extensions":["aw"]},
  "application/appx": {"compressible":false,"extensions":["appx"]},
  "application/appxbundle": {"compressible":false,"extensions":["appxbundle"]},
  "application/at+jwt": {"source":"iana"},
  "application/atf": {"source":"iana"},
  "application/atfx": {"source":"iana"},
  "application/atom+xml": {"source":"iana","compressible":true,"extensions":["atom"]},
  "application/atomcat+xml": {"source":"iana","compressible":true,"extensions":["atomcat"]},
  "application/atomdeleted+xml": {"source":"iana","compressible":true,"extensions":["atomdeleted"]},
  "application/atomicmail": {"source":"iana"},
  "application/atomsvc+xml": {"source":"iana","compressible":true,"extensions":["atomsvc"]},
  "application/atsc-dwd+xml": {"source":"iana","compressible":true,"extensions":["dwd"]},
  "application/atsc-dynamic-event-message": {"source":"iana"},
  "application/atsc-held+xml": {"source":"iana","compressible":true,"extensions":["held"]},
  "application/atsc-rdt+json": {"source":"iana","compressible":true},
  "application/atsc-rsat+xml": {"source":"iana","compressible":true,"extensions":["rsat"]},
  "application/atxml": {"source":"iana"},
  "application/auth-policy+xml": {"source":"iana","compressible":true},
  "application/automationml-aml+xml": {"source":"iana","compressible":true,"extensions":["aml"]},
  "application/automationml-amlx+zip": {"source":"iana","compressible":false,"extensions":["amlx"]},
  "application/bacnet-xdd+zip": {"source":"iana","compressible":false},
  "application/batch-smtp": {"source":"iana"},
  "application/bdoc": {"compressible":false,"extensions":["bdoc"]},
  "application/beep+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/bufr": {"source":"iana"},
  "application/c2pa": {"source":"iana"},
  "application/calendar+json": {"source":"iana","compressible":true},
  "application/calendar+xml": {"source":"iana","compressible":true,"extensions":["xcs"]},
  "application/call-completion": {"source":"iana"},
  "application/cals-1840": {"source":"iana"},
  "application/captive+json": {"source":"iana","compressible":true},
  "application/cbor": {"source":"iana"},
  "application/cbor-seq": {"source":"iana"},
  "application/cccex": {"source":"iana"},
  "application/ccmp+xml": {"source":"iana","compressible":true},
  "application/ccxml+xml": {"source":"iana","compressible":true,"extensions":["ccxml"]},
  "application/cda+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/cdfx+xml": {"source":"iana","compressible":true,"extensions":["cdfx"]},
  "application/cdmi-capability": {"source":"iana","extensions":["cdmia"]},
  "application/cdmi-container": {"source":"iana","extensions":["cdmic"]},
  "application/cdmi-domain": {"source":"iana","extensions":["cdmid"]},
  "application/cdmi-object": {"source":"iana","extensions":["cdmio"]},
  "application/cdmi-queue": {"source":"iana","extensions":["cdmiq"]},
  "application/cdni": {"source":"iana"},
  "application/ce+cbor": {"source":"iana"},
  "application/cea": {"source":"iana"},
  "application/cea-2018+xml": {"source":"iana","compressible":true},
  "application/cellml+xml": {"source":"iana","compressible":true},
  "application/cfw": {"source":"iana"},
  "application/cid-edhoc+cbor-seq": {"source":"iana"},
  "application/city+json": {"source":"iana","compressible":true},
  "application/city+json-seq": {"source":"iana"},
  "application/clr": {"source":"iana"},
  "application/clue+xml": {"source":"iana","compressible":true},
  "application/clue_info+xml": {"source":"iana","compressible":true},
  "application/cms": {"source":"iana"},
  "application/cnrp+xml": {"source":"iana","compressible":true},
  "application/coap-eap": {"source":"iana"},
  "application/coap-group+json": {"source":"iana","compressible":true},
  "application/coap-payload": {"source":"iana"},
  "application/commonground": {"source":"iana"},
  "application/concise-problem-details+cbor": {"source":"iana"},
  "application/conference-info+xml": {"source":"iana","compressible":true},
  "application/cose": {"source":"iana"},
  "application/cose-key": {"source":"iana"},
  "application/cose-key-set": {"source":"iana"},
  "application/cose-x509": {"source":"iana"},
  "application/cpl+xml": {"source":"iana","compressible":true,"extensions":["cpl"]},
  "application/csrattrs": {"source":"iana"},
  "application/csta+xml": {"source":"iana","compressible":true},
  "application/cstadata+xml": {"source":"iana","compressible":true},
  "application/csvm+json": {"source":"iana","compressible":true},
  "application/cu-seeme": {"source":"apache","extensions":["cu"]},
  "application/cwl": {"source":"iana","extensions":["cwl"]},
  "application/cwl+json": {"source":"iana","compressible":true},
  "application/cwl+yaml": {"source":"iana"},
  "application/cwt": {"source":"iana"},
  "application/cybercash": {"source":"iana"},
  "application/dart": {"compressible":true},
  "application/dash+xml": {"source":"iana","compressible":true,"extensions":["mpd"]},
  "application/dash-patch+xml": {"source":"iana","compressible":true,"extensions":["mpp"]},
  "application/dashdelta": {"source":"iana"},
  "application/davmount+xml": {"source":"iana","compressible":true,"extensions":["davmount"]},
  "application/dca-rft": {"source":"iana"},
  "application/dcd": {"source":"iana"},
  "application/dec-dx": {"source":"iana"},
  "application/dialog-info+xml": {"source":"iana","compressible":true},
  "application/dicom": {"source":"iana","extensions":["dcm"]},
  "application/dicom+json": {"source":"iana","compressible":true},
  "application/dicom+xml": {"source":"iana","compressible":true},
  "application/dii": {"source":"iana"},
  "application/dit": {"source":"iana"},
  "application/dns": {"source":"iana"},
  "application/dns+json": {"source":"iana","compressible":true},
  "application/dns-message": {"source":"iana"},
  "application/docbook+xml": {"source":"apache","compressible":true,"extensions":["dbk"]},
  "application/dots+cbor": {"source":"iana"},
  "application/dpop+jwt": {"source":"iana"},
  "application/dskpp+xml": {"source":"iana","compressible":true},
  "application/dssc+der": {"source":"iana","extensions":["dssc"]},
  "application/dssc+xml": {"source":"iana","compressible":true,"extensions":["xdssc"]},
  "application/dvcs": {"source":"iana"},
  "application/eat+cwt": {"source":"iana"},
  "application/eat+jwt": {"source":"iana"},
  "application/eat-bun+cbor": {"source":"iana"},
  "application/eat-bun+json": {"source":"iana","compressible":true},
  "application/eat-ucs+cbor": {"source":"iana"},
  "application/eat-ucs+json": {"source":"iana","compressible":true},
  "application/ecmascript": {"source":"apache","compressible":true,"extensions":["ecma"]},
  "application/edhoc+cbor-seq": {"source":"iana"},
  "application/edi-consent": {"source":"iana"},
  "application/edi-x12": {"source":"iana","compressible":false},
  "application/edifact": {"source":"iana","compressible":false},
  "application/efi": {"source":"iana"},
  "application/elm+json": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/elm+xml": {"source":"iana","compressible":true},
  "application/emergencycalldata.cap+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/emergencycalldata.comment+xml": {"source":"iana","compressible":true},
  "application/emergencycalldata.control+xml": {"source":"iana","compressible":true},
  "application/emergencycalldata.deviceinfo+xml": {"source":"iana","compressible":true},
  "application/emergencycalldata.ecall.msd": {"source":"iana"},
  "application/emergencycalldata.legacyesn+json": {"source":"iana","compressible":true},
  "application/emergencycalldata.providerinfo+xml": {"source":"iana","compressible":true},
  "application/emergencycalldata.serviceinfo+xml": {"source":"iana","compressible":true},
  "application/emergencycalldata.subscriberinfo+xml": {"source":"iana","compressible":true},
  "application/emergencycalldata.veds+xml": {"source":"iana","compressible":true},
  "application/emma+xml": {"source":"iana","compressible":true,"extensions":["emma"]},
  "application/emotionml+xml": {"source":"iana","compressible":true,"extensions":["emotionml"]},
  "application/encaprtp": {"source":"iana"},
  "application/entity-statement+jwt": {"source":"iana"},
  "application/epp+xml": {"source":"iana","compressible":true},
  "application/epub+zip": {"source":"iana","compressible":false,"extensions":["epub"]},
  "application/eshop": {"source":"iana"},
  "application/exi": {"source":"iana","extensions":["exi"]},
  "application/expect-ct-report+json": {"source":"iana","compressible":true},
  "application/express": {"source":"iana","extensions":["exp"]},
  "application/fastinfoset": {"source":"iana"},
  "application/fastsoap": {"source":"iana"},
  "application/fdf": {"source":"iana","extensions":["fdf"]},
  "application/fdt+xml": {"source":"iana","compressible":true,"extensions":["fdt"]},
  "application/fhir+json": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/fhir+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/fido.trusted-apps+json": {"compressible":true},
  "application/fits": {"source":"iana"},
  "application/flexfec": {"source":"iana"},
  "application/font-sfnt": {"source":"iana"},
  "application/font-tdpfr": {"source":"iana","extensions":["pfr"]},
  "application/font-woff": {"source":"iana","compressible":false},
  "application/framework-attributes+xml": {"source":"iana","compressible":true},
  "application/geo+json": {"source":"iana","compressible":true,"extensions":["geojson"]},
  "application/geo+json-seq": {"source":"iana"},
  "application/geopackage+sqlite3": {"source":"iana"},
  "application/geopose+json": {"source":"iana","compressible":true},
  "application/geoxacml+json": {"source":"iana","compressible":true},
  "application/geoxacml+xml": {"source":"iana","compressible":true},
  "application/gltf-buffer": {"source":"iana"},
  "application/gml+xml": {"source":"iana","compressible":true,"extensions":["gml"]},
  "application/gnap-binding-jws": {"source":"iana"},
  "application/gnap-binding-jwsd": {"source":"iana"},
  "application/gnap-binding-rotation-jws": {"source":"iana"},
  "application/gnap-binding-rotation-jwsd": {"source":"iana"},
  "application/gpx+xml": {"source":"apache","compressible":true,"extensions":["gpx"]},
  "application/grib": {"source":"iana"},
  "application/gxf": {"source":"apache","extensions":["gxf"]},
  "application/gzip": {"source":"iana","compressible":false,"extensions":["gz"]},
  "application/h224": {"source":"iana"},
  "application/held+xml": {"source":"iana","compressible":true},
  "application/hjson": {"extensions":["hjson"]},
  "application/hl7v2+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/http": {"source":"iana"},
  "application/hyperstudio": {"source":"iana","extensions":["stk"]},
  "application/ibe-key-request+xml": {"source":"iana","compressible":true},
  "application/ibe-pkg-reply+xml": {"source":"iana","compressible":true},
  "application/ibe-pp-data": {"source":"iana"},
  "application/iges": {"source":"iana"},
  "application/im-iscomposing+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/index": {"source":"iana"},
  "application/index.cmd": {"source":"iana"},
  "application/index.obj": {"source":"iana"},
  "application/index.response": {"source":"iana"},
  "application/index.vnd": {"source":"iana"},
  "application/inkml+xml": {"source":"iana","compressible":true,"extensions":["ink","inkml"]},
  "application/iotp": {"source":"iana"},
  "application/ipfix": {"source":"iana","extensions":["ipfix"]},
  "application/ipp": {"source":"iana"},
  "application/isup": {"source":"iana"},
  "application/its+xml": {"source":"iana","compressible":true,"extensions":["its"]},
  "application/java-archive": {"source":"iana","compressible":false,"extensions":["jar","war","ear"]},
  "application/java-serialized-object": {"source":"apache","compressible":false,"extensions":["ser"]},
  "application/java-vm": {"source":"apache","compressible":false,"extensions":["class"]},
  "application/javascript": {"source":"apache","charset":"UTF-8","compressible":true,"extensions":["js"]},
  "application/jf2feed+json": {"source":"iana","compressible":true},
  "application/jose": {"source":"iana"},
  "application/jose+json": {"source":"iana","compressible":true},
  "application/jrd+json": {"source":"iana","compressible":true},
  "application/jscalendar+json": {"source":"iana","compressible":true},
  "application/jscontact+json": {"source":"iana","compressible":true},
  "application/json": {"source":"iana","charset":"UTF-8","compressible":true,"extensions":["json","map"]},
  "application/json-patch+json": {"source":"iana","compressible":true},
  "application/json-seq": {"source":"iana"},
  "application/json5": {"extensions":["json5"]},
  "application/jsonml+json": {"source":"apache","compressible":true,"extensions":["jsonml"]},
  "application/jsonpath": {"source":"iana"},
  "application/jwk+json": {"source":"iana","compressible":true},
  "application/jwk-set+json": {"source":"iana","compressible":true},
  "application/jwk-set+jwt": {"source":"iana"},
  "application/jwt": {"source":"iana"},
  "application/kpml-request+xml": {"source":"iana","compressible":true},
  "application/kpml-response+xml": {"source":"iana","compressible":true},
  "application/ld+json": {"source":"iana","compressible":true,"extensions":["jsonld"]},
  "application/lgr+xml": {"source":"iana","compressible":true,"extensions":["lgr"]},
  "application/link-format": {"source":"iana"},
  "application/linkset": {"source":"iana"},
  "application/linkset+json": {"source":"iana","compressible":true},
  "application/load-control+xml": {"source":"iana","compressible":true},
  "application/logout+jwt": {"source":"iana"},
  "application/lost+xml": {"source":"iana","compressible":true,"extensions":["lostxml"]},
  "application/lostsync+xml": {"source":"iana","compressible":true},
  "application/lpf+zip": {"source":"iana","compressible":false},
  "application/lxf": {"source":"iana"},
  "application/mac-binhex40": {"source":"iana","extensions":["hqx"]},
  "application/mac-compactpro": {"source":"apache","extensions":["cpt"]},
  "application/macwriteii": {"source":"iana"},
  "application/mads+xml": {"source":"iana","compressible":true,"extensions":["mads"]},
  "application/manifest+json": {"source":"iana","charset":"UTF-8","compressible":true,"extensions":["webmanifest"]},
  "application/marc": {"source":"iana","extensions":["mrc"]},
  "application/marcxml+xml": {"source":"iana","compressible":true,"extensions":["mrcx"]},
  "application/mathematica": {"source":"iana","extensions":["ma","nb","mb"]},
  "application/mathml+xml": {"source":"iana","compressible":true,"extensions":["mathml"]},
  "application/mathml-content+xml": {"source":"iana","compressible":true},
  "application/mathml-presentation+xml": {"source":"iana","compressible":true},
  "application/mbms-associated-procedure-description+xml": {"source":"iana","compressible":true},
  "application/mbms-deregister+xml": {"source":"iana","compressible":true},
  "application/mbms-envelope+xml": {"source":"iana","compressible":true},
  "application/mbms-msk+xml": {"source":"iana","compressible":true},
  "application/mbms-msk-response+xml": {"source":"iana","compressible":true},
  "application/mbms-protection-description+xml": {"source":"iana","compressible":true},
  "application/mbms-reception-report+xml": {"source":"iana","compressible":true},
  "application/mbms-register+xml": {"source":"iana","compressible":true},
  "application/mbms-register-response+xml": {"source":"iana","compressible":true},
  "application/mbms-schedule+xml": {"source":"iana","compressible":true},
  "application/mbms-user-service-description+xml": {"source":"iana","compressible":true},
  "application/mbox": {"source":"iana","extensions":["mbox"]},
  "application/media-policy-dataset+xml": {"source":"iana","compressible":true,"extensions":["mpf"]},
  "application/media_control+xml": {"source":"iana","compressible":true},
  "application/mediaservercontrol+xml": {"source":"iana","compressible":true,"extensions":["mscml"]},
  "application/merge-patch+json": {"source":"iana","compressible":true},
  "application/metalink+xml": {"source":"apache","compressible":true,"extensions":["metalink"]},
  "application/metalink4+xml": {"source":"iana","compressible":true,"extensions":["meta4"]},
  "application/mets+xml": {"source":"iana","compressible":true,"extensions":["mets"]},
  "application/mf4": {"source":"iana"},
  "application/mikey": {"source":"iana"},
  "application/mipc": {"source":"iana"},
  "application/missing-blocks+cbor-seq": {"source":"iana"},
  "application/mmt-aei+xml": {"source":"iana","compressible":true,"extensions":["maei"]},
  "application/mmt-usd+xml": {"source":"iana","compressible":true,"extensions":["musd"]},
  "application/mods+xml": {"source":"iana","compressible":true,"extensions":["mods"]},
  "application/moss-keys": {"source":"iana"},
  "application/moss-signature": {"source":"iana"},
  "application/mosskey-data": {"source":"iana"},
  "application/mosskey-request": {"source":"iana"},
  "application/mp21": {"source":"iana","extensions":["m21","mp21"]},
  "application/mp4": {"source":"iana","extensions":["mp4","mpg4","mp4s","m4p"]},
  "application/mpeg4-generic": {"source":"iana"},
  "application/mpeg4-iod": {"source":"iana"},
  "application/mpeg4-iod-xmt": {"source":"iana"},
  "application/mrb-consumer+xml": {"source":"iana","compressible":true},
  "application/mrb-publish+xml": {"source":"iana","compressible":true},
  "application/msc-ivr+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/msc-mixer+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/msix": {"compressible":false,"extensions":["msix"]},
  "application/msixbundle": {"compressible":false,"extensions":["msixbundle"]},
  "application/msword": {"source":"iana","compressible":false,"extensions":["doc","dot"]},
  "application/mud+json": {"source":"iana","compressible":true},
  "application/multipart-core": {"source":"iana"},
  "application/mxf": {"source":"iana","extensions":["mxf"]},
  "application/n-quads": {"source":"iana","extensions":["nq"]},
  "application/n-triples": {"source":"iana","extensions":["nt"]},
  "application/nasdata": {"source":"iana"},
  "application/news-checkgroups": {"source":"iana","charset":"US-ASCII"},
  "application/news-groupinfo": {"source":"iana","charset":"US-ASCII"},
  "application/news-transmission": {"source":"iana"},
  "application/nlsml+xml": {"source":"iana","compressible":true},
  "application/node": {"source":"iana","extensions":["cjs"]},
  "application/nss": {"source":"iana"},
  "application/oauth-authz-req+jwt": {"source":"iana"},
  "application/oblivious-dns-message": {"source":"iana"},
  "application/ocsp-request": {"source":"iana"},
  "application/ocsp-response": {"source":"iana"},
  "application/octet-stream": {"source":"iana","compressible":true,"extensions":["bin","dms","lrf","mar","so","dist","distz","pkg","bpk","dump","elc","deploy","exe","dll","deb","dmg","iso","img","msi","msp","msm","buffer"]},
  "application/oda": {"source":"iana","extensions":["oda"]},
  "application/odm+xml": {"source":"iana","compressible":true},
  "application/odx": {"source":"iana"},
  "application/oebps-package+xml": {"source":"iana","compressible":true,"extensions":["opf"]},
  "application/ogg": {"source":"iana","compressible":false,"extensions":["ogx"]},
  "application/ohttp-keys": {"source":"iana"},
  "application/omdoc+xml": {"source":"apache","compressible":true,"extensions":["omdoc"]},
  "application/onenote": {"source":"apache","extensions":["onetoc","onetoc2","onetmp","onepkg","one","onea"]},
  "application/opc-nodeset+xml": {"source":"iana","compressible":true},
  "application/oscore": {"source":"iana"},
  "application/oxps": {"source":"iana","extensions":["oxps"]},
  "application/p21": {"source":"iana"},
  "application/p21+zip": {"source":"iana","compressible":false},
  "application/p2p-overlay+xml": {"source":"iana","compressible":true,"extensions":["relo"]},
  "application/parityfec": {"source":"iana"},
  "application/passport": {"source":"iana"},
  "application/patch-ops-error+xml": {"source":"iana","compressible":true,"extensions":["xer"]},
  "application/pdf": {"source":"iana","compressible":false,"extensions":["pdf"]},
  "application/pdx": {"source":"iana"},
  "application/pem-certificate-chain": {"source":"iana"},
  "application/pgp-encrypted": {"source":"iana","compressible":false,"extensions":["pgp"]},
  "application/pgp-keys": {"source":"iana","extensions":["asc"]},
  "application/pgp-signature": {"source":"iana","extensions":["sig","asc"]},
  "application/pics-rules": {"source":"apache","extensions":["prf"]},
  "application/pidf+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/pidf-diff+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/pkcs10": {"source":"iana","extensions":["p10"]},
  "application/pkcs12": {"source":"iana"},
  "application/pkcs7-mime": {"source":"iana","extensions":["p7m","p7c"]},
  "application/pkcs7-signature": {"source":"iana","extensions":["p7s"]},
  "application/pkcs8": {"source":"iana","extensions":["p8"]},
  "application/pkcs8-encrypted": {"source":"iana"},
  "application/pkix-attr-cert": {"source":"iana","extensions":["ac"]},
  "application/pkix-cert": {"source":"iana","extensions":["cer"]},
  "application/pkix-crl": {"source":"iana","extensions":["crl"]},
  "application/pkix-pkipath": {"source":"iana","extensions":["pkipath"]},
  "application/pkixcmp": {"source":"iana","extensions":["pki"]},
  "application/pls+xml": {"source":"iana","compressible":true,"extensions":["pls"]},
  "application/poc-settings+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/postscript": {"source":"iana","compressible":true,"extensions":["ai","eps","ps"]},
  "application/ppsp-tracker+json": {"source":"iana","compressible":true},
  "application/private-token-issuer-directory": {"source":"iana"},
  "application/private-token-request": {"source":"iana"},
  "application/private-token-response": {"source":"iana"},
  "application/problem+json": {"source":"iana","compressible":true},
  "application/problem+xml": {"source":"iana","compressible":true},
  "application/provenance+xml": {"source":"iana","compressible":true,"extensions":["provx"]},
  "application/provided-claims+jwt": {"source":"iana"},
  "application/prs.alvestrand.titrax-sheet": {"source":"iana"},
  "application/prs.cww": {"source":"iana","extensions":["cww"]},
  "application/prs.cyn": {"source":"iana","charset":"7-BIT"},
  "application/prs.hpub+zip": {"source":"iana","compressible":false},
  "application/prs.implied-document+xml": {"source":"iana","compressible":true},
  "application/prs.implied-executable": {"source":"iana"},
  "application/prs.implied-object+json": {"source":"iana","compressible":true},
  "application/prs.implied-object+json-seq": {"source":"iana"},
  "application/prs.implied-object+yaml": {"source":"iana"},
  "application/prs.implied-structure": {"source":"iana"},
  "application/prs.mayfile": {"source":"iana"},
  "application/prs.nprend": {"source":"iana"},
  "application/prs.plucker": {"source":"iana"},
  "application/prs.rdf-xml-crypt": {"source":"iana"},
  "application/prs.vcfbzip2": {"source":"iana"},
  "application/prs.xsf+xml": {"source":"iana","compressible":true,"extensions":["xsf"]},
  "application/pskc+xml": {"source":"iana","compressible":true,"extensions":["pskcxml"]},
  "application/pvd+json": {"source":"iana","compressible":true},
  "application/qsig": {"source":"iana"},
  "application/raml+yaml": {"compressible":true,"extensions":["raml"]},
  "application/raptorfec": {"source":"iana"},
  "application/rdap+json": {"source":"iana","compressible":true},
  "application/rdf+xml": {"source":"iana","compressible":true,"extensions":["rdf","owl"]},
  "application/reginfo+xml": {"source":"iana","compressible":true,"extensions":["rif"]},
  "application/relax-ng-compact-syntax": {"source":"iana","extensions":["rnc"]},
  "application/remote-printing": {"source":"apache"},
  "application/reputon+json": {"source":"iana","compressible":true},
  "application/resolve-response+jwt": {"source":"iana"},
  "application/resource-lists+xml": {"source":"iana","compressible":true,"extensions":["rl"]},
  "application/resource-lists-diff+xml": {"source":"iana","compressible":true,"extensions":["rld"]},
  "application/rfc+xml": {"source":"iana","compressible":true},
  "application/riscos": {"source":"iana"},
  "application/rlmi+xml": {"source":"iana","compressible":true},
  "application/rls-services+xml": {"source":"iana","compressible":true,"extensions":["rs"]},
  "application/route-apd+xml": {"source":"iana","compressible":true,"extensions":["rapd"]},
  "application/route-s-tsid+xml": {"source":"iana","compressible":true,"extensions":["sls"]},
  "application/route-usd+xml": {"source":"iana","compressible":true,"extensions":["rusd"]},
  "application/rpki-checklist": {"source":"iana"},
  "application/rpki-ghostbusters": {"source":"iana","extensions":["gbr"]},
  "application/rpki-manifest": {"source":"iana","extensions":["mft"]},
  "application/rpki-publication": {"source":"iana"},
  "application/rpki-roa": {"source":"iana","extensions":["roa"]},
  "application/rpki-signed-tal": {"source":"iana"},
  "application/rpki-updown": {"source":"iana"},
  "application/rsd+xml": {"source":"apache","compressible":true,"extensions":["rsd"]},
  "application/rss+xml": {"source":"apache","compressible":true,"extensions":["rss"]},
  "application/rtf": {"source":"iana","compressible":true,"extensions":["rtf"]},
  "application/rtploopback": {"source":"iana"},
  "application/rtx": {"source":"iana"},
  "application/samlassertion+xml": {"source":"iana","compressible":true},
  "application/samlmetadata+xml": {"source":"iana","compressible":true},
  "application/sarif+json": {"source":"iana","compressible":true},
  "application/sarif-external-properties+json": {"source":"iana","compressible":true},
  "application/sbe": {"source":"iana"},
  "application/sbml+xml": {"source":"iana","compressible":true,"extensions":["sbml"]},
  "application/scaip+xml": {"source":"iana","compressible":true},
  "application/scim+json": {"source":"iana","compressible":true},
  "application/scvp-cv-request": {"source":"iana","extensions":["scq"]},
  "application/scvp-cv-response": {"source":"iana","extensions":["scs"]},
  "application/scvp-vp-request": {"source":"iana","extensions":["spq"]},
  "application/scvp-vp-response": {"source":"iana","extensions":["spp"]},
  "application/sdp": {"source":"iana","extensions":["sdp"]},
  "application/secevent+jwt": {"source":"iana"},
  "application/senml+cbor": {"source":"iana"},
  "application/senml+json": {"source":"iana","compressible":true},
  "application/senml+xml": {"source":"iana","compressible":true,"extensions":["senmlx"]},
  "application/senml-etch+cbor": {"source":"iana"},
  "application/senml-etch+json": {"source":"iana","compressible":true},
  "application/senml-exi": {"source":"iana"},
  "application/sensml+cbor": {"source":"iana"},
  "application/sensml+json": {"source":"iana","compressible":true},
  "application/sensml+xml": {"source":"iana","compressible":true,"extensions":["sensmlx"]},
  "application/sensml-exi": {"source":"iana"},
  "application/sep+xml": {"source":"iana","compressible":true},
  "application/sep-exi": {"source":"iana"},
  "application/session-info": {"source":"iana"},
  "application/set-payment": {"source":"iana"},
  "application/set-payment-initiation": {"source":"iana","extensions":["setpay"]},
  "application/set-registration": {"source":"iana"},
  "application/set-registration-initiation": {"source":"iana","extensions":["setreg"]},
  "application/sgml": {"source":"iana"},
  "application/sgml-open-catalog": {"source":"iana"},
  "application/shf+xml": {"source":"iana","compressible":true,"extensions":["shf"]},
  "application/sieve": {"source":"iana","extensions":["siv","sieve"]},
  "application/simple-filter+xml": {"source":"iana","compressible":true},
  "application/simple-message-summary": {"source":"iana"},
  "application/simplesymbolcontainer": {"source":"iana"},
  "application/sipc": {"source":"iana"},
  "application/slate": {"source":"iana"},
  "application/smil": {"source":"apache"},
  "application/smil+xml": {"source":"iana","compressible":true,"extensions":["smi","smil"]},
  "application/smpte336m": {"source":"iana"},
  "application/soap+fastinfoset": {"source":"iana"},
  "application/soap+xml": {"source":"iana","compressible":true},
  "application/sparql-query": {"source":"iana","extensions":["rq"]},
  "application/sparql-results+xml": {"source":"iana","compressible":true,"extensions":["srx"]},
  "application/spdx+json": {"source":"iana","compressible":true},
  "application/spirits-event+xml": {"source":"iana","compressible":true},
  "application/sql": {"source":"iana","extensions":["sql"]},
  "application/srgs": {"source":"iana","extensions":["gram"]},
  "application/srgs+xml": {"source":"iana","compressible":true,"extensions":["grxml"]},
  "application/sru+xml": {"source":"iana","compressible":true,"extensions":["sru"]},
  "application/ssdl+xml": {"source":"apache","compressible":true,"extensions":["ssdl"]},
  "application/sslkeylogfile": {"source":"iana"},
  "application/ssml+xml": {"source":"iana","compressible":true,"extensions":["ssml"]},
  "application/st2110-41": {"source":"iana"},
  "application/stix+json": {"source":"iana","compressible":true},
  "application/stratum": {"source":"iana"},
  "application/swid+cbor": {"source":"iana"},
  "application/swid+xml": {"source":"iana","compressible":true,"extensions":["swidtag"]},
  "application/tamp-apex-update": {"source":"iana"},
  "application/tamp-apex-update-confirm": {"source":"iana"},
  "application/tamp-community-update": {"source":"iana"},
  "application/tamp-community-update-confirm": {"source":"iana"},
  "application/tamp-error": {"source":"iana"},
  "application/tamp-sequence-adjust": {"source":"iana"},
  "application/tamp-sequence-adjust-confirm": {"source":"iana"},
  "application/tamp-status-query": {"source":"iana"},
  "application/tamp-status-response": {"source":"iana"},
  "application/tamp-update": {"source":"iana"},
  "application/tamp-update-confirm": {"source":"iana"},
  "application/tar": {"compressible":true},
  "application/taxii+json": {"source":"iana","compressible":true},
  "application/td+json": {"source":"iana","compressible":true},
  "application/tei+xml": {"source":"iana","compressible":true,"extensions":["tei","teicorpus"]},
  "application/tetra_isi": {"source":"iana"},
  "application/thraud+xml": {"source":"iana","compressible":true,"extensions":["tfi"]},
  "application/timestamp-query": {"source":"iana"},
  "application/timestamp-reply": {"source":"iana"},
  "application/timestamped-data": {"source":"iana","extensions":["tsd"]},
  "application/tlsrpt+gzip": {"source":"iana"},
  "application/tlsrpt+json": {"source":"iana","compressible":true},
  "application/tm+json": {"source":"iana","compressible":true},
  "application/tnauthlist": {"source":"iana"},
  "application/toc+cbor": {"source":"iana"},
  "application/token-introspection+jwt": {"source":"iana"},
  "application/toml": {"source":"iana","compressible":true,"extensions":["toml"]},
  "application/trickle-ice-sdpfrag": {"source":"iana"},
  "application/trig": {"source":"iana","extensions":["trig"]},
  "application/trust-chain+json": {"source":"iana","compressible":true},
  "application/trust-mark+jwt": {"source":"iana"},
  "application/trust-mark-delegation+jwt": {"source":"iana"},
  "application/ttml+xml": {"source":"iana","compressible":true,"extensions":["ttml"]},
  "application/tve-trigger": {"source":"iana"},
  "application/tzif": {"source":"iana"},
  "application/tzif-leap": {"source":"iana"},
  "application/ubjson": {"compressible":false,"extensions":["ubj"]},
  "application/uccs+cbor": {"source":"iana"},
  "application/ujcs+json": {"source":"iana","compressible":true},
  "application/ulpfec": {"source":"iana"},
  "application/urc-grpsheet+xml": {"source":"iana","compressible":true},
  "application/urc-ressheet+xml": {"source":"iana","compressible":true,"extensions":["rsheet"]},
  "application/urc-targetdesc+xml": {"source":"iana","compressible":true,"extensions":["td"]},
  "application/urc-uisocketdesc+xml": {"source":"iana","compressible":true},
  "application/vc": {"source":"iana"},
  "application/vc+cose": {"source":"iana"},
  "application/vc+jwt": {"source":"iana"},
  "application/vcard+json": {"source":"iana","compressible":true},
  "application/vcard+xml": {"source":"iana","compressible":true},
  "application/vemmi": {"source":"iana"},
  "application/vividence.scriptfile": {"source":"apache"},
  "application/vnd.1000minds.decision-model+xml": {"source":"iana","compressible":true,"extensions":["1km"]},
  "application/vnd.1ob": {"source":"iana"},
  "application/vnd.3gpp-prose+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp-prose-pc3a+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp-prose-pc3ach+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp-prose-pc3ch+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp-prose-pc8+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp-v2x-local-service-information": {"source":"iana"},
  "application/vnd.3gpp.5gnas": {"source":"iana"},
  "application/vnd.3gpp.5gsa2x": {"source":"iana"},
  "application/vnd.3gpp.5gsa2x-local-service-information": {"source":"iana"},
  "application/vnd.3gpp.5gsv2x": {"source":"iana"},
  "application/vnd.3gpp.5gsv2x-local-service-information": {"source":"iana"},
  "application/vnd.3gpp.access-transfer-events+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.bsf+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.crs+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.current-location-discovery+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.gmop+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.gtpc": {"source":"iana"},
  "application/vnd.3gpp.interworking-data": {"source":"iana"},
  "application/vnd.3gpp.lpp": {"source":"iana"},
  "application/vnd.3gpp.mc-signalling-ear": {"source":"iana"},
  "application/vnd.3gpp.mcdata-affiliation-command+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcdata-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcdata-msgstore-ctrl-request+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcdata-payload": {"source":"iana"},
  "application/vnd.3gpp.mcdata-regroup+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcdata-service-config+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcdata-signalling": {"source":"iana"},
  "application/vnd.3gpp.mcdata-ue-config+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcdata-user-profile+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcptt-affiliation-command+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcptt-floor-request+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcptt-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcptt-location-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcptt-regroup+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcptt-service-config+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcptt-signed+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcptt-ue-config+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcptt-ue-init-config+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcptt-user-profile+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcvideo-affiliation-command+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcvideo-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcvideo-location-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcvideo-regroup+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcvideo-service-config+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcvideo-transmission-request+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcvideo-ue-config+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mcvideo-user-profile+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.mid-call+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.ngap": {"source":"iana"},
  "application/vnd.3gpp.pfcp": {"source":"iana"},
  "application/vnd.3gpp.pic-bw-large": {"source":"iana","extensions":["plb"]},
  "application/vnd.3gpp.pic-bw-small": {"source":"iana","extensions":["psb"]},
  "application/vnd.3gpp.pic-bw-var": {"source":"iana","extensions":["pvb"]},
  "application/vnd.3gpp.pinapp-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.s1ap": {"source":"iana"},
  "application/vnd.3gpp.seal-group-doc+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.seal-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.seal-location-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.seal-mbms-usage-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.seal-network-qos-management-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.seal-ue-config-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.seal-unicast-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.seal-user-profile-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.sms": {"source":"iana"},
  "application/vnd.3gpp.sms+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.srvcc-ext+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.srvcc-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.state-and-event-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.ussd+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp.v2x": {"source":"iana"},
  "application/vnd.3gpp.vae-info+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp2.bcmcsinfo+xml": {"source":"iana","compressible":true},
  "application/vnd.3gpp2.sms": {"source":"iana"},
  "application/vnd.3gpp2.tcap": {"source":"iana","extensions":["tcap"]},
  "application/vnd.3lightssoftware.imagescal": {"source":"iana"},
  "application/vnd.3m.post-it-notes": {"source":"iana","extensions":["pwn"]},
  "application/vnd.accpac.simply.aso": {"source":"iana","extensions":["aso"]},
  "application/vnd.accpac.simply.imp": {"source":"iana","extensions":["imp"]},
  "application/vnd.acm.addressxfer+json": {"source":"iana","compressible":true},
  "application/vnd.acm.chatbot+json": {"source":"iana","compressible":true},
  "application/vnd.acucobol": {"source":"iana","extensions":["acu"]},
  "application/vnd.acucorp": {"source":"iana","extensions":["atc","acutc"]},
  "application/vnd.adobe.air-application-installer-package+zip": {"source":"apache","compressible":false,"extensions":["air"]},
  "application/vnd.adobe.flash.movie": {"source":"iana"},
  "application/vnd.adobe.formscentral.fcdt": {"source":"iana","extensions":["fcdt"]},
  "application/vnd.adobe.fxp": {"source":"iana","extensions":["fxp","fxpl"]},
  "application/vnd.adobe.partial-upload": {"source":"iana"},
  "application/vnd.adobe.xdp+xml": {"source":"iana","compressible":true,"extensions":["xdp"]},
  "application/vnd.adobe.xfdf": {"source":"apache","extensions":["xfdf"]},
  "application/vnd.aether.imp": {"source":"iana"},
  "application/vnd.afpc.afplinedata": {"source":"iana"},
  "application/vnd.afpc.afplinedata-pagedef": {"source":"iana"},
  "application/vnd.afpc.cmoca-cmresource": {"source":"iana"},
  "application/vnd.afpc.foca-charset": {"source":"iana"},
  "application/vnd.afpc.foca-codedfont": {"source":"iana"},
  "application/vnd.afpc.foca-codepage": {"source":"iana"},
  "application/vnd.afpc.modca": {"source":"iana"},
  "application/vnd.afpc.modca-cmtable": {"source":"iana"},
  "application/vnd.afpc.modca-formdef": {"source":"iana"},
  "application/vnd.afpc.modca-mediummap": {"source":"iana"},
  "application/vnd.afpc.modca-objectcontainer": {"source":"iana"},
  "application/vnd.afpc.modca-overlay": {"source":"iana"},
  "application/vnd.afpc.modca-pagesegment": {"source":"iana"},
  "application/vnd.age": {"source":"iana","extensions":["age"]},
  "application/vnd.ah-barcode": {"source":"apache"},
  "application/vnd.ahead.space": {"source":"iana","extensions":["ahead"]},
  "application/vnd.airzip.filesecure.azf": {"source":"iana","extensions":["azf"]},
  "application/vnd.airzip.filesecure.azs": {"source":"iana","extensions":["azs"]},
  "application/vnd.amadeus+json": {"source":"iana","compressible":true},
  "application/vnd.amazon.ebook": {"source":"apache","extensions":["azw"]},
  "application/vnd.amazon.mobi8-ebook": {"source":"iana"},
  "application/vnd.americandynamics.acc": {"source":"iana","extensions":["acc"]},
  "application/vnd.amiga.ami": {"source":"iana","extensions":["ami"]},
  "application/vnd.amundsen.maze+xml": {"source":"iana","compressible":true},
  "application/vnd.android.ota": {"source":"iana"},
  "application/vnd.android.package-archive": {"source":"apache","compressible":false,"extensions":["apk"]},
  "application/vnd.anki": {"source":"iana"},
  "application/vnd.anser-web-certificate-issue-initiation": {"source":"iana","extensions":["cii"]},
  "application/vnd.anser-web-funds-transfer-initiation": {"source":"apache","extensions":["fti"]},
  "application/vnd.antix.game-component": {"source":"iana","extensions":["atx"]},
  "application/vnd.apache.arrow.file": {"source":"iana"},
  "application/vnd.apache.arrow.stream": {"source":"iana"},
  "application/vnd.apache.parquet": {"source":"iana"},
  "application/vnd.apache.thrift.binary": {"source":"iana"},
  "application/vnd.apache.thrift.compact": {"source":"iana"},
  "application/vnd.apache.thrift.json": {"source":"iana"},
  "application/vnd.apexlang": {"source":"iana"},
  "application/vnd.api+json": {"source":"iana","compressible":true},
  "application/vnd.aplextor.warrp+json": {"source":"iana","compressible":true},
  "application/vnd.apothekende.reservation+json": {"source":"iana","compressible":true},
  "application/vnd.apple.installer+xml": {"source":"iana","compressible":true,"extensions":["mpkg"]},
  "application/vnd.apple.keynote": {"source":"iana","extensions":["key"]},
  "application/vnd.apple.mpegurl": {"source":"iana","extensions":["m3u8"]},
  "application/vnd.apple.numbers": {"source":"iana","extensions":["numbers"]},
  "application/vnd.apple.pages": {"source":"iana","extensions":["pages"]},
  "application/vnd.apple.pkpass": {"compressible":false,"extensions":["pkpass"]},
  "application/vnd.arastra.swi": {"source":"apache"},
  "application/vnd.aristanetworks.swi": {"source":"iana","extensions":["swi"]},
  "application/vnd.artisan+json": {"source":"iana","compressible":true},
  "application/vnd.artsquare": {"source":"iana"},
  "application/vnd.astraea-software.iota": {"source":"iana","extensions":["iota"]},
  "application/vnd.audiograph": {"source":"iana","extensions":["aep"]},
  "application/vnd.autodesk.fbx": {"extensions":["fbx"]},
  "application/vnd.autopackage": {"source":"iana"},
  "application/vnd.avalon+json": {"source":"iana","compressible":true},
  "application/vnd.avistar+xml": {"source":"iana","compressible":true},
  "application/vnd.balsamiq.bmml+xml": {"source":"iana","compressible":true,"extensions":["bmml"]},
  "application/vnd.balsamiq.bmpr": {"source":"iana"},
  "application/vnd.banana-accounting": {"source":"iana"},
  "application/vnd.bbf.usp.error": {"source":"iana"},
  "application/vnd.bbf.usp.msg": {"source":"iana"},
  "application/vnd.bbf.usp.msg+json": {"source":"iana","compressible":true},
  "application/vnd.bekitzur-stech+json": {"source":"iana","compressible":true},
  "application/vnd.belightsoft.lhzd+zip": {"source":"iana","compressible":false},
  "application/vnd.belightsoft.lhzl+zip": {"source":"iana","compressible":false},
  "application/vnd.bint.med-content": {"source":"iana"},
  "application/vnd.biopax.rdf+xml": {"source":"iana","compressible":true},
  "application/vnd.blink-idb-value-wrapper": {"source":"iana"},
  "application/vnd.blueice.multipass": {"source":"iana","extensions":["mpm"]},
  "application/vnd.bluetooth.ep.oob": {"source":"iana"},
  "application/vnd.bluetooth.le.oob": {"source":"iana"},
  "application/vnd.bmi": {"source":"iana","extensions":["bmi"]},
  "application/vnd.bpf": {"source":"iana"},
  "application/vnd.bpf3": {"source":"iana"},
  "application/vnd.businessobjects": {"source":"iana","extensions":["rep"]},
  "application/vnd.byu.uapi+json": {"source":"iana","compressible":true},
  "application/vnd.bzip3": {"source":"iana"},
  "application/vnd.c3voc.schedule+xml": {"source":"iana","compressible":true},
  "application/vnd.cab-jscript": {"source":"iana"},
  "application/vnd.canon-cpdl": {"source":"iana"},
  "application/vnd.canon-lips": {"source":"iana"},
  "application/vnd.capasystems-pg+json": {"source":"iana","compressible":true},
  "application/vnd.cendio.thinlinc.clientconf": {"source":"iana"},
  "application/vnd.century-systems.tcp_stream": {"source":"iana"},
  "application/vnd.chemdraw+xml": {"source":"iana","compressible":true,"extensions":["cdxml"]},
  "application/vnd.chess-pgn": {"source":"iana"},
  "application/vnd.chipnuts.karaoke-mmd": {"source":"iana","extensions":["mmd"]},
  "application/vnd.ciedi": {"source":"iana"},
  "application/vnd.cinderella": {"source":"iana","extensions":["cdy"]},
  "application/vnd.cirpack.isdn-ext": {"source":"iana"},
  "application/vnd.citationstyles.style+xml": {"source":"iana","compressible":true,"extensions":["csl"]},
  "application/vnd.claymore": {"source":"iana","extensions":["cla"]},
  "application/vnd.cloanto.rp9": {"source":"iana","extensions":["rp9"]},
  "application/vnd.clonk.c4group": {"source":"iana","extensions":["c4g","c4d","c4f","c4p","c4u"]},
  "application/vnd.cluetrust.cartomobile-config": {"source":"iana","extensions":["c11amc"]},
  "application/vnd.cluetrust.cartomobile-config-pkg": {"source":"iana","extensions":["c11amz"]},
  "application/vnd.cncf.helm.chart.content.v1.tar+gzip": {"source":"iana"},
  "application/vnd.cncf.helm.chart.provenance.v1.prov": {"source":"iana"},
  "application/vnd.cncf.helm.config.v1+json": {"source":"iana","compressible":true},
  "application/vnd.coffeescript": {"source":"iana"},
  "application/vnd.collabio.xodocuments.document": {"source":"iana"},
  "application/vnd.collabio.xodocuments.document-template": {"source":"iana"},
  "application/vnd.collabio.xodocuments.presentation": {"source":"iana"},
  "application/vnd.collabio.xodocuments.presentation-template": {"source":"iana"},
  "application/vnd.collabio.xodocuments.spreadsheet": {"source":"iana"},
  "application/vnd.collabio.xodocuments.spreadsheet-template": {"source":"iana"},
  "application/vnd.collection+json": {"source":"iana","compressible":true},
  "application/vnd.collection.doc+json": {"source":"iana","compressible":true},
  "application/vnd.collection.next+json": {"source":"iana","compressible":true},
  "application/vnd.comicbook+zip": {"source":"iana","compressible":false},
  "application/vnd.comicbook-rar": {"source":"iana"},
  "application/vnd.commerce-battelle": {"source":"iana"},
  "application/vnd.commonspace": {"source":"iana","extensions":["csp"]},
  "application/vnd.contact.cmsg": {"source":"iana","extensions":["cdbcmsg"]},
  "application/vnd.coreos.ignition+json": {"source":"iana","compressible":true},
  "application/vnd.cosmocaller": {"source":"iana","extensions":["cmc"]},
  "application/vnd.crick.clicker": {"source":"iana","extensions":["clkx"]},
  "application/vnd.crick.clicker.keyboard": {"source":"iana","extensions":["clkk"]},
  "application/vnd.crick.clicker.palette": {"source":"iana","extensions":["clkp"]},
  "application/vnd.crick.clicker.template": {"source":"iana","extensions":["clkt"]},
  "application/vnd.crick.clicker.wordbank": {"source":"iana","extensions":["clkw"]},
  "application/vnd.criticaltools.wbs+xml": {"source":"iana","compressible":true,"extensions":["wbs"]},
  "application/vnd.cryptii.pipe+json": {"source":"iana","compressible":true},
  "application/vnd.crypto-shade-file": {"source":"iana"},
  "application/vnd.cryptomator.encrypted": {"source":"iana"},
  "application/vnd.cryptomator.vault": {"source":"iana"},
  "application/vnd.ctc-posml": {"source":"iana","extensions":["pml"]},
  "application/vnd.ctct.ws+xml": {"source":"iana","compressible":true},
  "application/vnd.cups-pdf": {"source":"iana"},
  "application/vnd.cups-postscript": {"source":"iana"},
  "application/vnd.cups-ppd": {"source":"iana","extensions":["ppd"]},
  "application/vnd.cups-raster": {"source":"iana"},
  "application/vnd.cups-raw": {"source":"iana"},
  "application/vnd.curl": {"source":"iana"},
  "application/vnd.curl.car": {"source":"apache","extensions":["car"]},
  "application/vnd.curl.pcurl": {"source":"apache","extensions":["pcurl"]},
  "application/vnd.cyan.dean.root+xml": {"source":"iana","compressible":true},
  "application/vnd.cybank": {"source":"iana"},
  "application/vnd.cyclonedx+json": {"source":"iana","compressible":true},
  "application/vnd.cyclonedx+xml": {"source":"iana","compressible":true},
  "application/vnd.d2l.coursepackage1p0+zip": {"source":"iana","compressible":false},
  "application/vnd.d3m-dataset": {"source":"iana"},
  "application/vnd.d3m-problem": {"source":"iana"},
  "application/vnd.dart": {"source":"iana","compressible":true,"extensions":["dart"]},
  "application/vnd.data-vision.rdz": {"source":"iana","extensions":["rdz"]},
  "application/vnd.datalog": {"source":"iana"},
  "application/vnd.datapackage+json": {"source":"iana","compressible":true},
  "application/vnd.dataresource+json": {"source":"iana","compressible":true},
  "application/vnd.dbf": {"source":"iana","extensions":["dbf"]},
  "application/vnd.dcmp+xml": {"source":"iana","compressible":true,"extensions":["dcmp"]},
  "application/vnd.debian.binary-package": {"source":"iana"},
  "application/vnd.dece.data": {"source":"iana","extensions":["uvf","uvvf","uvd","uvvd"]},
  "application/vnd.dece.ttml+xml": {"source":"iana","compressible":true,"extensions":["uvt","uvvt"]},
  "application/vnd.dece.unspecified": {"source":"iana","extensions":["uvx","uvvx"]},
  "application/vnd.dece.zip": {"source":"iana","extensions":["uvz","uvvz"]},
  "application/vnd.denovo.fcselayout-link": {"source":"iana","extensions":["fe_launch"]},
  "application/vnd.desmume.movie": {"source":"iana"},
  "application/vnd.dir-bi.plate-dl-nosuffix": {"source":"iana"},
  "application/vnd.dm.delegation+xml": {"source":"iana","compressible":true},
  "application/vnd.dna": {"source":"iana","extensions":["dna"]},
  "application/vnd.document+json": {"source":"iana","compressible":true},
  "application/vnd.dolby.mlp": {"source":"apache","extensions":["mlp"]},
  "application/vnd.dolby.mobile.1": {"source":"iana"},
  "application/vnd.dolby.mobile.2": {"source":"iana"},
  "application/vnd.doremir.scorecloud-binary-document": {"source":"iana"},
  "application/vnd.dpgraph": {"source":"iana","extensions":["dpg"]},
  "application/vnd.dreamfactory": {"source":"iana","extensions":["dfac"]},
  "application/vnd.drive+json": {"source":"iana","compressible":true},
  "application/vnd.ds-keypoint": {"source":"apache","extensions":["kpxx"]},
  "application/vnd.dtg.local": {"source":"iana"},
  "application/vnd.dtg.local.flash": {"source":"iana"},
  "application/vnd.dtg.local.html": {"source":"iana"},
  "application/vnd.dvb.ait": {"source":"iana","extensions":["ait"]},
  "application/vnd.dvb.dvbisl+xml": {"source":"iana","compressible":true},
  "application/vnd.dvb.dvbj": {"source":"iana"},
  "application/vnd.dvb.esgcontainer": {"source":"iana"},
  "application/vnd.dvb.ipdcdftnotifaccess": {"source":"iana"},
  "application/vnd.dvb.ipdcesgaccess": {"source":"iana"},
  "application/vnd.dvb.ipdcesgaccess2": {"source":"iana"},
  "application/vnd.dvb.ipdcesgpdd": {"source":"iana"},
  "application/vnd.dvb.ipdcroaming": {"source":"iana"},
  "application/vnd.dvb.iptv.alfec-base": {"source":"iana"},
  "application/vnd.dvb.iptv.alfec-enhancement": {"source":"iana"},
  "application/vnd.dvb.notif-aggregate-root+xml": {"source":"iana","compressible":true},
  "application/vnd.dvb.notif-container+xml": {"source":"iana","compressible":true},
  "application/vnd.dvb.notif-generic+xml": {"source":"iana","compressible":true},
  "application/vnd.dvb.notif-ia-msglist+xml": {"source":"iana","compressible":true},
  "application/vnd.dvb.notif-ia-registration-request+xml": {"source":"iana","compressible":true},
  "application/vnd.dvb.notif-ia-registration-response+xml": {"source":"iana","compressible":true},
  "application/vnd.dvb.notif-init+xml": {"source":"iana","compressible":true},
  "application/vnd.dvb.pfr": {"source":"iana"},
  "application/vnd.dvb.service": {"source":"iana","extensions":["svc"]},
  "application/vnd.dxr": {"source":"iana"},
  "application/vnd.dynageo": {"source":"iana","extensions":["geo"]},
  "application/vnd.dzr": {"source":"iana"},
  "application/vnd.easykaraoke.cdgdownload": {"source":"iana"},
  "application/vnd.ecdis-update": {"source":"iana"},
  "application/vnd.ecip.rlp": {"source":"iana"},
  "application/vnd.eclipse.ditto+json": {"source":"iana","compressible":true},
  "application/vnd.ecowin.chart": {"source":"iana","extensions":["mag"]},
  "application/vnd.ecowin.filerequest": {"source":"iana"},
  "application/vnd.ecowin.fileupdate": {"source":"iana"},
  "application/vnd.ecowin.series": {"source":"iana"},
  "application/vnd.ecowin.seriesrequest": {"source":"iana"},
  "application/vnd.ecowin.seriesupdate": {"source":"iana"},
  "application/vnd.efi.img": {"source":"iana"},
  "application/vnd.efi.iso": {"source":"iana"},
  "application/vnd.eln+zip": {"source":"iana","compressible":false},
  "application/vnd.emclient.accessrequest+xml": {"source":"iana","compressible":true},
  "application/vnd.enliven": {"source":"iana","extensions":["nml"]},
  "application/vnd.enphase.envoy": {"source":"iana"},
  "application/vnd.eprints.data+xml": {"source":"iana","compressible":true},
  "application/vnd.epson.esf": {"source":"iana","extensions":["esf"]},
  "application/vnd.epson.msf": {"source":"iana","extensions":["msf"]},
  "application/vnd.epson.quickanime": {"source":"iana","extensions":["qam"]},
  "application/vnd.epson.salt": {"source":"iana","extensions":["slt"]},
  "application/vnd.epson.ssf": {"source":"iana","extensions":["ssf"]},
  "application/vnd.ericsson.quickcall": {"source":"iana"},
  "application/vnd.erofs": {"source":"iana"},
  "application/vnd.espass-espass+zip": {"source":"iana","compressible":false},
  "application/vnd.eszigno3+xml": {"source":"iana","compressible":true,"extensions":["es3","et3"]},
  "application/vnd.etsi.aoc+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.asic-e+zip": {"source":"iana","compressible":false},
  "application/vnd.etsi.asic-s+zip": {"source":"iana","compressible":false},
  "application/vnd.etsi.cug+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.iptvcommand+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.iptvdiscovery+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.iptvprofile+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.iptvsad-bc+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.iptvsad-cod+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.iptvsad-npvr+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.iptvservice+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.iptvsync+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.iptvueprofile+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.mcid+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.mheg5": {"source":"iana"},
  "application/vnd.etsi.overload-control-policy-dataset+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.pstn+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.sci+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.simservs+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.timestamp-token": {"source":"iana"},
  "application/vnd.etsi.tsl+xml": {"source":"iana","compressible":true},
  "application/vnd.etsi.tsl.der": {"source":"iana"},
  "application/vnd.eu.kasparian.car+json": {"source":"iana","compressible":true},
  "application/vnd.eudora.data": {"source":"iana"},
  "application/vnd.evolv.ecig.profile": {"source":"iana"},
  "application/vnd.evolv.ecig.settings": {"source":"iana"},
  "application/vnd.evolv.ecig.theme": {"source":"iana"},
  "application/vnd.exstream-empower+zip": {"source":"iana","compressible":false},
  "application/vnd.exstream-package": {"source":"iana"},
  "application/vnd.ezpix-album": {"source":"iana","extensions":["ez2"]},
  "application/vnd.ezpix-package": {"source":"iana","extensions":["ez3"]},
  "application/vnd.f-secure.mobile": {"source":"iana"},
  "application/vnd.familysearch.gedcom+zip": {"source":"iana","compressible":false},
  "application/vnd.fastcopy-disk-image": {"source":"iana"},
  "application/vnd.fdf": {"source":"apache","extensions":["fdf"]},
  "application/vnd.fdsn.mseed": {"source":"iana","extensions":["mseed"]},
  "application/vnd.fdsn.seed": {"source":"iana","extensions":["seed","dataless"]},
  "application/vnd.fdsn.stationxml+xml": {"source":"iana","charset":"XML-BASED","compressible":true},
  "application/vnd.ffsns": {"source":"iana"},
  "application/vnd.ficlab.flb+zip": {"source":"iana","compressible":false},
  "application/vnd.filmit.zfc": {"source":"iana"},
  "application/vnd.fints": {"source":"iana"},
  "application/vnd.firemonkeys.cloudcell": {"source":"iana"},
  "application/vnd.flographit": {"source":"iana","extensions":["gph"]},
  "application/vnd.fluxtime.clip": {"source":"iana","extensions":["ftc"]},
  "application/vnd.font-fontforge-sfd": {"source":"iana"},
  "application/vnd.framemaker": {"source":"iana","extensions":["fm","frame","maker","book"]},
  "application/vnd.freelog.comic": {"source":"iana"},
  "application/vnd.frogans.fnc": {"source":"apache","extensions":["fnc"]},
  "application/vnd.frogans.ltf": {"source":"apache","extensions":["ltf"]},
  "application/vnd.fsc.weblaunch": {"source":"iana","extensions":["fsc"]},
  "application/vnd.fujifilm.fb.docuworks": {"source":"iana"},
  "application/vnd.fujifilm.fb.docuworks.binder": {"source":"iana"},
  "application/vnd.fujifilm.fb.docuworks.container": {"source":"iana"},
  "application/vnd.fujifilm.fb.jfi+xml": {"source":"iana","compressible":true},
  "application/vnd.fujitsu.oasys": {"source":"iana","extensions":["oas"]},
  "application/vnd.fujitsu.oasys2": {"source":"iana","extensions":["oa2"]},
  "application/vnd.fujitsu.oasys3": {"source":"iana","extensions":["oa3"]},
  "application/vnd.fujitsu.oasysgp": {"source":"iana","extensions":["fg5"]},
  "application/vnd.fujitsu.oasysprs": {"source":"iana","extensions":["bh2"]},
  "application/vnd.fujixerox.art-ex": {"source":"iana"},
  "application/vnd.fujixerox.art4": {"source":"iana"},
  "application/vnd.fujixerox.ddd": {"source":"iana","extensions":["ddd"]},
  "application/vnd.fujixerox.docuworks": {"source":"iana","extensions":["xdw"]},
  "application/vnd.fujixerox.docuworks.binder": {"source":"iana","extensions":["xbd"]},
  "application/vnd.fujixerox.docuworks.container": {"source":"iana"},
  "application/vnd.fujixerox.hbpl": {"source":"iana"},
  "application/vnd.fut-misnet": {"source":"iana"},
  "application/vnd.futoin+cbor": {"source":"iana"},
  "application/vnd.futoin+json": {"source":"iana","compressible":true},
  "application/vnd.fuzzysheet": {"source":"iana","extensions":["fzs"]},
  "application/vnd.ga4gh.passport+jwt": {"source":"iana"},
  "application/vnd.genomatix.tuxedo": {"source":"iana","extensions":["txd"]},
  "application/vnd.genozip": {"source":"iana"},
  "application/vnd.gentics.grd+json": {"source":"iana","compressible":true},
  "application/vnd.gentoo.catmetadata+xml": {"source":"iana","compressible":true},
  "application/vnd.gentoo.ebuild": {"source":"iana"},
  "application/vnd.gentoo.eclass": {"source":"iana"},
  "application/vnd.gentoo.gpkg": {"source":"iana"},
  "application/vnd.gentoo.manifest": {"source":"iana"},
  "application/vnd.gentoo.pkgmetadata+xml": {"source":"iana","compressible":true},
  "application/vnd.gentoo.xpak": {"source":"iana"},
  "application/vnd.geo+json": {"source":"apache","compressible":true},
  "application/vnd.geocube+xml": {"source":"apache","compressible":true},
  "application/vnd.geogebra.file": {"source":"iana","extensions":["ggb"]},
  "application/vnd.geogebra.pinboard": {"source":"iana"},
  "application/vnd.geogebra.slides": {"source":"iana","extensions":["ggs"]},
  "application/vnd.geogebra.tool": {"source":"iana","extensions":["ggt"]},
  "application/vnd.geometry-explorer": {"source":"iana","extensions":["gex","gre"]},
  "application/vnd.geonext": {"source":"iana","extensions":["gxt"]},
  "application/vnd.geoplan": {"source":"iana","extensions":["g2w"]},
  "application/vnd.geospace": {"source":"iana","extensions":["g3w"]},
  "application/vnd.gerber": {"source":"iana"},
  "application/vnd.globalplatform.card-content-mgt": {"source":"iana"},
  "application/vnd.globalplatform.card-content-mgt-response": {"source":"iana"},
  "application/vnd.gmx": {"source":"iana","extensions":["gmx"]},
  "application/vnd.gnu.taler.exchange+json": {"source":"iana","compressible":true},
  "application/vnd.gnu.taler.merchant+json": {"source":"iana","compressible":true},
  "application/vnd.google-apps.audio": {},
  "application/vnd.google-apps.document": {"compressible":false,"extensions":["gdoc"]},
  "application/vnd.google-apps.drawing": {"compressible":false,"extensions":["gdraw"]},
  "application/vnd.google-apps.drive-sdk": {"compressible":false},
  "application/vnd.google-apps.file": {},
  "application/vnd.google-apps.folder": {"compressible":false},
  "application/vnd.google-apps.form": {"compressible":false,"extensions":["gform"]},
  "application/vnd.google-apps.fusiontable": {},
  "application/vnd.google-apps.jam": {"compressible":false,"extensions":["gjam"]},
  "application/vnd.google-apps.mail-layout": {},
  "application/vnd.google-apps.map": {"compressible":false,"extensions":["gmap"]},
  "application/vnd.google-apps.photo": {},
  "application/vnd.google-apps.presentation": {"compressible":false,"extensions":["gslides"]},
  "application/vnd.google-apps.script": {"compressible":false,"extensions":["gscript"]},
  "application/vnd.google-apps.shortcut": {},
  "application/vnd.google-apps.site": {"compressible":false,"extensions":["gsite"]},
  "application/vnd.google-apps.spreadsheet": {"compressible":false,"extensions":["gsheet"]},
  "application/vnd.google-apps.unknown": {},
  "application/vnd.google-apps.video": {},
  "application/vnd.google-earth.kml+xml": {"source":"iana","compressible":true,"extensions":["kml"]},
  "application/vnd.google-earth.kmz": {"source":"iana","compressible":false,"extensions":["kmz"]},
  "application/vnd.gov.sk.e-form+xml": {"source":"apache","compressible":true},
  "application/vnd.gov.sk.e-form+zip": {"source":"iana","compressible":false},
  "application/vnd.gov.sk.xmldatacontainer+xml": {"source":"iana","compressible":true,"extensions":["xdcf"]},
  "application/vnd.gpxsee.map+xml": {"source":"iana","compressible":true},
  "application/vnd.grafeq": {"source":"iana","extensions":["gqf","gqs"]},
  "application/vnd.gridmp": {"source":"iana"},
  "application/vnd.groove-account": {"source":"iana","extensions":["gac"]},
  "application/vnd.groove-help": {"source":"iana","extensions":["ghf"]},
  "application/vnd.groove-identity-message": {"source":"iana","extensions":["gim"]},
  "application/vnd.groove-injector": {"source":"iana","extensions":["grv"]},
  "application/vnd.groove-tool-message": {"source":"iana","extensions":["gtm"]},
  "application/vnd.groove-tool-template": {"source":"iana","extensions":["tpl"]},
  "application/vnd.groove-vcard": {"source":"iana","extensions":["vcg"]},
  "application/vnd.hal+json": {"source":"iana","compressible":true},
  "application/vnd.hal+xml": {"source":"iana","compressible":true,"extensions":["hal"]},
  "application/vnd.handheld-entertainment+xml": {"source":"iana","compressible":true,"extensions":["zmm"]},
  "application/vnd.hbci": {"source":"iana","extensions":["hbci"]},
  "application/vnd.hc+json": {"source":"iana","compressible":true},
  "application/vnd.hcl-bireports": {"source":"iana"},
  "application/vnd.hdt": {"source":"iana"},
  "application/vnd.heroku+json": {"source":"iana","compressible":true},
  "application/vnd.hhe.lesson-player": {"source":"iana","extensions":["les"]},
  "application/vnd.hp-hpgl": {"source":"iana","extensions":["hpgl"]},
  "application/vnd.hp-hpid": {"source":"iana","extensions":["hpid"]},
  "application/vnd.hp-hps": {"source":"iana","extensions":["hps"]},
  "application/vnd.hp-jlyt": {"source":"iana","extensions":["jlt"]},
  "application/vnd.hp-pcl": {"source":"iana","extensions":["pcl"]},
  "application/vnd.hp-pclxl": {"source":"iana","extensions":["pclxl"]},
  "application/vnd.hsl": {"source":"iana"},
  "application/vnd.httphone": {"source":"iana"},
  "application/vnd.hydrostatix.sof-data": {"source":"iana","extensions":["sfd-hdstx"]},
  "application/vnd.hyper+json": {"source":"iana","compressible":true},
  "application/vnd.hyper-item+json": {"source":"iana","compressible":true},
  "application/vnd.hyperdrive+json": {"source":"iana","compressible":true},
  "application/vnd.hzn-3d-crossword": {"source":"iana"},
  "application/vnd.ibm.afplinedata": {"source":"apache"},
  "application/vnd.ibm.electronic-media": {"source":"iana"},
  "application/vnd.ibm.minipay": {"source":"iana","extensions":["mpy"]},
  "application/vnd.ibm.modcap": {"source":"apache","extensions":["afp","listafp","list3820"]},
  "application/vnd.ibm.rights-management": {"source":"iana","extensions":["irm"]},
  "application/vnd.ibm.secure-container": {"source":"iana","extensions":["sc"]},
  "application/vnd.iccprofile": {"source":"iana","extensions":["icc","icm"]},
  "application/vnd.ieee.1905": {"source":"iana"},
  "application/vnd.igloader": {"source":"iana","extensions":["igl"]},
  "application/vnd.imagemeter.folder+zip": {"source":"iana","compressible":false},
  "application/vnd.imagemeter.image+zip": {"source":"iana","compressible":false},
  "application/vnd.immervision-ivp": {"source":"iana","extensions":["ivp"]},
  "application/vnd.immervision-ivu": {"source":"iana","extensions":["ivu"]},
  "application/vnd.ims.imsccv1p1": {"source":"iana"},
  "application/vnd.ims.imsccv1p2": {"source":"iana"},
  "application/vnd.ims.imsccv1p3": {"source":"iana"},
  "application/vnd.ims.lis.v2.result+json": {"source":"iana","compressible":true},
  "application/vnd.ims.lti.v2.toolconsumerprofile+json": {"source":"iana","compressible":true},
  "application/vnd.ims.lti.v2.toolproxy+json": {"source":"iana","compressible":true},
  "application/vnd.ims.lti.v2.toolproxy.id+json": {"source":"iana","compressible":true},
  "application/vnd.ims.lti.v2.toolsettings+json": {"source":"iana","compressible":true},
  "application/vnd.ims.lti.v2.toolsettings.simple+json": {"source":"iana","compressible":true},
  "application/vnd.informedcontrol.rms+xml": {"source":"iana","compressible":true},
  "application/vnd.informix-visionary": {"source":"apache"},
  "application/vnd.infotech.project": {"source":"iana"},
  "application/vnd.infotech.project+xml": {"source":"iana","compressible":true},
  "application/vnd.innopath.wamp.notification": {"source":"iana"},
  "application/vnd.insors.igm": {"source":"iana","extensions":["igm"]},
  "application/vnd.intercon.formnet": {"source":"iana","extensions":["xpw","xpx"]},
  "application/vnd.intergeo": {"source":"iana","extensions":["i2g"]},
  "application/vnd.intertrust.digibox": {"source":"iana"},
  "application/vnd.intertrust.nncp": {"source":"iana"},
  "application/vnd.intu.qbo": {"source":"iana","extensions":["qbo"]},
  "application/vnd.intu.qfx": {"source":"iana","extensions":["qfx"]},
  "application/vnd.ipfs.ipns-record": {"source":"iana"},
  "application/vnd.ipld.car": {"source":"iana"},
  "application/vnd.ipld.dag-cbor": {"source":"iana"},
  "application/vnd.ipld.dag-json": {"source":"iana"},
  "application/vnd.ipld.raw": {"source":"iana"},
  "application/vnd.iptc.g2.catalogitem+xml": {"source":"iana","compressible":true},
  "application/vnd.iptc.g2.conceptitem+xml": {"source":"iana","compressible":true},
  "application/vnd.iptc.g2.knowledgeitem+xml": {"source":"iana","compressible":true},
  "application/vnd.iptc.g2.newsitem+xml": {"source":"iana","compressible":true},
  "application/vnd.iptc.g2.newsmessage+xml": {"source":"iana","compressible":true},
  "application/vnd.iptc.g2.packageitem+xml": {"source":"iana","compressible":true},
  "application/vnd.iptc.g2.planningitem+xml": {"source":"iana","compressible":true},
  "application/vnd.ipunplugged.rcprofile": {"source":"iana","extensions":["rcprofile"]},
  "application/vnd.irepository.package+xml": {"source":"iana","compressible":true,"extensions":["irp"]},
  "application/vnd.is-xpr": {"source":"iana","extensions":["xpr"]},
  "application/vnd.isac.fcs": {"source":"iana","extensions":["fcs"]},
  "application/vnd.iso11783-10+zip": {"source":"iana","compressible":false},
  "application/vnd.jam": {"source":"iana","extensions":["jam"]},
  "application/vnd.japannet-directory-service": {"source":"iana"},
  "application/vnd.japannet-jpnstore-wakeup": {"source":"iana"},
  "application/vnd.japannet-payment-wakeup": {"source":"iana"},
  "application/vnd.japannet-registration": {"source":"iana"},
  "application/vnd.japannet-registration-wakeup": {"source":"iana"},
  "application/vnd.japannet-setstore-wakeup": {"source":"iana"},
  "application/vnd.japannet-verification": {"source":"iana"},
  "application/vnd.japannet-verification-wakeup": {"source":"iana"},
  "application/vnd.jcp.javame.midlet-rms": {"source":"iana","extensions":["rms"]},
  "application/vnd.jisp": {"source":"iana","extensions":["jisp"]},
  "application/vnd.joost.joda-archive": {"source":"iana","extensions":["joda"]},
  "application/vnd.jsk.isdn-ngn": {"source":"iana"},
  "application/vnd.kahootz": {"source":"iana","extensions":["ktz","ktr"]},
  "application/vnd.kde.karbon": {"source":"iana","extensions":["karbon"]},
  "application/vnd.kde.kchart": {"source":"iana","extensions":["chrt"]},
  "application/vnd.kde.kformula": {"source":"iana","extensions":["kfo"]},
  "application/vnd.kde.kivio": {"source":"iana","extensions":["flw"]},
  "application/vnd.kde.kontour": {"source":"iana","extensions":["kon"]},
  "application/vnd.kde.kpresenter": {"source":"iana","extensions":["kpr","kpt"]},
  "application/vnd.kde.kspread": {"source":"iana","extensions":["ksp"]},
  "application/vnd.kde.kword": {"source":"iana","extensions":["kwd","kwt"]},
  "application/vnd.kdl": {"source":"iana"},
  "application/vnd.kenameaapp": {"source":"iana","extensions":["htke"]},
  "application/vnd.keyman.kmp+zip": {"source":"iana","compressible":false},
  "application/vnd.keyman.kmx": {"source":"iana"},
  "application/vnd.kidspiration": {"source":"iana","extensions":["kia"]},
  "application/vnd.kinar": {"source":"iana","extensions":["kne","knp"]},
  "application/vnd.koan": {"source":"iana","extensions":["skp","skd","skt","skm"]},
  "application/vnd.kodak-descriptor": {"source":"iana","extensions":["sse"]},
  "application/vnd.las": {"source":"iana"},
  "application/vnd.las.las+json": {"source":"iana","compressible":true},
  "application/vnd.las.las+xml": {"source":"iana","compressible":true,"extensions":["lasxml"]},
  "application/vnd.laszip": {"source":"iana"},
  "application/vnd.ldev.productlicensing": {"source":"iana"},
  "application/vnd.leap+json": {"source":"iana","compressible":true},
  "application/vnd.liberty-request+xml": {"source":"iana","compressible":true},
  "application/vnd.llamagraphics.life-balance.desktop": {"source":"iana","extensions":["lbd"]},
  "application/vnd.llamagraphics.life-balance.exchange+xml": {"source":"iana","compressible":true,"extensions":["lbe"]},
  "application/vnd.logipipe.circuit+zip": {"source":"iana","compressible":false},
  "application/vnd.loom": {"source":"iana"},
  "application/vnd.lotus-1-2-3": {"source":"iana","extensions":["123"]},
  "application/vnd.lotus-approach": {"source":"iana","extensions":["apr"]},
  "application/vnd.lotus-freelance": {"source":"iana","extensions":["pre"]},
  "application/vnd.lotus-notes": {"source":"iana","extensions":["nsf"]},
  "application/vnd.lotus-organizer": {"source":"iana","extensions":["org"]},
  "application/vnd.lotus-screencam": {"source":"iana","extensions":["scm"]},
  "application/vnd.lotus-wordpro": {"source":"iana","extensions":["lwp"]},
  "application/vnd.macports.portpkg": {"source":"iana","extensions":["portpkg"]},
  "application/vnd.mapbox-vector-tile": {"source":"iana","extensions":["mvt"]},
  "application/vnd.marlin.drm.actiontoken+xml": {"source":"iana","compressible":true},
  "application/vnd.marlin.drm.conftoken+xml": {"source":"iana","compressible":true},
  "application/vnd.marlin.drm.license+xml": {"source":"iana","compressible":true},
  "application/vnd.marlin.drm.mdcf": {"source":"iana"},
  "application/vnd.mason+json": {"source":"iana","compressible":true},
  "application/vnd.maxar.archive.3tz+zip": {"source":"iana","compressible":false},
  "application/vnd.maxmind.maxmind-db": {"source":"iana"},
  "application/vnd.mcd": {"source":"iana","extensions":["mcd"]},
  "application/vnd.mdl": {"source":"iana"},
  "application/vnd.mdl-mbsdf": {"source":"iana"},
  "application/vnd.medcalcdata": {"source":"iana","extensions":["mc1"]},
  "application/vnd.mediastation.cdkey": {"source":"iana","extensions":["cdkey"]},
  "application/vnd.medicalholodeck.recordxr": {"source":"iana"},
  "application/vnd.meridian-slingshot": {"source":"iana"},
  "application/vnd.mermaid": {"source":"iana"},
  "application/vnd.mfer": {"source":"iana","extensions":["mwf"]},
  "application/vnd.mfmp": {"source":"iana","extensions":["mfm"]},
  "application/vnd.micro+json": {"source":"iana","compressible":true},
  "application/vnd.micrografx.flo": {"source":"iana","extensions":["flo"]},
  "application/vnd.micrografx.igx": {"source":"iana","extensions":["igx"]},
  "application/vnd.microsoft.portable-executable": {"source":"iana"},
  "application/vnd.microsoft.windows.thumbnail-cache": {"source":"iana"},
  "application/vnd.miele+json": {"source":"iana","compressible":true},
  "application/vnd.mif": {"source":"iana","extensions":["mif"]},
  "application/vnd.minisoft-hp3000-save": {"source":"iana"},
  "application/vnd.mitsubishi.misty-guard.trustweb": {"source":"iana"},
  "application/vnd.mobius.daf": {"source":"iana","extensions":["daf"]},
  "application/vnd.mobius.dis": {"source":"iana","extensions":["dis"]},
  "application/vnd.mobius.mbk": {"source":"iana","extensions":["mbk"]},
  "application/vnd.mobius.mqy": {"source":"iana","extensions":["mqy"]},
  "application/vnd.mobius.msl": {"source":"iana","extensions":["msl"]},
  "application/vnd.mobius.plc": {"source":"iana","extensions":["plc"]},
  "application/vnd.mobius.txf": {"source":"iana","extensions":["txf"]},
  "application/vnd.modl": {"source":"iana"},
  "application/vnd.mophun.application": {"source":"iana","extensions":["mpn"]},
  "application/vnd.mophun.certificate": {"source":"iana","extensions":["mpc"]},
  "application/vnd.motorola.flexsuite": {"source":"iana"},
  "application/vnd.motorola.flexsuite.adsi": {"source":"iana"},
  "application/vnd.motorola.flexsuite.fis": {"source":"iana"},
  "application/vnd.motorola.flexsuite.gotap": {"source":"iana"},
  "application/vnd.motorola.flexsuite.kmr": {"source":"iana"},
  "application/vnd.motorola.flexsuite.ttc": {"source":"iana"},
  "application/vnd.motorola.flexsuite.wem": {"source":"iana"},
  "application/vnd.motorola.iprm": {"source":"iana"},
  "application/vnd.mozilla.xul+xml": {"source":"iana","compressible":true,"extensions":["xul"]},
  "application/vnd.ms-3mfdocument": {"source":"iana"},
  "application/vnd.ms-artgalry": {"source":"iana","extensions":["cil"]},
  "application/vnd.ms-asf": {"source":"iana"},
  "application/vnd.ms-cab-compressed": {"source":"iana","extensions":["cab"]},
  "application/vnd.ms-color.iccprofile": {"source":"apache"},
  "application/vnd.ms-excel": {"source":"iana","compressible":false,"extensions":["xls","xlm","xla","xlc","xlt","xlw"]},
  "application/vnd.ms-excel.addin.macroenabled.12": {"source":"iana","extensions":["xlam"]},
  "application/vnd.ms-excel.sheet.binary.macroenabled.12": {"source":"iana","extensions":["xlsb"]},
  "application/vnd.ms-excel.sheet.macroenabled.12": {"source":"iana","extensions":["xlsm"]},
  "application/vnd.ms-excel.template.macroenabled.12": {"source":"iana","extensions":["xltm"]},
  "application/vnd.ms-fontobject": {"source":"iana","compressible":true,"extensions":["eot"]},
  "application/vnd.ms-htmlhelp": {"source":"iana","extensions":["chm"]},
  "application/vnd.ms-ims": {"source":"iana","extensions":["ims"]},
  "application/vnd.ms-lrm": {"source":"iana","extensions":["lrm"]},
  "application/vnd.ms-office.activex+xml": {"source":"iana","compressible":true},
  "application/vnd.ms-officetheme": {"source":"iana","extensions":["thmx"]},
  "application/vnd.ms-opentype": {"source":"apache","compressible":true},
  "application/vnd.ms-outlook": {"compressible":false,"extensions":["msg"]},
  "application/vnd.ms-package.obfuscated-opentype": {"source":"apache"},
  "application/vnd.ms-pki.seccat": {"source":"apache","extensions":["cat"]},
  "application/vnd.ms-pki.stl": {"source":"apache","extensions":["stl"]},
  "application/vnd.ms-playready.initiator+xml": {"source":"iana","compressible":true},
  "application/vnd.ms-powerpoint": {"source":"iana","compressible":false,"extensions":["ppt","pps","pot"]},
  "application/vnd.ms-powerpoint.addin.macroenabled.12": {"source":"iana","extensions":["ppam"]},
  "application/vnd.ms-powerpoint.presentation.macroenabled.12": {"source":"iana","extensions":["pptm"]},
  "application/vnd.ms-powerpoint.slide.macroenabled.12": {"source":"iana","extensions":["sldm"]},
  "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {"source":"iana","extensions":["ppsm"]},
  "application/vnd.ms-powerpoint.template.macroenabled.12": {"source":"iana","extensions":["potm"]},
  "application/vnd.ms-printdevicecapabilities+xml": {"source":"iana","compressible":true},
  "application/vnd.ms-printing.printticket+xml": {"source":"apache","compressible":true},
  "application/vnd.ms-printschematicket+xml": {"source":"iana","compressible":true},
  "application/vnd.ms-project": {"source":"iana","extensions":["mpp","mpt"]},
  "application/vnd.ms-tnef": {"source":"iana"},
  "application/vnd.ms-visio.viewer": {"extensions":["vdx"]},
  "application/vnd.ms-windows.devicepairing": {"source":"iana"},
  "application/vnd.ms-windows.nwprinting.oob": {"source":"iana"},
  "application/vnd.ms-windows.printerpairing": {"source":"iana"},
  "application/vnd.ms-windows.wsd.oob": {"source":"iana"},
  "application/vnd.ms-wmdrm.lic-chlg-req": {"source":"iana"},
  "application/vnd.ms-wmdrm.lic-resp": {"source":"iana"},
  "application/vnd.ms-wmdrm.meter-chlg-req": {"source":"iana"},
  "application/vnd.ms-wmdrm.meter-resp": {"source":"iana"},
  "application/vnd.ms-word.document.macroenabled.12": {"source":"iana","extensions":["docm"]},
  "application/vnd.ms-word.template.macroenabled.12": {"source":"iana","extensions":["dotm"]},
  "application/vnd.ms-works": {"source":"iana","extensions":["wps","wks","wcm","wdb"]},
  "application/vnd.ms-wpl": {"source":"iana","extensions":["wpl"]},
  "application/vnd.ms-xpsdocument": {"source":"iana","compressible":false,"extensions":["xps"]},
  "application/vnd.msa-disk-image": {"source":"iana"},
  "application/vnd.mseq": {"source":"iana","extensions":["mseq"]},
  "application/vnd.msgpack": {"source":"iana"},
  "application/vnd.msign": {"source":"iana"},
  "application/vnd.multiad.creator": {"source":"iana"},
  "application/vnd.multiad.creator.cif": {"source":"iana"},
  "application/vnd.music-niff": {"source":"iana"},
  "application/vnd.musician": {"source":"iana","extensions":["mus"]},
  "application/vnd.muvee.style": {"source":"iana","extensions":["msty"]},
  "application/vnd.mynfc": {"source":"iana","extensions":["taglet"]},
  "application/vnd.nacamar.ybrid+json": {"source":"iana","compressible":true},
  "application/vnd.nato.bindingdataobject+cbor": {"source":"iana"},
  "application/vnd.nato.bindingdataobject+json": {"source":"iana","compressible":true},
  "application/vnd.nato.bindingdataobject+xml": {"source":"iana","compressible":true,"extensions":["bdo"]},
  "application/vnd.nato.openxmlformats-package.iepd+zip": {"source":"iana","compressible":false},
  "application/vnd.ncd.control": {"source":"iana"},
  "application/vnd.ncd.reference": {"source":"iana"},
  "application/vnd.nearst.inv+json": {"source":"iana","compressible":true},
  "application/vnd.nebumind.line": {"source":"iana"},
  "application/vnd.nervana": {"source":"iana"},
  "application/vnd.netfpx": {"source":"iana"},
  "application/vnd.neurolanguage.nlu": {"source":"iana","extensions":["nlu"]},
  "application/vnd.nimn": {"source":"iana"},
  "application/vnd.nintendo.nitro.rom": {"source":"iana"},
  "application/vnd.nintendo.snes.rom": {"source":"iana"},
  "application/vnd.nitf": {"source":"iana","extensions":["ntf","nitf"]},
  "application/vnd.noblenet-directory": {"source":"iana","extensions":["nnd"]},
  "application/vnd.noblenet-sealer": {"source":"iana","extensions":["nns"]},
  "application/vnd.noblenet-web": {"source":"iana","extensions":["nnw"]},
  "application/vnd.nokia.catalogs": {"source":"iana"},
  "application/vnd.nokia.conml+wbxml": {"source":"iana"},
  "application/vnd.nokia.conml+xml": {"source":"iana","compressible":true},
  "application/vnd.nokia.iptv.config+xml": {"source":"iana","compressible":true},
  "application/vnd.nokia.isds-radio-presets": {"source":"iana"},
  "application/vnd.nokia.landmark+wbxml": {"source":"iana"},
  "application/vnd.nokia.landmark+xml": {"source":"iana","compressible":true},
  "application/vnd.nokia.landmarkcollection+xml": {"source":"iana","compressible":true},
  "application/vnd.nokia.n-gage.ac+xml": {"source":"iana","compressible":true,"extensions":["ac"]},
  "application/vnd.nokia.n-gage.data": {"source":"iana","extensions":["ngdat"]},
  "application/vnd.nokia.n-gage.symbian.install": {"source":"apache","extensions":["n-gage"]},
  "application/vnd.nokia.ncd": {"source":"iana"},
  "application/vnd.nokia.pcd+wbxml": {"source":"iana"},
  "application/vnd.nokia.pcd+xml": {"source":"iana","compressible":true},
  "application/vnd.nokia.radio-preset": {"source":"iana","extensions":["rpst"]},
  "application/vnd.nokia.radio-presets": {"source":"iana","extensions":["rpss"]},
  "application/vnd.novadigm.edm": {"source":"iana","extensions":["edm"]},
  "application/vnd.novadigm.edx": {"source":"iana","extensions":["edx"]},
  "application/vnd.novadigm.ext": {"source":"iana","extensions":["ext"]},
  "application/vnd.ntt-local.content-share": {"source":"iana"},
  "application/vnd.ntt-local.file-transfer": {"source":"iana"},
  "application/vnd.ntt-local.ogw_remote-access": {"source":"iana"},
  "application/vnd.ntt-local.sip-ta_remote": {"source":"iana"},
  "application/vnd.ntt-local.sip-ta_tcp_stream": {"source":"iana"},
  "application/vnd.oai.workflows": {"source":"iana"},
  "application/vnd.oai.workflows+json": {"source":"iana","compressible":true},
  "application/vnd.oai.workflows+yaml": {"source":"iana"},
  "application/vnd.oasis.opendocument.base": {"source":"iana"},
  "application/vnd.oasis.opendocument.chart": {"source":"iana","extensions":["odc"]},
  "application/vnd.oasis.opendocument.chart-template": {"source":"iana","extensions":["otc"]},
  "application/vnd.oasis.opendocument.database": {"source":"apache","extensions":["odb"]},
  "application/vnd.oasis.opendocument.formula": {"source":"iana","extensions":["odf"]},
  "application/vnd.oasis.opendocument.formula-template": {"source":"iana","extensions":["odft"]},
  "application/vnd.oasis.opendocument.graphics": {"source":"iana","compressible":false,"extensions":["odg"]},
  "application/vnd.oasis.opendocument.graphics-template": {"source":"iana","extensions":["otg"]},
  "application/vnd.oasis.opendocument.image": {"source":"iana","extensions":["odi"]},
  "application/vnd.oasis.opendocument.image-template": {"source":"iana","extensions":["oti"]},
  "application/vnd.oasis.opendocument.presentation": {"source":"iana","compressible":false,"extensions":["odp"]},
  "application/vnd.oasis.opendocument.presentation-template": {"source":"iana","extensions":["otp"]},
  "application/vnd.oasis.opendocument.spreadsheet": {"source":"iana","compressible":false,"extensions":["ods"]},
  "application/vnd.oasis.opendocument.spreadsheet-template": {"source":"iana","extensions":["ots"]},
  "application/vnd.oasis.opendocument.text": {"source":"iana","compressible":false,"extensions":["odt"]},
  "application/vnd.oasis.opendocument.text-master": {"source":"iana","extensions":["odm"]},
  "application/vnd.oasis.opendocument.text-master-template": {"source":"iana"},
  "application/vnd.oasis.opendocument.text-template": {"source":"iana","extensions":["ott"]},
  "application/vnd.oasis.opendocument.text-web": {"source":"iana","extensions":["oth"]},
  "application/vnd.obn": {"source":"iana"},
  "application/vnd.ocf+cbor": {"source":"iana"},
  "application/vnd.oci.image.manifest.v1+json": {"source":"iana","compressible":true},
  "application/vnd.oftn.l10n+json": {"source":"iana","compressible":true},
  "application/vnd.oipf.contentaccessdownload+xml": {"source":"iana","compressible":true},
  "application/vnd.oipf.contentaccessstreaming+xml": {"source":"iana","compressible":true},
  "application/vnd.oipf.cspg-hexbinary": {"source":"iana"},
  "application/vnd.oipf.dae.svg+xml": {"source":"iana","compressible":true},
  "application/vnd.oipf.dae.xhtml+xml": {"source":"iana","compressible":true},
  "application/vnd.oipf.mippvcontrolmessage+xml": {"source":"iana","compressible":true},
  "application/vnd.oipf.pae.gem": {"source":"iana"},
  "application/vnd.oipf.spdiscovery+xml": {"source":"iana","compressible":true},
  "application/vnd.oipf.spdlist+xml": {"source":"iana","compressible":true},
  "application/vnd.oipf.ueprofile+xml": {"source":"iana","compressible":true},
  "application/vnd.oipf.userprofile+xml": {"source":"iana","compressible":true},
  "application/vnd.olpc-sugar": {"source":"iana","extensions":["xo"]},
  "application/vnd.oma-scws-config": {"source":"iana"},
  "application/vnd.oma-scws-http-request": {"source":"iana"},
  "application/vnd.oma-scws-http-response": {"source":"iana"},
  "application/vnd.oma.bcast.associated-procedure-parameter+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.bcast.drm-trigger+xml": {"source":"apache","compressible":true},
  "application/vnd.oma.bcast.imd+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.bcast.ltkm": {"source":"iana"},
  "application/vnd.oma.bcast.notification+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.bcast.provisioningtrigger": {"source":"iana"},
  "application/vnd.oma.bcast.sgboot": {"source":"iana"},
  "application/vnd.oma.bcast.sgdd+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.bcast.sgdu": {"source":"iana"},
  "application/vnd.oma.bcast.simple-symbol-container": {"source":"iana"},
  "application/vnd.oma.bcast.smartcard-trigger+xml": {"source":"apache","compressible":true},
  "application/vnd.oma.bcast.sprov+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.bcast.stkm": {"source":"iana"},
  "application/vnd.oma.cab-address-book+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.cab-feature-handler+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.cab-pcc+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.cab-subs-invite+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.cab-user-prefs+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.dcd": {"source":"iana"},
  "application/vnd.oma.dcdc": {"source":"iana"},
  "application/vnd.oma.dd2+xml": {"source":"iana","compressible":true,"extensions":["dd2"]},
  "application/vnd.oma.drm.risd+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.group-usage-list+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.lwm2m+cbor": {"source":"iana"},
  "application/vnd.oma.lwm2m+json": {"source":"iana","compressible":true},
  "application/vnd.oma.lwm2m+tlv": {"source":"iana"},
  "application/vnd.oma.pal+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.poc.detailed-progress-report+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.poc.final-report+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.poc.groups+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.poc.invocation-descriptor+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.poc.optimized-progress-report+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.push": {"source":"iana"},
  "application/vnd.oma.scidm.messages+xml": {"source":"iana","compressible":true},
  "application/vnd.oma.xcap-directory+xml": {"source":"iana","compressible":true},
  "application/vnd.omads-email+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/vnd.omads-file+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/vnd.omads-folder+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/vnd.omaloc-supl-init": {"source":"iana"},
  "application/vnd.onepager": {"source":"iana"},
  "application/vnd.onepagertamp": {"source":"iana"},
  "application/vnd.onepagertamx": {"source":"iana"},
  "application/vnd.onepagertat": {"source":"iana"},
  "application/vnd.onepagertatp": {"source":"iana"},
  "application/vnd.onepagertatx": {"source":"iana"},
  "application/vnd.onvif.metadata": {"source":"iana"},
  "application/vnd.openblox.game+xml": {"source":"iana","compressible":true,"extensions":["obgx"]},
  "application/vnd.openblox.game-binary": {"source":"iana"},
  "application/vnd.openeye.oeb": {"source":"iana"},
  "application/vnd.openofficeorg.extension": {"source":"apache","extensions":["oxt"]},
  "application/vnd.openstreetmap.data+xml": {"source":"iana","compressible":true,"extensions":["osm"]},
  "application/vnd.opentimestamps.ots": {"source":"iana"},
  "application/vnd.openvpi.dspx+json": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.custom-properties+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.drawing+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.extended-properties+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {"source":"iana","compressible":false,"extensions":["pptx"]},
  "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.slide": {"source":"iana","extensions":["sldx"]},
  "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {"source":"iana","extensions":["ppsx"]},
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.template": {"source":"iana","extensions":["potx"]},
  "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {"source":"iana","compressible":false,"extensions":["xlsx"]},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {"source":"iana","extensions":["xltx"]},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.theme+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.themeoverride+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.vmldrawing": {"source":"iana"},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {"source":"iana","compressible":false,"extensions":["docx"]},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {"source":"iana","extensions":["dotx"]},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-package.core-properties+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {"source":"iana","compressible":true},
  "application/vnd.openxmlformats-package.relationships+xml": {"source":"iana","compressible":true},
  "application/vnd.oracle.resource+json": {"source":"iana","compressible":true},
  "application/vnd.orange.indata": {"source":"iana"},
  "application/vnd.osa.netdeploy": {"source":"iana"},
  "application/vnd.osgeo.mapguide.package": {"source":"iana","extensions":["mgp"]},
  "application/vnd.osgi.bundle": {"source":"iana"},
  "application/vnd.osgi.dp": {"source":"iana","extensions":["dp"]},
  "application/vnd.osgi.subsystem": {"source":"iana","extensions":["esa"]},
  "application/vnd.otps.ct-kip+xml": {"source":"iana","compressible":true},
  "application/vnd.oxli.countgraph": {"source":"iana"},
  "application/vnd.pagerduty+json": {"source":"iana","compressible":true},
  "application/vnd.palm": {"source":"iana","extensions":["pdb","pqa","oprc"]},
  "application/vnd.panoply": {"source":"iana"},
  "application/vnd.paos.xml": {"source":"iana"},
  "application/vnd.patentdive": {"source":"iana"},
  "application/vnd.patientecommsdoc": {"source":"iana"},
  "application/vnd.pawaafile": {"source":"iana","extensions":["paw"]},
  "application/vnd.pcos": {"source":"iana"},
  "application/vnd.pg.format": {"source":"iana","extensions":["str"]},
  "application/vnd.pg.osasli": {"source":"iana","extensions":["ei6"]},
  "application/vnd.piaccess.application-licence": {"source":"iana"},
  "application/vnd.picsel": {"source":"iana","extensions":["efif"]},
  "application/vnd.pmi.widget": {"source":"iana","extensions":["wg"]},
  "application/vnd.poc.group-advertisement+xml": {"source":"iana","compressible":true},
  "application/vnd.pocketlearn": {"source":"iana","extensions":["plf"]},
  "application/vnd.powerbuilder6": {"source":"iana","extensions":["pbd"]},
  "application/vnd.powerbuilder6-s": {"source":"iana"},
  "application/vnd.powerbuilder7": {"source":"iana"},
  "application/vnd.powerbuilder7-s": {"source":"iana"},
  "application/vnd.powerbuilder75": {"source":"iana"},
  "application/vnd.powerbuilder75-s": {"source":"iana"},
  "application/vnd.preminet": {"source":"iana"},
  "application/vnd.previewsystems.box": {"source":"iana","extensions":["box"]},
  "application/vnd.procrate.brushset": {"extensions":["brushset"]},
  "application/vnd.procreate.brush": {"extensions":["brush"]},
  "application/vnd.procreate.dream": {"extensions":["drm"]},
  "application/vnd.proteus.magazine": {"source":"iana","extensions":["mgz"]},
  "application/vnd.psfs": {"source":"iana"},
  "application/vnd.pt.mundusmundi": {"source":"iana"},
  "application/vnd.publishare-delta-tree": {"source":"iana","extensions":["qps"]},
  "application/vnd.pvi.ptid1": {"source":"iana","extensions":["ptid"]},
  "application/vnd.pwg-multiplexed": {"source":"iana"},
  "application/vnd.pwg-xhtml-print+xml": {"source":"iana","compressible":true,"extensions":["xhtm"]},
  "application/vnd.qualcomm.brew-app-res": {"source":"iana"},
  "application/vnd.quarantainenet": {"source":"iana"},
  "application/vnd.quark.quarkxpress": {"source":"iana","extensions":["qxd","qxt","qwd","qwt","qxl","qxb"]},
  "application/vnd.quobject-quoxdocument": {"source":"iana"},
  "application/vnd.radisys.moml+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-audit+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-audit-conf+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-audit-conn+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-audit-dialog+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-audit-stream+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-conf+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-dialog+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-dialog-base+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-dialog-fax-detect+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-dialog-group+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-dialog-speech+xml": {"source":"iana","compressible":true},
  "application/vnd.radisys.msml-dialog-transform+xml": {"source":"iana","compressible":true},
  "application/vnd.rainstor.data": {"source":"iana"},
  "application/vnd.rapid": {"source":"iana"},
  "application/vnd.rar": {"source":"iana","extensions":["rar"]},
  "application/vnd.realvnc.bed": {"source":"iana","extensions":["bed"]},
  "application/vnd.recordare.musicxml": {"source":"iana","extensions":["mxl"]},
  "application/vnd.recordare.musicxml+xml": {"source":"iana","compressible":true,"extensions":["musicxml"]},
  "application/vnd.relpipe": {"source":"iana"},
  "application/vnd.renlearn.rlprint": {"source":"iana"},
  "application/vnd.resilient.logic": {"source":"iana"},
  "application/vnd.restful+json": {"source":"iana","compressible":true},
  "application/vnd.rig.cryptonote": {"source":"iana","extensions":["cryptonote"]},
  "application/vnd.rim.cod": {"source":"apache","extensions":["cod"]},
  "application/vnd.rn-realmedia": {"source":"apache","extensions":["rm"]},
  "application/vnd.rn-realmedia-vbr": {"source":"apache","extensions":["rmvb"]},
  "application/vnd.route66.link66+xml": {"source":"iana","compressible":true,"extensions":["link66"]},
  "application/vnd.rs-274x": {"source":"iana"},
  "application/vnd.ruckus.download": {"source":"iana"},
  "application/vnd.s3sms": {"source":"iana"},
  "application/vnd.sailingtracker.track": {"source":"iana","extensions":["st"]},
  "application/vnd.sar": {"source":"iana"},
  "application/vnd.sbm.cid": {"source":"iana"},
  "application/vnd.sbm.mid2": {"source":"iana"},
  "application/vnd.scribus": {"source":"iana"},
  "application/vnd.sealed.3df": {"source":"iana"},
  "application/vnd.sealed.csf": {"source":"iana"},
  "application/vnd.sealed.doc": {"source":"iana"},
  "application/vnd.sealed.eml": {"source":"iana"},
  "application/vnd.sealed.mht": {"source":"iana"},
  "application/vnd.sealed.net": {"source":"iana"},
  "application/vnd.sealed.ppt": {"source":"iana"},
  "application/vnd.sealed.tiff": {"source":"iana"},
  "application/vnd.sealed.xls": {"source":"iana"},
  "application/vnd.sealedmedia.softseal.html": {"source":"iana"},
  "application/vnd.sealedmedia.softseal.pdf": {"source":"iana"},
  "application/vnd.seemail": {"source":"iana","extensions":["see"]},
  "application/vnd.seis+json": {"source":"iana","compressible":true},
  "application/vnd.sema": {"source":"iana","extensions":["sema"]},
  "application/vnd.semd": {"source":"iana","extensions":["semd"]},
  "application/vnd.semf": {"source":"iana","extensions":["semf"]},
  "application/vnd.shade-save-file": {"source":"iana"},
  "application/vnd.shana.informed.formdata": {"source":"iana","extensions":["ifm"]},
  "application/vnd.shana.informed.formtemplate": {"source":"iana","extensions":["itp"]},
  "application/vnd.shana.informed.interchange": {"source":"iana","extensions":["iif"]},
  "application/vnd.shana.informed.package": {"source":"iana","extensions":["ipk"]},
  "application/vnd.shootproof+json": {"source":"iana","compressible":true},
  "application/vnd.shopkick+json": {"source":"iana","compressible":true},
  "application/vnd.shp": {"source":"iana"},
  "application/vnd.shx": {"source":"iana"},
  "application/vnd.sigrok.session": {"source":"iana"},
  "application/vnd.simtech-mindmapper": {"source":"iana","extensions":["twd","twds"]},
  "application/vnd.siren+json": {"source":"iana","compressible":true},
  "application/vnd.sketchometry": {"source":"iana"},
  "application/vnd.smaf": {"source":"iana","extensions":["mmf"]},
  "application/vnd.smart.notebook": {"source":"iana"},
  "application/vnd.smart.teacher": {"source":"iana","extensions":["teacher"]},
  "application/vnd.smintio.portals.archive": {"source":"iana"},
  "application/vnd.snesdev-page-table": {"source":"iana"},
  "application/vnd.software602.filler.form+xml": {"source":"iana","compressible":true,"extensions":["fo"]},
  "application/vnd.software602.filler.form-xml-zip": {"source":"iana"},
  "application/vnd.solent.sdkm+xml": {"source":"iana","compressible":true,"extensions":["sdkm","sdkd"]},
  "application/vnd.spotfire.dxp": {"source":"iana","extensions":["dxp"]},
  "application/vnd.spotfire.sfs": {"source":"iana","extensions":["sfs"]},
  "application/vnd.sqlite3": {"source":"iana"},
  "application/vnd.sss-cod": {"source":"iana"},
  "application/vnd.sss-dtf": {"source":"iana"},
  "application/vnd.sss-ntf": {"source":"iana"},
  "application/vnd.stardivision.calc": {"source":"apache","extensions":["sdc"]},
  "application/vnd.stardivision.draw": {"source":"apache","extensions":["sda"]},
  "application/vnd.stardivision.impress": {"source":"apache","extensions":["sdd"]},
  "application/vnd.stardivision.math": {"source":"apache","extensions":["smf"]},
  "application/vnd.stardivision.writer": {"source":"apache","extensions":["sdw","vor"]},
  "application/vnd.stardivision.writer-global": {"source":"apache","extensions":["sgl"]},
  "application/vnd.stepmania.package": {"source":"iana","extensions":["smzip"]},
  "application/vnd.stepmania.stepchart": {"source":"iana","extensions":["sm"]},
  "application/vnd.street-stream": {"source":"iana"},
  "application/vnd.sun.wadl+xml": {"source":"iana","compressible":true,"extensions":["wadl"]},
  "application/vnd.sun.xml.calc": {"source":"apache","extensions":["sxc"]},
  "application/vnd.sun.xml.calc.template": {"source":"apache","extensions":["stc"]},
  "application/vnd.sun.xml.draw": {"source":"apache","extensions":["sxd"]},
  "application/vnd.sun.xml.draw.template": {"source":"apache","extensions":["std"]},
  "application/vnd.sun.xml.impress": {"source":"apache","extensions":["sxi"]},
  "application/vnd.sun.xml.impress.template": {"source":"apache","extensions":["sti"]},
  "application/vnd.sun.xml.math": {"source":"apache","extensions":["sxm"]},
  "application/vnd.sun.xml.writer": {"source":"apache","extensions":["sxw"]},
  "application/vnd.sun.xml.writer.global": {"source":"apache","extensions":["sxg"]},
  "application/vnd.sun.xml.writer.template": {"source":"apache","extensions":["stw"]},
  "application/vnd.sus-calendar": {"source":"iana","extensions":["sus","susp"]},
  "application/vnd.svd": {"source":"iana","extensions":["svd"]},
  "application/vnd.swiftview-ics": {"source":"iana"},
  "application/vnd.sybyl.mol2": {"source":"iana"},
  "application/vnd.sycle+xml": {"source":"iana","compressible":true},
  "application/vnd.syft+json": {"source":"iana","compressible":true},
  "application/vnd.symbian.install": {"source":"apache","extensions":["sis","sisx"]},
  "application/vnd.syncml+xml": {"source":"iana","charset":"UTF-8","compressible":true,"extensions":["xsm"]},
  "application/vnd.syncml.dm+wbxml": {"source":"iana","charset":"UTF-8","extensions":["bdm"]},
  "application/vnd.syncml.dm+xml": {"source":"iana","charset":"UTF-8","compressible":true,"extensions":["xdm"]},
  "application/vnd.syncml.dm.notification": {"source":"iana"},
  "application/vnd.syncml.dmddf+wbxml": {"source":"iana"},
  "application/vnd.syncml.dmddf+xml": {"source":"iana","charset":"UTF-8","compressible":true,"extensions":["ddf"]},
  "application/vnd.syncml.dmtnds+wbxml": {"source":"iana"},
  "application/vnd.syncml.dmtnds+xml": {"source":"iana","charset":"UTF-8","compressible":true},
  "application/vnd.syncml.ds.notification": {"source":"iana"},
  "application/vnd.tableschema+json": {"source":"iana","compressible":true},
  "application/vnd.tao.intent-module-archive": {"source":"iana","extensions":["tao"]},
  "application/vnd.tcpdump.pcap": {"source":"iana","extensions":["pcap","cap","dmp"]},
  "application/vnd.think-cell.ppttc+json": {"source":"iana","compressible":true},
  "application/vnd.tmd.mediaflex.api+xml": {"source":"iana","compressible":true},
  "application/vnd.tml": {"source":"iana"},
  "application/vnd.tmobile-livetv": {"source":"iana","extensions":["tmo"]},
  "application/vnd.tri.onesource": {"source":"iana"},
  "application/vnd.trid.tpt": {"source":"iana","extensions":["tpt"]},
  "application/vnd.triscape.mxs": {"source":"iana","extensions":["mxs"]},
  "application/vnd.trueapp": {"source":"iana","extensions":["tra"]},
  "application/vnd.truedoc": {"source":"iana"},
  "application/vnd.ubisoft.webplayer": {"source":"iana"},
  "application/vnd.ufdl": {"source":"iana","extensions":["ufd","ufdl"]},
  "application/vnd.uic.osdm+json": {"source":"iana","compressible":true},
  "application/vnd.uiq.theme": {"source":"iana","extensions":["utz"]},
  "application/vnd.umajin": {"source":"iana","extensions":["umj"]},
  "application/vnd.unity": {"source":"iana","extensions":["unityweb"]},
  "application/vnd.uoml+xml": {"source":"iana","compressible":true,"extensions":["uoml","uo"]},
  "application/vnd.uplanet.alert": {"source":"iana"},
  "application/vnd.uplanet.alert-wbxml": {"source":"iana"},
  "application/vnd.uplanet.bearer-choice": {"source":"iana"},
  "application/vnd.uplanet.bearer-choice-wbxml": {"source":"iana"},
  "application/vnd.uplanet.cacheop": {"source":"iana"},
  "application/vnd.uplanet.cacheop-wbxml": {"source":"iana"},
  "application/vnd.uplanet.channel": {"source":"iana"},
  "application/vnd.uplanet.channel-wbxml": {"source":"iana"},
  "application/vnd.uplanet.list": {"source":"iana"},
  "application/vnd.uplanet.list-wbxml": {"source":"iana"},
  "application/vnd.uplanet.listcmd": {"source":"iana"},
  "application/vnd.uplanet.listcmd-wbxml": {"source":"iana"},
  "application/vnd.uplanet.signal": {"source":"iana"},
  "application/vnd.uri-map": {"source":"iana"},
  "application/vnd.valve.source.material": {"source":"iana"},
  "application/vnd.vcx": {"source":"iana","extensions":["vcx"]},
  "application/vnd.vd-study": {"source":"iana"},
  "application/vnd.vectorworks": {"source":"iana"},
  "application/vnd.vel+json": {"source":"iana","compressible":true},
  "application/vnd.veraison.tsm-report+cbor": {"source":"iana"},
  "application/vnd.veraison.tsm-report+json": {"source":"iana","compressible":true},
  "application/vnd.verimatrix.vcas": {"source":"iana"},
  "application/vnd.veritone.aion+json": {"source":"iana","compressible":true},
  "application/vnd.veryant.thin": {"source":"iana"},
  "application/vnd.ves.encrypted": {"source":"iana"},
  "application/vnd.vidsoft.vidconference": {"source":"iana"},
  "application/vnd.visio": {"source":"iana","extensions":["vsd","vst","vss","vsw","vsdx","vtx"]},
  "application/vnd.visionary": {"source":"iana","extensions":["vis"]},
  "application/vnd.vividence.scriptfile": {"source":"iana"},
  "application/vnd.vocalshaper.vsp4": {"source":"iana"},
  "application/vnd.vsf": {"source":"iana","extensions":["vsf"]},
  "application/vnd.wap.sic": {"source":"iana"},
  "application/vnd.wap.slc": {"source":"iana"},
  "application/vnd.wap.wbxml": {"source":"iana","charset":"UTF-8","extensions":["wbxml"]},
  "application/vnd.wap.wmlc": {"source":"iana","extensions":["wmlc"]},
  "application/vnd.wap.wmlscriptc": {"source":"iana","extensions":["wmlsc"]},
  "application/vnd.wasmflow.wafl": {"source":"iana"},
  "application/vnd.webturbo": {"source":"iana","extensions":["wtb"]},
  "application/vnd.wfa.dpp": {"source":"iana"},
  "application/vnd.wfa.p2p": {"source":"iana"},
  "application/vnd.wfa.wsc": {"source":"iana"},
  "application/vnd.windows.devicepairing": {"source":"iana"},
  "application/vnd.wmc": {"source":"iana"},
  "application/vnd.wmf.bootstrap": {"source":"iana"},
  "application/vnd.wolfram.mathematica": {"source":"iana"},
  "application/vnd.wolfram.mathematica.package": {"source":"iana"},
  "application/vnd.wolfram.player": {"source":"iana","extensions":["nbp"]},
  "application/vnd.wordlift": {"source":"iana"},
  "application/vnd.wordperfect": {"source":"iana","extensions":["wpd"]},
  "application/vnd.wqd": {"source":"iana","extensions":["wqd"]},
  "application/vnd.wrq-hp3000-labelled": {"source":"iana"},
  "application/vnd.wt.stf": {"source":"iana","extensions":["stf"]},
  "application/vnd.wv.csp+wbxml": {"source":"iana"},
  "application/vnd.wv.csp+xml": {"source":"iana","compressible":true},
  "application/vnd.wv.ssp+xml": {"source":"iana","compressible":true},
  "application/vnd.xacml+json": {"source":"iana","compressible":true},
  "application/vnd.xara": {"source":"iana","extensions":["xar"]},
  "application/vnd.xarin.cpj": {"source":"iana"},
  "application/vnd.xecrets-encrypted": {"source":"iana"},
  "application/vnd.xfdl": {"source":"iana","extensions":["xfdl"]},
  "application/vnd.xfdl.webform": {"source":"iana"},
  "application/vnd.xmi+xml": {"source":"iana","compressible":true},
  "application/vnd.xmpie.cpkg": {"source":"iana"},
  "application/vnd.xmpie.dpkg": {"source":"iana"},
  "application/vnd.xmpie.plan": {"source":"iana"},
  "application/vnd.xmpie.ppkg": {"source":"iana"},
  "application/vnd.xmpie.xlim": {"source":"iana"},
  "application/vnd.yamaha.hv-dic": {"source":"iana","extensions":["hvd"]},
  "application/vnd.yamaha.hv-script": {"source":"iana","extensions":["hvs"]},
  "application/vnd.yamaha.hv-voice": {"source":"iana","extensions":["hvp"]},
  "application/vnd.yamaha.openscoreformat": {"source":"iana","extensions":["osf"]},
  "application/vnd.yamaha.openscoreformat.osfpvg+xml": {"source":"iana","compressible":true,"extensions":["osfpvg"]},
  "application/vnd.yamaha.remote-setup": {"source":"iana"},
  "application/vnd.yamaha.smaf-audio": {"source":"iana","extensions":["saf"]},
  "application/vnd.yamaha.smaf-phrase": {"source":"iana","extensions":["spf"]},
  "application/vnd.yamaha.through-ngn": {"source":"iana"},
  "application/vnd.yamaha.tunnel-udpencap": {"source":"iana"},
  "application/vnd.yaoweme": {"source":"iana"},
  "application/vnd.yellowriver-custom-menu": {"source":"iana","extensions":["cmp"]},
  "application/vnd.zul": {"source":"iana","extensions":["zir","zirz"]},
  "application/vnd.zzazz.deck+xml": {"source":"iana","compressible":true,"extensions":["zaz"]},
  "application/voicexml+xml": {"source":"iana","compressible":true,"extensions":["vxml"]},
  "application/voucher-cms+json": {"source":"iana","compressible":true},
  "application/voucher-jws+json": {"source":"iana","compressible":true},
  "application/vp": {"source":"iana"},
  "application/vp+cose": {"source":"iana"},
  "application/vp+jwt": {"source":"iana"},
  "application/vq-rtcpxr": {"source":"iana"},
  "application/wasm": {"source":"iana","compressible":true,"extensions":["wasm"]},
  "application/watcherinfo+xml": {"source":"iana","compressible":true,"extensions":["wif"]},
  "application/webpush-options+json": {"source":"iana","compressible":true},
  "application/whoispp-query": {"source":"iana"},
  "application/whoispp-response": {"source":"iana"},
  "application/widget": {"source":"iana","extensions":["wgt"]},
  "application/winhlp": {"source":"apache","extensions":["hlp"]},
  "application/wita": {"source":"iana"},
  "application/wordperfect5.1": {"source":"iana"},
  "application/wsdl+xml": {"source":"iana","compressible":true,"extensions":["wsdl"]},
  "application/wspolicy+xml": {"source":"iana","compressible":true,"extensions":["wspolicy"]},
  "application/x-7z-compressed": {"source":"apache","compressible":false,"extensions":["7z"]},
  "application/x-abiword": {"source":"apache","extensions":["abw"]},
  "application/x-ace-compressed": {"source":"apache","extensions":["ace"]},
  "application/x-amf": {"source":"apache"},
  "application/x-apple-diskimage": {"source":"apache","extensions":["dmg"]},
  "application/x-arj": {"compressible":false,"extensions":["arj"]},
  "application/x-authorware-bin": {"source":"apache","extensions":["aab","x32","u32","vox"]},
  "application/x-authorware-map": {"source":"apache","extensions":["aam"]},
  "application/x-authorware-seg": {"source":"apache","extensions":["aas"]},
  "application/x-bcpio": {"source":"apache","extensions":["bcpio"]},
  "application/x-bdoc": {"compressible":false,"extensions":["bdoc"]},
  "application/x-bittorrent": {"source":"apache","extensions":["torrent"]},
  "application/x-blender": {"extensions":["blend"]},
  "application/x-blorb": {"source":"apache","extensions":["blb","blorb"]},
  "application/x-bzip": {"source":"apache","compressible":false,"extensions":["bz"]},
  "application/x-bzip2": {"source":"apache","compressible":false,"extensions":["bz2","boz"]},
  "application/x-cbr": {"source":"apache","extensions":["cbr","cba","cbt","cbz","cb7"]},
  "application/x-cdlink": {"source":"apache","extensions":["vcd"]},
  "application/x-cfs-compressed": {"source":"apache","extensions":["cfs"]},
  "application/x-chat": {"source":"apache","extensions":["chat"]},
  "application/x-chess-pgn": {"source":"apache","extensions":["pgn"]},
  "application/x-chrome-extension": {"extensions":["crx"]},
  "application/x-cocoa": {"source":"nginx","extensions":["cco"]},
  "application/x-compress": {"source":"apache"},
  "application/x-compressed": {"extensions":["rar"]},
  "application/x-conference": {"source":"apache","extensions":["nsc"]},
  "application/x-cpio": {"source":"apache","extensions":["cpio"]},
  "application/x-csh": {"source":"apache","extensions":["csh"]},
  "application/x-deb": {"compressible":false},
  "application/x-debian-package": {"source":"apache","extensions":["deb","udeb"]},
  "application/x-dgc-compressed": {"source":"apache","extensions":["dgc"]},
  "application/x-director": {"source":"apache","extensions":["dir","dcr","dxr","cst","cct","cxt","w3d","fgd","swa"]},
  "application/x-doom": {"source":"apache","extensions":["wad"]},
  "application/x-dtbncx+xml": {"source":"apache","compressible":true,"extensions":["ncx"]},
  "application/x-dtbook+xml": {"source":"apache","compressible":true,"extensions":["dtb"]},
  "application/x-dtbresource+xml": {"source":"apache","compressible":true,"extensions":["res"]},
  "application/x-dvi": {"source":"apache","compressible":false,"extensions":["dvi"]},
  "application/x-envoy": {"source":"apache","extensions":["evy"]},
  "application/x-eva": {"source":"apache","extensions":["eva"]},
  "application/x-font-bdf": {"source":"apache","extensions":["bdf"]},
  "application/x-font-dos": {"source":"apache"},
  "application/x-font-framemaker": {"source":"apache"},
  "application/x-font-ghostscript": {"source":"apache","extensions":["gsf"]},
  "application/x-font-libgrx": {"source":"apache"},
  "application/x-font-linux-psf": {"source":"apache","extensions":["psf"]},
  "application/x-font-pcf": {"source":"apache","extensions":["pcf"]},
  "application/x-font-snf": {"source":"apache","extensions":["snf"]},
  "application/x-font-speedo": {"source":"apache"},
  "application/x-font-sunos-news": {"source":"apache"},
  "application/x-font-type1": {"source":"apache","extensions":["pfa","pfb","pfm","afm"]},
  "application/x-font-vfont": {"source":"apache"},
  "application/x-freearc": {"source":"apache","extensions":["arc"]},
  "application/x-futuresplash": {"source":"apache","extensions":["spl"]},
  "application/x-gca-compressed": {"source":"apache","extensions":["gca"]},
  "application/x-glulx": {"source":"apache","extensions":["ulx"]},
  "application/x-gnumeric": {"source":"apache","extensions":["gnumeric"]},
  "application/x-gramps-xml": {"source":"apache","extensions":["gramps"]},
  "application/x-gtar": {"source":"apache","extensions":["gtar"]},
  "application/x-gzip": {"source":"apache"},
  "application/x-hdf": {"source":"apache","extensions":["hdf"]},
  "application/x-httpd-php": {"compressible":true,"extensions":["php"]},
  "application/x-install-instructions": {"source":"apache","extensions":["install"]},
  "application/x-ipynb+json": {"compressible":true,"extensions":["ipynb"]},
  "application/x-iso9660-image": {"source":"apache","extensions":["iso"]},
  "application/x-iwork-keynote-sffkey": {"extensions":["key"]},
  "application/x-iwork-numbers-sffnumbers": {"extensions":["numbers"]},
  "application/x-iwork-pages-sffpages": {"extensions":["pages"]},
  "application/x-java-archive-diff": {"source":"nginx","extensions":["jardiff"]},
  "application/x-java-jnlp-file": {"source":"apache","compressible":false,"extensions":["jnlp"]},
  "application/x-javascript": {"compressible":true},
  "application/x-keepass2": {"extensions":["kdbx"]},
  "application/x-latex": {"source":"apache","compressible":false,"extensions":["latex"]},
  "application/x-lua-bytecode": {"extensions":["luac"]},
  "application/x-lzh-compressed": {"source":"apache","extensions":["lzh","lha"]},
  "application/x-makeself": {"source":"nginx","extensions":["run"]},
  "application/x-mie": {"source":"apache","extensions":["mie"]},
  "application/x-mobipocket-ebook": {"source":"apache","extensions":["prc","mobi"]},
  "application/x-mpegurl": {"compressible":false},
  "application/x-ms-application": {"source":"apache","extensions":["application"]},
  "application/x-ms-shortcut": {"source":"apache","extensions":["lnk"]},
  "application/x-ms-wmd": {"source":"apache","extensions":["wmd"]},
  "application/x-ms-wmz": {"source":"apache","extensions":["wmz"]},
  "application/x-ms-xbap": {"source":"apache","extensions":["xbap"]},
  "application/x-msaccess": {"source":"apache","extensions":["mdb"]},
  "application/x-msbinder": {"source":"apache","extensions":["obd"]},
  "application/x-mscardfile": {"source":"apache","extensions":["crd"]},
  "application/x-msclip": {"source":"apache","extensions":["clp"]},
  "application/x-msdos-program": {"extensions":["exe"]},
  "application/x-msdownload": {"source":"apache","extensions":["exe","dll","com","bat","msi"]},
  "application/x-msmediaview": {"source":"apache","extensions":["mvb","m13","m14"]},
  "application/x-msmetafile": {"source":"apache","extensions":["wmf","wmz","emf","emz"]},
  "application/x-msmoney": {"source":"apache","extensions":["mny"]},
  "application/x-mspublisher": {"source":"apache","extensions":["pub"]},
  "application/x-msschedule": {"source":"apache","extensions":["scd"]},
  "application/x-msterminal": {"source":"apache","extensions":["trm"]},
  "application/x-mswrite": {"source":"apache","extensions":["wri"]},
  "application/x-netcdf": {"source":"apache","extensions":["nc","cdf"]},
  "application/x-ns-proxy-autoconfig": {"compressible":true,"extensions":["pac"]},
  "application/x-nzb": {"source":"apache","extensions":["nzb"]},
  "application/x-perl": {"source":"nginx","extensions":["pl","pm"]},
  "application/x-pilot": {"source":"nginx","extensions":["prc","pdb"]},
  "application/x-pkcs12": {"source":"apache","compressible":false,"extensions":["p12","pfx"]},
  "application/x-pkcs7-certificates": {"source":"apache","extensions":["p7b","spc"]},
  "application/x-pkcs7-certreqresp": {"source":"apache","extensions":["p7r"]},
  "application/x-pki-message": {"source":"iana"},
  "application/x-rar-compressed": {"source":"apache","compressible":false,"extensions":["rar"]},
  "application/x-redhat-package-manager": {"source":"nginx","extensions":["rpm"]},
  "application/x-research-info-systems": {"source":"apache","extensions":["ris"]},
  "application/x-sea": {"source":"nginx","extensions":["sea"]},
  "application/x-sh": {"source":"apache","compressible":true,"extensions":["sh"]},
  "application/x-shar": {"source":"apache","extensions":["shar"]},
  "application/x-shockwave-flash": {"source":"apache","compressible":false,"extensions":["swf"]},
  "application/x-silverlight-app": {"source":"apache","extensions":["xap"]},
  "application/x-sql": {"source":"apache","extensions":["sql"]},
  "application/x-stuffit": {"source":"apache","compressible":false,"extensions":["sit"]},
  "application/x-stuffitx": {"source":"apache","extensions":["sitx"]},
  "application/x-subrip": {"source":"apache","extensions":["srt"]},
  "application/x-sv4cpio": {"source":"apache","extensions":["sv4cpio"]},
  "application/x-sv4crc": {"source":"apache","extensions":["sv4crc"]},
  "application/x-t3vm-image": {"source":"apache","extensions":["t3"]},
  "application/x-tads": {"source":"apache","extensions":["gam"]},
  "application/x-tar": {"source":"apache","compressible":true,"extensions":["tar"]},
  "application/x-tcl": {"source":"apache","extensions":["tcl","tk"]},
  "application/x-tex": {"source":"apache","extensions":["tex"]},
  "application/x-tex-tfm": {"source":"apache","extensions":["tfm"]},
  "application/x-texinfo": {"source":"apache","extensions":["texinfo","texi"]},
  "application/x-tgif": {"source":"apache","extensions":["obj"]},
  "application/x-ustar": {"source":"apache","extensions":["ustar"]},
  "application/x-virtualbox-hdd": {"compressible":true,"extensions":["hdd"]},
  "application/x-virtualbox-ova": {"compressible":true,"extensions":["ova"]},
  "application/x-virtualbox-ovf": {"compressible":true,"extensions":["ovf"]},
  "application/x-virtualbox-vbox": {"compressible":true,"extensions":["vbox"]},
  "application/x-virtualbox-vbox-extpack": {"compressible":false,"extensions":["vbox-extpack"]},
  "application/x-virtualbox-vdi": {"compressible":true,"extensions":["vdi"]},
  "application/x-virtualbox-vhd": {"compressible":true,"extensions":["vhd"]},
  "application/x-virtualbox-vmdk": {"compressible":true,"extensions":["vmdk"]},
  "application/x-wais-source": {"source":"apache","extensions":["src"]},
  "application/x-web-app-manifest+json": {"compressible":true,"extensions":["webapp"]},
  "application/x-www-form-urlencoded": {"source":"iana","compressible":true},
  "application/x-x509-ca-cert": {"source":"iana","extensions":["der","crt","pem"]},
  "application/x-x509-ca-ra-cert": {"source":"iana"},
  "application/x-x509-next-ca-cert": {"source":"iana"},
  "application/x-xfig": {"source":"apache","extensions":["fig"]},
  "application/x-xliff+xml": {"source":"apache","compressible":true,"extensions":["xlf"]},
  "application/x-xpinstall": {"source":"apache","compressible":false,"extensions":["xpi"]},
  "application/x-xz": {"source":"apache","extensions":["xz"]},
  "application/x-zip-compressed": {"extensions":["zip"]},
  "application/x-zmachine": {"source":"apache","extensions":["z1","z2","z3","z4","z5","z6","z7","z8"]},
  "application/x400-bp": {"source":"iana"},
  "application/xacml+xml": {"source":"iana","compressible":true},
  "application/xaml+xml": {"source":"apache","compressible":true,"extensions":["xaml"]},
  "application/xcap-att+xml": {"source":"iana","compressible":true,"extensions":["xav"]},
  "application/xcap-caps+xml": {"source":"iana","compressible":true,"extensions":["xca"]},
  "application/xcap-diff+xml": {"source":"iana","compressible":true,"extensions":["xdf"]},
  "application/xcap-el+xml": {"source":"iana","compressible":true,"extensions":["xel"]},
  "application/xcap-error+xml": {"source":"iana","compressible":true},
  "application/xcap-ns+xml": {"source":"iana","compressible":true,"extensions":["xns"]},
  "application/xcon-conference-info+xml": {"source":"iana","compressible":true},
  "application/xcon-conference-info-diff+xml": {"source":"iana","compressible":true},
  "application/xenc+xml": {"source":"iana","compressible":true,"extensions":["xenc"]},
  "application/xfdf": {"source":"iana","extensions":["xfdf"]},
  "application/xhtml+xml": {"source":"iana","compressible":true,"extensions":["xhtml","xht"]},
  "application/xhtml-voice+xml": {"source":"apache","compressible":true},
  "application/xliff+xml": {"source":"iana","compressible":true,"extensions":["xlf"]},
  "application/xml": {"source":"iana","compressible":true,"extensions":["xml","xsl","xsd","rng"]},
  "application/xml-dtd": {"source":"iana","compressible":true,"extensions":["dtd"]},
  "application/xml-external-parsed-entity": {"source":"iana"},
  "application/xml-patch+xml": {"source":"iana","compressible":true},
  "application/xmpp+xml": {"source":"iana","compressible":true},
  "application/xop+xml": {"source":"iana","compressible":true,"extensions":["xop"]},
  "application/xproc+xml": {"source":"apache","compressible":true,"extensions":["xpl"]},
  "application/xslt+xml": {"source":"iana","compressible":true,"extensions":["xsl","xslt"]},
  "application/xspf+xml": {"source":"apache","compressible":true,"extensions":["xspf"]},
  "application/xv+xml": {"source":"iana","compressible":true,"extensions":["mxml","xhvml","xvml","xvm"]},
  "application/yaml": {"source":"iana"},
  "application/yang": {"source":"iana","extensions":["yang"]},
  "application/yang-data+cbor": {"source":"iana"},
  "application/yang-data+json": {"source":"iana","compressible":true},
  "application/yang-data+xml": {"source":"iana","compressible":true},
  "application/yang-patch+json": {"source":"iana","compressible":true},
  "application/yang-patch+xml": {"source":"iana","compressible":true},
  "application/yang-sid+json": {"source":"iana","compressible":true},
  "application/yin+xml": {"source":"iana","compressible":true,"extensions":["yin"]},
  "application/zip": {"source":"iana","compressible":false,"extensions":["zip"]},
  "application/zip+dotlottie": {"extensions":["lottie"]},
  "application/zlib": {"source":"iana"},
  "application/zstd": {"source":"iana"},
  "audio/1d-interleaved-parityfec": {"source":"iana"},
  "audio/32kadpcm": {"source":"iana"},
  "audio/3gpp": {"source":"iana","compressible":false,"extensions":["3gpp"]},
  "audio/3gpp2": {"source":"iana"},
  "audio/aac": {"source":"iana","extensions":["adts","aac"]},
  "audio/ac3": {"source":"iana"},
  "audio/adpcm": {"source":"apache","extensions":["adp"]},
  "audio/amr": {"source":"iana","extensions":["amr"]},
  "audio/amr-wb": {"source":"iana"},
  "audio/amr-wb+": {"source":"iana"},
  "audio/aptx": {"source":"iana"},
  "audio/asc": {"source":"iana"},
  "audio/atrac-advanced-lossless": {"source":"iana"},
  "audio/atrac-x": {"source":"iana"},
  "audio/atrac3": {"source":"iana"},
  "audio/basic": {"source":"iana","compressible":false,"extensions":["au","snd"]},
  "audio/bv16": {"source":"iana"},
  "audio/bv32": {"source":"iana"},
  "audio/clearmode": {"source":"iana"},
  "audio/cn": {"source":"iana"},
  "audio/dat12": {"source":"iana"},
  "audio/dls": {"source":"iana"},
  "audio/dsr-es201108": {"source":"iana"},
  "audio/dsr-es202050": {"source":"iana"},
  "audio/dsr-es202211": {"source":"iana"},
  "audio/dsr-es202212": {"source":"iana"},
  "audio/dv": {"source":"iana"},
  "audio/dvi4": {"source":"iana"},
  "audio/eac3": {"source":"iana"},
  "audio/encaprtp": {"source":"iana"},
  "audio/evrc": {"source":"iana"},
  "audio/evrc-qcp": {"source":"iana"},
  "audio/evrc0": {"source":"iana"},
  "audio/evrc1": {"source":"iana"},
  "audio/evrcb": {"source":"iana"},
  "audio/evrcb0": {"source":"iana"},
  "audio/evrcb1": {"source":"iana"},
  "audio/evrcnw": {"source":"iana"},
  "audio/evrcnw0": {"source":"iana"},
  "audio/evrcnw1": {"source":"iana"},
  "audio/evrcwb": {"source":"iana"},
  "audio/evrcwb0": {"source":"iana"},
  "audio/evrcwb1": {"source":"iana"},
  "audio/evs": {"source":"iana"},
  "audio/flac": {"source":"iana"},
  "audio/flexfec": {"source":"iana"},
  "audio/fwdred": {"source":"iana"},
  "audio/g711-0": {"source":"iana"},
  "audio/g719": {"source":"iana"},
  "audio/g722": {"source":"iana"},
  "audio/g7221": {"source":"iana"},
  "audio/g723": {"source":"iana"},
  "audio/g726-16": {"source":"iana"},
  "audio/g726-24": {"source":"iana"},
  "audio/g726-32": {"source":"iana"},
  "audio/g726-40": {"source":"iana"},
  "audio/g728": {"source":"iana"},
  "audio/g729": {"source":"iana"},
  "audio/g7291": {"source":"iana"},
  "audio/g729d": {"source":"iana"},
  "audio/g729e": {"source":"iana"},
  "audio/gsm": {"source":"iana"},
  "audio/gsm-efr": {"source":"iana"},
  "audio/gsm-hr-08": {"source":"iana"},
  "audio/ilbc": {"source":"iana"},
  "audio/ip-mr_v2.5": {"source":"iana"},
  "audio/isac": {"source":"apache"},
  "audio/l16": {"source":"iana"},
  "audio/l20": {"source":"iana"},
  "audio/l24": {"source":"iana","compressible":false},
  "audio/l8": {"source":"iana"},
  "audio/lpc": {"source":"iana"},
  "audio/matroska": {"source":"iana"},
  "audio/melp": {"source":"iana"},
  "audio/melp1200": {"source":"iana"},
  "audio/melp2400": {"source":"iana"},
  "audio/melp600": {"source":"iana"},
  "audio/mhas": {"source":"iana"},
  "audio/midi": {"source":"apache","extensions":["mid","midi","kar","rmi"]},
  "audio/midi-clip": {"source":"iana"},
  "audio/mobile-xmf": {"source":"iana","extensions":["mxmf"]},
  "audio/mp3": {"compressible":false,"extensions":["mp3"]},
  "audio/mp4": {"source":"iana","compressible":false,"extensions":["m4a","mp4a","m4b"]},
  "audio/mp4a-latm": {"source":"iana"},
  "audio/mpa": {"source":"iana"},
  "audio/mpa-robust": {"source":"iana"},
  "audio/mpeg": {"source":"iana","compressible":false,"extensions":["mpga","mp2","mp2a","mp3","m2a","m3a"]},
  "audio/mpeg4-generic": {"source":"iana"},
  "audio/musepack": {"source":"apache"},
  "audio/ogg": {"source":"iana","compressible":false,"extensions":["oga","ogg","spx","opus"]},
  "audio/opus": {"source":"iana"},
  "audio/parityfec": {"source":"iana"},
  "audio/pcma": {"source":"iana"},
  "audio/pcma-wb": {"source":"iana"},
  "audio/pcmu": {"source":"iana"},
  "audio/pcmu-wb": {"source":"iana"},
  "audio/prs.sid": {"source":"iana"},
  "audio/qcelp": {"source":"iana"},
  "audio/raptorfec": {"source":"iana"},
  "audio/red": {"source":"iana"},
  "audio/rtp-enc-aescm128": {"source":"iana"},
  "audio/rtp-midi": {"source":"iana"},
  "audio/rtploopback": {"source":"iana"},
  "audio/rtx": {"source":"iana"},
  "audio/s3m": {"source":"apache","extensions":["s3m"]},
  "audio/scip": {"source":"iana"},
  "audio/silk": {"source":"apache","extensions":["sil"]},
  "audio/smv": {"source":"iana"},
  "audio/smv-qcp": {"source":"iana"},
  "audio/smv0": {"source":"iana"},
  "audio/sofa": {"source":"iana"},
  "audio/sp-midi": {"source":"iana"},
  "audio/speex": {"source":"iana"},
  "audio/t140c": {"source":"iana"},
  "audio/t38": {"source":"iana"},
  "audio/telephone-event": {"source":"iana"},
  "audio/tetra_acelp": {"source":"iana"},
  "audio/tetra_acelp_bb": {"source":"iana"},
  "audio/tone": {"source":"iana"},
  "audio/tsvcis": {"source":"iana"},
  "audio/uemclip": {"source":"iana"},
  "audio/ulpfec": {"source":"iana"},
  "audio/usac": {"source":"iana"},
  "audio/vdvi": {"source":"iana"},
  "audio/vmr-wb": {"source":"iana"},
  "audio/vnd.3gpp.iufp": {"source":"iana"},
  "audio/vnd.4sb": {"source":"iana"},
  "audio/vnd.audiokoz": {"source":"iana"},
  "audio/vnd.celp": {"source":"iana"},
  "audio/vnd.cisco.nse": {"source":"iana"},
  "audio/vnd.cmles.radio-events": {"source":"iana"},
  "audio/vnd.cns.anp1": {"source":"iana"},
  "audio/vnd.cns.inf1": {"source":"iana"},
  "audio/vnd.dece.audio": {"source":"iana","extensions":["uva","uvva"]},
  "audio/vnd.digital-winds": {"source":"iana","extensions":["eol"]},
  "audio/vnd.dlna.adts": {"source":"iana"},
  "audio/vnd.dolby.heaac.1": {"source":"iana"},
  "audio/vnd.dolby.heaac.2": {"source":"iana"},
  "audio/vnd.dolby.mlp": {"source":"iana"},
  "audio/vnd.dolby.mps": {"source":"iana"},
  "audio/vnd.dolby.pl2": {"source":"iana"},
  "audio/vnd.dolby.pl2x": {"source":"iana"},
  "audio/vnd.dolby.pl2z": {"source":"iana"},
  "audio/vnd.dolby.pulse.1": {"source":"iana"},
  "audio/vnd.dra": {"source":"iana","extensions":["dra"]},
  "audio/vnd.dts": {"source":"iana","extensions":["dts"]},
  "audio/vnd.dts.hd": {"source":"iana","extensions":["dtshd"]},
  "audio/vnd.dts.uhd": {"source":"iana"},
  "audio/vnd.dvb.file": {"source":"iana"},
  "audio/vnd.everad.plj": {"source":"iana"},
  "audio/vnd.hns.audio": {"source":"iana"},
  "audio/vnd.lucent.voice": {"source":"iana","extensions":["lvp"]},
  "audio/vnd.ms-playready.media.pya": {"source":"iana","extensions":["pya"]},
  "audio/vnd.nokia.mobile-xmf": {"source":"iana"},
  "audio/vnd.nortel.vbk": {"source":"iana"},
  "audio/vnd.nuera.ecelp4800": {"source":"iana","extensions":["ecelp4800"]},
  "audio/vnd.nuera.ecelp7470": {"source":"iana","extensions":["ecelp7470"]},
  "audio/vnd.nuera.ecelp9600": {"source":"iana","extensions":["ecelp9600"]},
  "audio/vnd.octel.sbc": {"source":"iana"},
  "audio/vnd.presonus.multitrack": {"source":"iana"},
  "audio/vnd.qcelp": {"source":"apache"},
  "audio/vnd.rhetorex.32kadpcm": {"source":"iana"},
  "audio/vnd.rip": {"source":"iana","extensions":["rip"]},
  "audio/vnd.rn-realaudio": {"compressible":false},
  "audio/vnd.sealedmedia.softseal.mpeg": {"source":"iana"},
  "audio/vnd.vmx.cvsd": {"source":"iana"},
  "audio/vnd.wave": {"compressible":false},
  "audio/vorbis": {"source":"iana","compressible":false},
  "audio/vorbis-config": {"source":"iana"},
  "audio/wav": {"compressible":false,"extensions":["wav"]},
  "audio/wave": {"compressible":false,"extensions":["wav"]},
  "audio/webm": {"source":"apache","compressible":false,"extensions":["weba"]},
  "audio/x-aac": {"source":"apache","compressible":false,"extensions":["aac"]},
  "audio/x-aiff": {"source":"apache","extensions":["aif","aiff","aifc"]},
  "audio/x-caf": {"source":"apache","compressible":false,"extensions":["caf"]},
  "audio/x-flac": {"source":"apache","extensions":["flac"]},
  "audio/x-m4a": {"source":"nginx","extensions":["m4a"]},
  "audio/x-matroska": {"source":"apache","extensions":["mka"]},
  "audio/x-mpegurl": {"source":"apache","extensions":["m3u"]},
  "audio/x-ms-wax": {"source":"apache","extensions":["wax"]},
  "audio/x-ms-wma": {"source":"apache","extensions":["wma"]},
  "audio/x-pn-realaudio": {"source":"apache","extensions":["ram","ra"]},
  "audio/x-pn-realaudio-plugin": {"source":"apache","extensions":["rmp"]},
  "audio/x-realaudio": {"source":"nginx","extensions":["ra"]},
  "audio/x-tta": {"source":"apache"},
  "audio/x-wav": {"source":"apache","extensions":["wav"]},
  "audio/xm": {"source":"apache","extensions":["xm"]},
  "chemical/x-cdx": {"source":"apache","extensions":["cdx"]},
  "chemical/x-cif": {"source":"apache","extensions":["cif"]},
  "chemical/x-cmdf": {"source":"apache","extensions":["cmdf"]},
  "chemical/x-cml": {"source":"apache","extensions":["cml"]},
  "chemical/x-csml": {"source":"apache","extensions":["csml"]},
  "chemical/x-pdb": {"source":"apache"},
  "chemical/x-xyz": {"source":"apache","extensions":["xyz"]},
  "font/collection": {"source":"iana","extensions":["ttc"]},
  "font/otf": {"source":"iana","compressible":true,"extensions":["otf"]},
  "font/sfnt": {"source":"iana"},
  "font/ttf": {"source":"iana","compressible":true,"extensions":["ttf"]},
  "font/woff": {"source":"iana","extensions":["woff"]},
  "font/woff2": {"source":"iana","extensions":["woff2"]},
  "image/aces": {"source":"iana","extensions":["exr"]},
  "image/apng": {"source":"iana","compressible":false,"extensions":["apng"]},
  "image/avci": {"source":"iana","extensions":["avci"]},
  "image/avcs": {"source":"iana","extensions":["avcs"]},
  "image/avif": {"source":"iana","compressible":false,"extensions":["avif"]},
  "image/bmp": {"source":"iana","compressible":true,"extensions":["bmp","dib"]},
  "image/cgm": {"source":"iana","extensions":["cgm"]},
  "image/dicom-rle": {"source":"iana","extensions":["drle"]},
  "image/dpx": {"source":"iana","extensions":["dpx"]},
  "image/emf": {"source":"iana","extensions":["emf"]},
  "image/fits": {"source":"iana","extensions":["fits"]},
  "image/g3fax": {"source":"iana","extensions":["g3"]},
  "image/gif": {"source":"iana","compressible":false,"extensions":["gif"]},
  "image/heic": {"source":"iana","extensions":["heic"]},
  "image/heic-sequence": {"source":"iana","extensions":["heics"]},
  "image/heif": {"source":"iana","extensions":["heif"]},
  "image/heif-sequence": {"source":"iana","extensions":["heifs"]},
  "image/hej2k": {"source":"iana","extensions":["hej2"]},
  "image/ief": {"source":"iana","extensions":["ief"]},
  "image/j2c": {"source":"iana"},
  "image/jaii": {"source":"iana","extensions":["jaii"]},
  "image/jais": {"source":"iana","extensions":["jais"]},
  "image/jls": {"source":"iana","extensions":["jls"]},
  "image/jp2": {"source":"iana","compressible":false,"extensions":["jp2","jpg2"]},
  "image/jpeg": {"source":"iana","compressible":false,"extensions":["jpg","jpeg","jpe"]},
  "image/jph": {"source":"iana","extensions":["jph"]},
  "image/jphc": {"source":"iana","extensions":["jhc"]},
  "image/jpm": {"source":"iana","compressible":false,"extensions":["jpm","jpgm"]},
  "image/jpx": {"source":"iana","compressible":false,"extensions":["jpx","jpf"]},
  "image/jxl": {"source":"iana","extensions":["jxl"]},
  "image/jxr": {"source":"iana","extensions":["jxr"]},
  "image/jxra": {"source":"iana","extensions":["jxra"]},
  "image/jxrs": {"source":"iana","extensions":["jxrs"]},
  "image/jxs": {"source":"iana","extensions":["jxs"]},
  "image/jxsc": {"source":"iana","extensions":["jxsc"]},
  "image/jxsi": {"source":"iana","extensions":["jxsi"]},
  "image/jxss": {"source":"iana","extensions":["jxss"]},
  "image/ktx": {"source":"iana","extensions":["ktx"]},
  "image/ktx2": {"source":"iana","extensions":["ktx2"]},
  "image/naplps": {"source":"iana"},
  "image/pjpeg": {"compressible":false,"extensions":["jfif"]},
  "image/png": {"source":"iana","compressible":false,"extensions":["png"]},
  "image/prs.btif": {"source":"iana","extensions":["btif","btf"]},
  "image/prs.pti": {"source":"iana","extensions":["pti"]},
  "image/pwg-raster": {"source":"iana"},
  "image/sgi": {"source":"apache","extensions":["sgi"]},
  "image/svg+xml": {"source":"iana","compressible":true,"extensions":["svg","svgz"]},
  "image/t38": {"source":"iana","extensions":["t38"]},
  "image/tiff": {"source":"iana","compressible":false,"extensions":["tif","tiff"]},
  "image/tiff-fx": {"source":"iana","extensions":["tfx"]},
  "image/vnd.adobe.photoshop": {"source":"iana","compressible":true,"extensions":["psd"]},
  "image/vnd.airzip.accelerator.azv": {"source":"iana","extensions":["azv"]},
  "image/vnd.clip": {"source":"iana"},
  "image/vnd.cns.inf2": {"source":"iana"},
  "image/vnd.dece.graphic": {"source":"iana","extensions":["uvi","uvvi","uvg","uvvg"]},
  "image/vnd.djvu": {"source":"iana","extensions":["djvu","djv"]},
  "image/vnd.dvb.subtitle": {"source":"iana","extensions":["sub"]},
  "image/vnd.dwg": {"source":"iana","extensions":["dwg"]},
  "image/vnd.dxf": {"source":"iana","extensions":["dxf"]},
  "image/vnd.fastbidsheet": {"source":"iana","extensions":["fbs"]},
  "image/vnd.fpx": {"source":"iana","extensions":["fpx"]},
  "image/vnd.fst": {"source":"iana","extensions":["fst"]},
  "image/vnd.fujixerox.edmics-mmr": {"source":"iana","extensions":["mmr"]},
  "image/vnd.fujixerox.edmics-rlc": {"source":"iana","extensions":["rlc"]},
  "image/vnd.globalgraphics.pgb": {"source":"iana"},
  "image/vnd.microsoft.icon": {"source":"iana","compressible":true,"extensions":["ico"]},
  "image/vnd.mix": {"source":"iana"},
  "image/vnd.mozilla.apng": {"source":"iana"},
  "image/vnd.ms-dds": {"compressible":true,"extensions":["dds"]},
  "image/vnd.ms-modi": {"source":"iana","extensions":["mdi"]},
  "image/vnd.ms-photo": {"source":"apache","extensions":["wdp"]},
  "image/vnd.net-fpx": {"source":"iana","extensions":["npx"]},
  "image/vnd.pco.b16": {"source":"iana","extensions":["b16"]},
  "image/vnd.radiance": {"source":"iana"},
  "image/vnd.sealed.png": {"source":"iana"},
  "image/vnd.sealedmedia.softseal.gif": {"source":"iana"},
  "image/vnd.sealedmedia.softseal.jpg": {"source":"iana"},
  "image/vnd.svf": {"source":"iana"},
  "image/vnd.tencent.tap": {"source":"iana","extensions":["tap"]},
  "image/vnd.valve.source.texture": {"source":"iana","extensions":["vtf"]},
  "image/vnd.wap.wbmp": {"source":"iana","extensions":["wbmp"]},
  "image/vnd.xiff": {"source":"iana","extensions":["xif"]},
  "image/vnd.zbrush.pcx": {"source":"iana","extensions":["pcx"]},
  "image/webp": {"source":"iana","extensions":["webp"]},
  "image/wmf": {"source":"iana","extensions":["wmf"]},
  "image/x-3ds": {"source":"apache","extensions":["3ds"]},
  "image/x-adobe-dng": {"extensions":["dng"]},
  "image/x-cmu-raster": {"source":"apache","extensions":["ras"]},
  "image/x-cmx": {"source":"apache","extensions":["cmx"]},
  "image/x-emf": {"source":"iana"},
  "image/x-freehand": {"source":"apache","extensions":["fh","fhc","fh4","fh5","fh7"]},
  "image/x-icon": {"source":"apache","compressible":true,"extensions":["ico"]},
  "image/x-jng": {"source":"nginx","extensions":["jng"]},
  "image/x-mrsid-image": {"source":"apache","extensions":["sid"]},
  "image/x-ms-bmp": {"source":"nginx","compressible":true,"extensions":["bmp"]},
  "image/x-pcx": {"source":"apache","extensions":["pcx"]},
  "image/x-pict": {"source":"apache","extensions":["pic","pct"]},
  "image/x-portable-anymap": {"source":"apache","extensions":["pnm"]},
  "image/x-portable-bitmap": {"source":"apache","extensions":["pbm"]},
  "image/x-portable-graymap": {"source":"apache","extensions":["pgm"]},
  "image/x-portable-pixmap": {"source":"apache","extensions":["ppm"]},
  "image/x-rgb": {"source":"apache","extensions":["rgb"]},
  "image/x-tga": {"source":"apache","extensions":["tga"]},
  "image/x-wmf": {"source":"iana"},
  "image/x-xbitmap": {"source":"apache","extensions":["xbm"]},
  "image/x-xcf": {"compressible":false},
  "image/x-xpixmap": {"source":"apache","extensions":["xpm"]},
  "image/x-xwindowdump": {"source":"apache","extensions":["xwd"]},
  "message/bhttp": {"source":"iana"},
  "message/cpim": {"source":"iana"},
  "message/delivery-status": {"source":"iana"},
  "message/disposition-notification": {"source":"iana","extensions":["disposition-notification"]},
  "message/external-body": {"source":"iana"},
  "message/feedback-report": {"source":"iana"},
  "message/global": {"source":"iana","extensions":["u8msg"]},
  "message/global-delivery-status": {"source":"iana","extensions":["u8dsn"]},
  "message/global-disposition-notification": {"source":"iana","extensions":["u8mdn"]},
  "message/global-headers": {"source":"iana","extensions":["u8hdr"]},
  "message/http": {"source":"iana","compressible":false},
  "message/imdn+xml": {"source":"iana","compressible":true},
  "message/mls": {"source":"iana"},
  "message/news": {"source":"apache"},
  "message/ohttp-req": {"source":"iana"},
  "message/ohttp-res": {"source":"iana"},
  "message/partial": {"source":"iana","compressible":false},
  "message/rfc822": {"source":"iana","compressible":true,"extensions":["eml","mime","mht","mhtml"]},
  "message/s-http": {"source":"apache"},
  "message/sip": {"source":"iana"},
  "message/sipfrag": {"source":"iana"},
  "message/tracking-status": {"source":"iana"},
  "message/vnd.si.simp": {"source":"apache"},
  "message/vnd.wfa.wsc": {"source":"iana","extensions":["wsc"]},
  "model/3mf": {"source":"iana","extensions":["3mf"]},
  "model/e57": {"source":"iana"},
  "model/gltf+json": {"source":"iana","compressible":true,"extensions":["gltf"]},
  "model/gltf-binary": {"source":"iana","compressible":true,"extensions":["glb"]},
  "model/iges": {"source":"iana","compressible":false,"extensions":["igs","iges"]},
  "model/jt": {"source":"iana","extensions":["jt"]},
  "model/mesh": {"source":"iana","compressible":false,"extensions":["msh","mesh","silo"]},
  "model/mtl": {"source":"iana","extensions":["mtl"]},
  "model/obj": {"source":"iana","extensions":["obj"]},
  "model/prc": {"source":"iana","extensions":["prc"]},
  "model/step": {"source":"iana","extensions":["step","stp","stpnc","p21","210"]},
  "model/step+xml": {"source":"iana","compressible":true,"extensions":["stpx"]},
  "model/step+zip": {"source":"iana","compressible":false,"extensions":["stpz"]},
  "model/step-xml+zip": {"source":"iana","compressible":false,"extensions":["stpxz"]},
  "model/stl": {"source":"iana","extensions":["stl"]},
  "model/u3d": {"source":"iana","extensions":["u3d"]},
  "model/vnd.bary": {"source":"iana","extensions":["bary"]},
  "model/vnd.cld": {"source":"iana","extensions":["cld"]},
  "model/vnd.collada+xml": {"source":"iana","compressible":true,"extensions":["dae"]},
  "model/vnd.dwf": {"source":"iana","extensions":["dwf"]},
  "model/vnd.flatland.3dml": {"source":"iana"},
  "model/vnd.gdl": {"source":"iana","extensions":["gdl"]},
  "model/vnd.gs-gdl": {"source":"apache"},
  "model/vnd.gs.gdl": {"source":"iana"},
  "model/vnd.gtw": {"source":"iana","extensions":["gtw"]},
  "model/vnd.moml+xml": {"source":"iana","compressible":true},
  "model/vnd.mts": {"source":"iana","extensions":["mts"]},
  "model/vnd.opengex": {"source":"iana","extensions":["ogex"]},
  "model/vnd.parasolid.transmit.binary": {"source":"iana","extensions":["x_b"]},
  "model/vnd.parasolid.transmit.text": {"source":"iana","extensions":["x_t"]},
  "model/vnd.pytha.pyox": {"source":"iana","extensions":["pyo","pyox"]},
  "model/vnd.rosette.annotated-data-model": {"source":"iana"},
  "model/vnd.sap.vds": {"source":"iana","extensions":["vds"]},
  "model/vnd.usda": {"source":"iana","extensions":["usda"]},
  "model/vnd.usdz+zip": {"source":"iana","compressible":false,"extensions":["usdz"]},
  "model/vnd.valve.source.compiled-map": {"source":"iana","extensions":["bsp"]},
  "model/vnd.vtu": {"source":"iana","extensions":["vtu"]},
  "model/vrml": {"source":"iana","compressible":false,"extensions":["wrl","vrml"]},
  "model/x3d+binary": {"source":"apache","compressible":false,"extensions":["x3db","x3dbz"]},
  "model/x3d+fastinfoset": {"source":"iana","extensions":["x3db"]},
  "model/x3d+vrml": {"source":"apache","compressible":false,"extensions":["x3dv","x3dvz"]},
  "model/x3d+xml": {"source":"iana","compressible":true,"extensions":["x3d","x3dz"]},
  "model/x3d-vrml": {"source":"iana","extensions":["x3dv"]},
  "multipart/alternative": {"source":"iana","compressible":false},
  "multipart/appledouble": {"source":"iana"},
  "multipart/byteranges": {"source":"iana"},
  "multipart/digest": {"source":"iana"},
  "multipart/encrypted": {"source":"iana","compressible":false},
  "multipart/form-data": {"source":"iana","compressible":false},
  "multipart/header-set": {"source":"iana"},
  "multipart/mixed": {"source":"iana"},
  "multipart/multilingual": {"source":"iana"},
  "multipart/parallel": {"source":"iana"},
  "multipart/related": {"source":"iana","compressible":false},
  "multipart/report": {"source":"iana"},
  "multipart/signed": {"source":"iana","compressible":false},
  "multipart/vnd.bint.med-plus": {"source":"iana"},
  "multipart/voice-message": {"source":"iana"},
  "multipart/x-mixed-replace": {"source":"iana"},
  "text/1d-interleaved-parityfec": {"source":"iana"},
  "text/cache-manifest": {"source":"iana","compressible":true,"extensions":["appcache","manifest"]},
  "text/calendar": {"source":"iana","extensions":["ics","ifb"]},
  "text/calender": {"compressible":true},
  "text/cmd": {"compressible":true},
  "text/coffeescript": {"extensions":["coffee","litcoffee"]},
  "text/cql": {"source":"iana"},
  "text/cql-expression": {"source":"iana"},
  "text/cql-identifier": {"source":"iana"},
  "text/css": {"source":"iana","charset":"UTF-8","compressible":true,"extensions":["css"]},
  "text/csv": {"source":"iana","compressible":true,"extensions":["csv"]},
  "text/csv-schema": {"source":"iana"},
  "text/directory": {"source":"iana"},
  "text/dns": {"source":"iana"},
  "text/ecmascript": {"source":"apache"},
  "text/encaprtp": {"source":"iana"},
  "text/enriched": {"source":"iana"},
  "text/fhirpath": {"source":"iana"},
  "text/flexfec": {"source":"iana"},
  "text/fwdred": {"source":"iana"},
  "text/gff3": {"source":"iana"},
  "text/grammar-ref-list": {"source":"iana"},
  "text/hl7v2": {"source":"iana"},
  "text/html": {"source":"iana","compressible":true,"extensions":["html","htm","shtml"]},
  "text/jade": {"extensions":["jade"]},
  "text/javascript": {"source":"iana","charset":"UTF-8","compressible":true,"extensions":["js","mjs"]},
  "text/jcr-cnd": {"source":"iana"},
  "text/jsx": {"compressible":true,"extensions":["jsx"]},
  "text/less": {"compressible":true,"extensions":["less"]},
  "text/markdown": {"source":"iana","compressible":true,"extensions":["md","markdown"]},
  "text/mathml": {"source":"nginx","extensions":["mml"]},
  "text/mdx": {"compressible":true,"extensions":["mdx"]},
  "text/mizar": {"source":"iana"},
  "text/n3": {"source":"iana","charset":"UTF-8","compressible":true,"extensions":["n3"]},
  "text/parameters": {"source":"iana","charset":"UTF-8"},
  "text/parityfec": {"source":"iana"},
  "text/plain": {"source":"iana","compressible":true,"extensions":["txt","text","conf","def","list","log","in","ini"]},
  "text/provenance-notation": {"source":"iana","charset":"UTF-8"},
  "text/prs.fallenstein.rst": {"source":"iana"},
  "text/prs.lines.tag": {"source":"iana","extensions":["dsc"]},
  "text/prs.prop.logic": {"source":"iana"},
  "text/prs.texi": {"source":"iana"},
  "text/raptorfec": {"source":"iana"},
  "text/red": {"source":"iana"},
  "text/rfc822-headers": {"source":"iana"},
  "text/richtext": {"source":"iana","compressible":true,"extensions":["rtx"]},
  "text/rtf": {"source":"iana","compressible":true,"extensions":["rtf"]},
  "text/rtp-enc-aescm128": {"source":"iana"},
  "text/rtploopback": {"source":"iana"},
  "text/rtx": {"source":"iana"},
  "text/sgml": {"source":"iana","extensions":["sgml","sgm"]},
  "text/shaclc": {"source":"iana"},
  "text/shex": {"source":"iana","extensions":["shex"]},
  "text/slim": {"extensions":["slim","slm"]},
  "text/spdx": {"source":"iana","extensions":["spdx"]},
  "text/strings": {"source":"iana"},
  "text/stylus": {"extensions":["stylus","styl"]},
  "text/t140": {"source":"iana"},
  "text/tab-separated-values": {"source":"iana","compressible":true,"extensions":["tsv"]},
  "text/troff": {"source":"iana","extensions":["t","tr","roff","man","me","ms"]},
  "text/turtle": {"source":"iana","charset":"UTF-8","extensions":["ttl"]},
  "text/ulpfec": {"source":"iana"},
  "text/uri-list": {"source":"iana","compressible":true,"extensions":["uri","uris","urls"]},
  "text/vcard": {"source":"iana","compressible":true,"extensions":["vcard"]},
  "text/vnd.a": {"source":"iana"},
  "text/vnd.abc": {"source":"iana"},
  "text/vnd.ascii-art": {"source":"iana"},
  "text/vnd.curl": {"source":"iana","extensions":["curl"]},
  "text/vnd.curl.dcurl": {"source":"apache","extensions":["dcurl"]},
  "text/vnd.curl.mcurl": {"source":"apache","extensions":["mcurl"]},
  "text/vnd.curl.scurl": {"source":"apache","extensions":["scurl"]},
  "text/vnd.debian.copyright": {"source":"iana","charset":"UTF-8"},
  "text/vnd.dmclientscript": {"source":"iana"},
  "text/vnd.dvb.subtitle": {"source":"iana","extensions":["sub"]},
  "text/vnd.esmertec.theme-descriptor": {"source":"iana","charset":"UTF-8"},
  "text/vnd.exchangeable": {"source":"iana"},
  "text/vnd.familysearch.gedcom": {"source":"iana","extensions":["ged"]},
  "text/vnd.ficlab.flt": {"source":"iana"},
  "text/vnd.fly": {"source":"iana","extensions":["fly"]},
  "text/vnd.fmi.flexstor": {"source":"iana","extensions":["flx"]},
  "text/vnd.gml": {"source":"iana"},
  "text/vnd.graphviz": {"source":"iana","extensions":["gv"]},
  "text/vnd.hans": {"source":"iana"},
  "text/vnd.hgl": {"source":"iana"},
  "text/vnd.in3d.3dml": {"source":"iana","extensions":["3dml"]},
  "text/vnd.in3d.spot": {"source":"iana","extensions":["spot"]},
  "text/vnd.iptc.newsml": {"source":"iana"},
  "text/vnd.iptc.nitf": {"source":"iana"},
  "text/vnd.latex-z": {"source":"iana"},
  "text/vnd.motorola.reflex": {"source":"iana"},
  "text/vnd.ms-mediapackage": {"source":"iana"},
  "text/vnd.net2phone.commcenter.command": {"source":"iana"},
  "text/vnd.radisys.msml-basic-layout": {"source":"iana"},
  "text/vnd.senx.warpscript": {"source":"iana"},
  "text/vnd.si.uricatalogue": {"source":"apache"},
  "text/vnd.sosi": {"source":"iana"},
  "text/vnd.sun.j2me.app-descriptor": {"source":"iana","charset":"UTF-8","extensions":["jad"]},
  "text/vnd.trolltech.linguist": {"source":"iana","charset":"UTF-8"},
  "text/vnd.vcf": {"source":"iana"},
  "text/vnd.wap.si": {"source":"iana"},
  "text/vnd.wap.sl": {"source":"iana"},
  "text/vnd.wap.wml": {"source":"iana","extensions":["wml"]},
  "text/vnd.wap.wmlscript": {"source":"iana","extensions":["wmls"]},
  "text/vnd.zoo.kcl": {"source":"iana"},
  "text/vtt": {"source":"iana","charset":"UTF-8","compressible":true,"extensions":["vtt"]},
  "text/wgsl": {"source":"iana","extensions":["wgsl"]},
  "text/x-asm": {"source":"apache","extensions":["s","asm"]},
  "text/x-c": {"source":"apache","extensions":["c","cc","cxx","cpp","h","hh","dic"]},
  "text/x-component": {"source":"nginx","extensions":["htc"]},
  "text/x-fortran": {"source":"apache","extensions":["f","for","f77","f90"]},
  "text/x-gwt-rpc": {"compressible":true},
  "text/x-handlebars-template": {"extensions":["hbs"]},
  "text/x-java-source": {"source":"apache","extensions":["java"]},
  "text/x-jquery-tmpl": {"compressible":true},
  "text/x-lua": {"extensions":["lua"]},
  "text/x-markdown": {"compressible":true,"extensions":["mkd"]},
  "text/x-nfo": {"source":"apache","extensions":["nfo"]},
  "text/x-opml": {"source":"apache","extensions":["opml"]},
  "text/x-org": {"compressible":true,"extensions":["org"]},
  "text/x-pascal": {"source":"apache","extensions":["p","pas"]},
  "text/x-processing": {"compressible":true,"extensions":["pde"]},
  "text/x-sass": {"extensions":["sass"]},
  "text/x-scss": {"extensions":["scss"]},
  "text/x-setext": {"source":"apache","extensions":["etx"]},
  "text/x-sfv": {"source":"apache","extensions":["sfv"]},
  "text/x-suse-ymp": {"compressible":true,"extensions":["ymp"]},
  "text/x-uuencode": {"source":"apache","extensions":["uu"]},
  "text/x-vcalendar": {"source":"apache","extensions":["vcs"]},
  "text/x-vcard": {"source":"apache","extensions":["vcf"]},
  "text/xml": {"source":"iana","compressible":true,"extensions":["xml"]},
  "text/xml-external-parsed-entity": {"source":"iana"},
  "text/yaml": {"compressible":true,"extensions":["yaml","yml"]},
  "video/1d-interleaved-parityfec": {"source":"iana"},
  "video/3gpp": {"source":"iana","extensions":["3gp","3gpp"]},
  "video/3gpp-tt": {"source":"iana"},
  "video/3gpp2": {"source":"iana","extensions":["3g2"]},
  "video/av1": {"source":"iana"},
  "video/bmpeg": {"source":"iana"},
  "video/bt656": {"source":"iana"},
  "video/celb": {"source":"iana"},
  "video/dv": {"source":"iana"},
  "video/encaprtp": {"source":"iana"},
  "video/evc": {"source":"iana"},
  "video/ffv1": {"source":"iana"},
  "video/flexfec": {"source":"iana"},
  "video/h261": {"source":"iana","extensions":["h261"]},
  "video/h263": {"source":"iana","extensions":["h263"]},
  "video/h263-1998": {"source":"iana"},
  "video/h263-2000": {"source":"iana"},
  "video/h264": {"source":"iana","extensions":["h264"]},
  "video/h264-rcdo": {"source":"iana"},
  "video/h264-svc": {"source":"iana"},
  "video/h265": {"source":"iana"},
  "video/h266": {"source":"iana"},
  "video/iso.segment": {"source":"iana","extensions":["m4s"]},
  "video/jpeg": {"source":"iana","extensions":["jpgv"]},
  "video/jpeg2000": {"source":"iana"},
  "video/jpm": {"source":"apache","extensions":["jpm","jpgm"]},
  "video/jxsv": {"source":"iana"},
  "video/lottie+json": {"source":"iana","compressible":true},
  "video/matroska": {"source":"iana"},
  "video/matroska-3d": {"source":"iana"},
  "video/mj2": {"source":"iana","extensions":["mj2","mjp2"]},
  "video/mp1s": {"source":"iana"},
  "video/mp2p": {"source":"iana"},
  "video/mp2t": {"source":"iana","extensions":["ts","m2t","m2ts","mts"]},
  "video/mp4": {"source":"iana","compressible":false,"extensions":["mp4","mp4v","mpg4"]},
  "video/mp4v-es": {"source":"iana"},
  "video/mpeg": {"source":"iana","compressible":false,"extensions":["mpeg","mpg","mpe","m1v","m2v"]},
  "video/mpeg4-generic": {"source":"iana"},
  "video/mpv": {"source":"iana"},
  "video/nv": {"source":"iana"},
  "video/ogg": {"source":"iana","compressible":false,"extensions":["ogv"]},
  "video/parityfec": {"source":"iana"},
  "video/pointer": {"source":"iana"},
  "video/quicktime": {"source":"iana","compressible":false,"extensions":["qt","mov"]},
  "video/raptorfec": {"source":"iana"},
  "video/raw": {"source":"iana"},
  "video/rtp-enc-aescm128": {"source":"iana"},
  "video/rtploopback": {"source":"iana"},
  "video/rtx": {"source":"iana"},
  "video/scip": {"source":"iana"},
  "video/smpte291": {"source":"iana"},
  "video/smpte292m": {"source":"iana"},
  "video/ulpfec": {"source":"iana"},
  "video/vc1": {"source":"iana"},
  "video/vc2": {"source":"iana"},
  "video/vnd.cctv": {"source":"iana"},
  "video/vnd.dece.hd": {"source":"iana","extensions":["uvh","uvvh"]},
  "video/vnd.dece.mobile": {"source":"iana","extensions":["uvm","uvvm"]},
  "video/vnd.dece.mp4": {"source":"iana"},
  "video/vnd.dece.pd": {"source":"iana","extensions":["uvp","uvvp"]},
  "video/vnd.dece.sd": {"source":"iana","extensions":["uvs","uvvs"]},
  "video/vnd.dece.video": {"source":"iana","extensions":["uvv","uvvv"]},
  "video/vnd.directv.mpeg": {"source":"iana"},
  "video/vnd.directv.mpeg-tts": {"source":"iana"},
  "video/vnd.dlna.mpeg-tts": {"source":"iana"},
  "video/vnd.dvb.file": {"source":"iana","extensions":["dvb"]},
  "video/vnd.fvt": {"source":"iana","extensions":["fvt"]},
  "video/vnd.hns.video": {"source":"iana"},
  "video/vnd.iptvforum.1dparityfec-1010": {"source":"iana"},
  "video/vnd.iptvforum.1dparityfec-2005": {"source":"iana"},
  "video/vnd.iptvforum.2dparityfec-1010": {"source":"iana"},
  "video/vnd.iptvforum.2dparityfec-2005": {"source":"iana"},
  "video/vnd.iptvforum.ttsavc": {"source":"iana"},
  "video/vnd.iptvforum.ttsmpeg2": {"source":"iana"},
  "video/vnd.motorola.video": {"source":"iana"},
  "video/vnd.motorola.videop": {"source":"iana"},
  "video/vnd.mpegurl": {"source":"iana","extensions":["mxu","m4u"]},
  "video/vnd.ms-playready.media.pyv": {"source":"iana","extensions":["pyv"]},
  "video/vnd.nokia.interleaved-multimedia": {"source":"iana"},
  "video/vnd.nokia.mp4vr": {"source":"iana"},
  "video/vnd.nokia.videovoip": {"source":"iana"},
  "video/vnd.objectvideo": {"source":"iana"},
  "video/vnd.planar": {"source":"iana"},
  "video/vnd.radgamettools.bink": {"source":"iana"},
  "video/vnd.radgamettools.smacker": {"source":"apache"},
  "video/vnd.sealed.mpeg1": {"source":"iana"},
  "video/vnd.sealed.mpeg4": {"source":"iana"},
  "video/vnd.sealed.swf": {"source":"iana"},
  "video/vnd.sealedmedia.softseal.mov": {"source":"iana"},
  "video/vnd.uvvu.mp4": {"source":"iana","extensions":["uvu","uvvu"]},
  "video/vnd.vivo": {"source":"iana","extensions":["viv"]},
  "video/vnd.youtube.yt": {"source":"iana"},
  "video/vp8": {"source":"iana"},
  "video/vp9": {"source":"iana"},
  "video/webm": {"source":"apache","compressible":false,"extensions":["webm"]},
  "video/x-f4v": {"source":"apache","extensions":["f4v"]},
  "video/x-fli": {"source":"apache","extensions":["fli"]},
  "video/x-flv": {"source":"apache","compressible":false,"extensions":["flv"]},
  "video/x-m4v": {"source":"apache","extensions":["m4v"]},
  "video/x-matroska": {"source":"apache","compressible":false,"extensions":["mkv","mk3d","mks"]},
  "video/x-mng": {"source":"apache","extensions":["mng"]},
  "video/x-ms-asf": {"source":"apache","extensions":["asf","asx"]},
  "video/x-ms-vob": {"source":"apache","extensions":["vob"]},
  "video/x-ms-wm": {"source":"apache","extensions":["wm"]},
  "video/x-ms-wmv": {"source":"apache","compressible":false,"extensions":["wmv"]},
  "video/x-ms-wmx": {"source":"apache","extensions":["wmx"]},
  "video/x-ms-wvx": {"source":"apache","extensions":["wvx"]},
  "video/x-msvideo": {"source":"apache","extensions":["avi"]},
  "video/x-sgi-movie": {"source":"apache","extensions":["movie"]},
  "video/x-smv": {"source":"apache","extensions":["smv"]},
  "x-conference/x-cooltalk": {"source":"apache","extensions":["ice"]},
  "x-shader/x-fragment": {"compressible":true},
  "x-shader/x-vertex": {"compressible":true},
};

/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2022 Douglas Christopher Wilson
 * MIT Licensed
 */

var mimeDb;
var hasRequiredMimeDb;

function requireMimeDb () {
	if (hasRequiredMimeDb) return mimeDb;
	hasRequiredMimeDb = 1;
	/**
	 * Module exports.
	 */

	mimeDb = require$$0;
	return mimeDb;
}

var mimeScore;
var hasRequiredMimeScore;

function requireMimeScore () {
	if (hasRequiredMimeScore) return mimeScore;
	hasRequiredMimeScore = 1;
	// 'mime-score' back-ported to CommonJS

	// Score RFC facets (see https://tools.ietf.org/html/rfc6838#section-3)
	var FACET_SCORES = {
	  'prs.': 100,
	  'x-': 200,
	  'x.': 300,
	  'vnd.': 400,
	  default: 900
	};

	// Score mime source (Logic originally from `jshttp/mime-types` module)
	var SOURCE_SCORES = {
	  nginx: 10,
	  apache: 20,
	  iana: 40,
	  default: 30 // definitions added by `jshttp/mime-db` project?
	};

	var TYPE_SCORES = {
	  // prefer application/xml over text/xml
	  // prefer application/rtf over text/rtf
	  application: 1,

	  // prefer font/woff over application/font-woff
	  font: 2,

	  // prefer video/mp4 over audio/mp4 over application/mp4
	  // See https://www.rfc-editor.org/rfc/rfc4337.html#section-2
	  audio: 2,
	  video: 3,

	  default: 0
	};

	/**
	 * Get each component of the score for a mime type.  The sum of these is the
	 * total score.  The higher the score, the more "official" the type.
	 */
	mimeScore = function mimeScore (mimeType, source = 'default') {
	  if (mimeType === 'application/octet-stream') {
	    return 0
	  }

	  const [type, subtype] = mimeType.split('/');

	  const facet = subtype.replace(/(\.|x-).*/, '$1');

	  const facetScore = FACET_SCORES[facet] || FACET_SCORES.default;
	  const sourceScore = SOURCE_SCORES[source] || SOURCE_SCORES.default;
	  const typeScore = TYPE_SCORES[type] || TYPE_SCORES.default;

	  // All else being equal prefer shorter types
	  const lengthScore = 1 - mimeType.length / 100;

	  return facetScore + sourceScore + typeScore + lengthScore
	};
	return mimeScore;
}

/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

var hasRequiredMimeTypes;

function requireMimeTypes () {
	if (hasRequiredMimeTypes) return mimeTypes;
	hasRequiredMimeTypes = 1;
	(function (exports$1) {

		/**
		 * Module dependencies.
		 * @private
		 */

		var db = requireMimeDb();
		var extname = require$$0$2.extname;
		var mimeScore = requireMimeScore();

		/**
		 * Module variables.
		 * @private
		 */

		var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
		var TEXT_TYPE_REGEXP = /^text\//i;

		/**
		 * Module exports.
		 * @public
		 */

		exports$1.charset = charset;
		exports$1.charsets = { lookup: charset };
		exports$1.contentType = contentType;
		exports$1.extension = extension;
		exports$1.extensions = Object.create(null);
		exports$1.lookup = lookup;
		exports$1.types = Object.create(null);
		exports$1._extensionConflicts = [];

		// Populate the extensions/types maps
		populateMaps(exports$1.extensions, exports$1.types);

		/**
		 * Get the default charset for a MIME type.
		 *
		 * @param {string} type
		 * @return {false|string}
		 */

		function charset (type) {
		  if (!type || typeof type !== 'string') {
		    return false
		  }

		  // TODO: use media-typer
		  var match = EXTRACT_TYPE_REGEXP.exec(type);
		  var mime = match && db[match[1].toLowerCase()];

		  if (mime && mime.charset) {
		    return mime.charset
		  }

		  // default text/* to utf-8
		  if (match && TEXT_TYPE_REGEXP.test(match[1])) {
		    return 'UTF-8'
		  }

		  return false
		}

		/**
		 * Create a full Content-Type header given a MIME type or extension.
		 *
		 * @param {string} str
		 * @return {false|string}
		 */

		function contentType (str) {
		  // TODO: should this even be in this module?
		  if (!str || typeof str !== 'string') {
		    return false
		  }

		  var mime = str.indexOf('/') === -1 ? exports$1.lookup(str) : str;

		  if (!mime) {
		    return false
		  }

		  // TODO: use content-type or other module
		  if (mime.indexOf('charset') === -1) {
		    var charset = exports$1.charset(mime);
		    if (charset) mime += '; charset=' + charset.toLowerCase();
		  }

		  return mime
		}

		/**
		 * Get the default extension for a MIME type.
		 *
		 * @param {string} type
		 * @return {false|string}
		 */

		function extension (type) {
		  if (!type || typeof type !== 'string') {
		    return false
		  }

		  // TODO: use media-typer
		  var match = EXTRACT_TYPE_REGEXP.exec(type);

		  // get extensions
		  var exts = match && exports$1.extensions[match[1].toLowerCase()];

		  if (!exts || !exts.length) {
		    return false
		  }

		  return exts[0]
		}

		/**
		 * Lookup the MIME type for a file path/extension.
		 *
		 * @param {string} path
		 * @return {false|string}
		 */

		function lookup (path) {
		  if (!path || typeof path !== 'string') {
		    return false
		  }

		  // get the extension ("ext" or ".ext" or full path)
		  var extension = extname('x.' + path)
		    .toLowerCase()
		    .slice(1);

		  if (!extension) {
		    return false
		  }

		  return exports$1.types[extension] || false
		}

		/**
		 * Populate the extensions and types maps.
		 * @private
		 */

		function populateMaps (extensions, types) {
		  Object.keys(db).forEach(function forEachMimeType (type) {
		    var mime = db[type];
		    var exts = mime.extensions;

		    if (!exts || !exts.length) {
		      return
		    }

		    // mime -> extensions
		    extensions[type] = exts;

		    // extension -> mime
		    for (var i = 0; i < exts.length; i++) {
		      var extension = exts[i];
		      types[extension] = _preferredType(extension, types[extension], type);

		      // DELETE (eventually): Capture extension->type maps that change as a
		      // result of switching to mime-score.  This is just to help make reviewing
		      // PR #119 easier, and can be removed once that PR is approved.
		      const legacyType = _preferredTypeLegacy(
		        extension,
		        types[extension],
		        type
		      );
		      if (legacyType !== types[extension]) {
		        exports$1._extensionConflicts.push([extension, legacyType, types[extension]]);
		      }
		    }
		  });
		}

		// Resolve type conflict using mime-score
		function _preferredType (ext, type0, type1) {
		  var score0 = type0 ? mimeScore(type0, db[type0].source) : 0;
		  var score1 = type1 ? mimeScore(type1, db[type1].source) : 0;

		  return score0 > score1 ? type0 : type1
		}

		// Resolve type conflict using pre-mime-score logic
		function _preferredTypeLegacy (ext, type0, type1) {
		  var SOURCE_RANK = ['nginx', 'apache', undefined, 'iana'];

		  var score0 = type0 ? SOURCE_RANK.indexOf(db[type0].source) : 0;
		  var score1 = type1 ? SOURCE_RANK.indexOf(db[type1].source) : 0;

		  if (
		    exports$1.types[extension] !== 'application/octet-stream' &&
		    (score0 > score1 ||
		      (score0 === score1 &&
		        exports$1.types[extension]?.slice(0, 12) === 'application/'))
		  ) {
		    return type0
		  }

		  return score0 > score1 ? type0 : type1
		} 
	} (mimeTypes));
	return mimeTypes;
}

var onFinished = {exports: {}};

/*!
 * ee-first
 * Copyright(c) 2014 Jonathan Ong
 * MIT Licensed
 */

var eeFirst;
var hasRequiredEeFirst;

function requireEeFirst () {
	if (hasRequiredEeFirst) return eeFirst;
	hasRequiredEeFirst = 1;

	/**
	 * Module exports.
	 * @public
	 */

	eeFirst = first;

	/**
	 * Get the first event in a set of event emitters and event pairs.
	 *
	 * @param {array} stuff
	 * @param {function} done
	 * @public
	 */

	function first(stuff, done) {
	  if (!Array.isArray(stuff))
	    throw new TypeError('arg must be an array of [ee, events...] arrays')

	  var cleanups = [];

	  for (var i = 0; i < stuff.length; i++) {
	    var arr = stuff[i];

	    if (!Array.isArray(arr) || arr.length < 2)
	      throw new TypeError('each array member must be [ee, events...]')

	    var ee = arr[0];

	    for (var j = 1; j < arr.length; j++) {
	      var event = arr[j];
	      var fn = listener(event, callback);

	      // listen to the event
	      ee.on(event, fn);
	      // push this listener to the list of cleanups
	      cleanups.push({
	        ee: ee,
	        event: event,
	        fn: fn,
	      });
	    }
	  }

	  function callback() {
	    cleanup();
	    done.apply(null, arguments);
	  }

	  function cleanup() {
	    var x;
	    for (var i = 0; i < cleanups.length; i++) {
	      x = cleanups[i];
	      x.ee.removeListener(x.event, x.fn);
	    }
	  }

	  function thunk(fn) {
	    done = fn;
	  }

	  thunk.cancel = cleanup;

	  return thunk
	}

	/**
	 * Create the event listener.
	 * @private
	 */

	function listener(event, done) {
	  return function onevent(arg1) {
	    var args = new Array(arguments.length);
	    var ee = this;
	    var err = event === 'error'
	      ? arg1
	      : null;

	    // copy args to prevent arguments escaping scope
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }

	    done(err, ee, event, args);
	  }
	}
	return eeFirst;
}

/*!
 * on-finished
 * Copyright(c) 2013 Jonathan Ong
 * Copyright(c) 2014 Douglas Christopher Wilson
 * MIT Licensed
 */

var hasRequiredOnFinished;

function requireOnFinished () {
	if (hasRequiredOnFinished) return onFinished.exports;
	hasRequiredOnFinished = 1;

	/**
	 * Module exports.
	 * @public
	 */

	onFinished.exports = onFinished$1;
	onFinished.exports.isFinished = isFinished;

	/**
	 * Module dependencies.
	 * @private
	 */

	var asyncHooks = tryRequireAsyncHooks();
	var first = requireEeFirst();

	/**
	 * Variables.
	 * @private
	 */

	/* istanbul ignore next */
	var defer = typeof setImmediate === 'function'
	  ? setImmediate
	  : function (fn) { process.nextTick(fn.bind.apply(fn, arguments)); };

	/**
	 * Invoke callback when the response has finished, useful for
	 * cleaning up resources afterwards.
	 *
	 * @param {object} msg
	 * @param {function} listener
	 * @return {object}
	 * @public
	 */

	function onFinished$1 (msg, listener) {
	  if (isFinished(msg) !== false) {
	    defer(listener, null, msg);
	    return msg
	  }

	  // attach the listener to the message
	  attachListener(msg, wrap(listener));

	  return msg
	}

	/**
	 * Determine if message is already finished.
	 *
	 * @param {object} msg
	 * @return {boolean}
	 * @public
	 */

	function isFinished (msg) {
	  var socket = msg.socket;

	  if (typeof msg.finished === 'boolean') {
	    // OutgoingMessage
	    return Boolean(msg.finished || (socket && !socket.writable))
	  }

	  if (typeof msg.complete === 'boolean') {
	    // IncomingMessage
	    return Boolean(msg.upgrade || !socket || !socket.readable || (msg.complete && !msg.readable))
	  }

	  // don't know
	  return undefined
	}

	/**
	 * Attach a finished listener to the message.
	 *
	 * @param {object} msg
	 * @param {function} callback
	 * @private
	 */

	function attachFinishedListener (msg, callback) {
	  var eeMsg;
	  var eeSocket;
	  var finished = false;

	  function onFinish (error) {
	    eeMsg.cancel();
	    eeSocket.cancel();

	    finished = true;
	    callback(error);
	  }

	  // finished on first message event
	  eeMsg = eeSocket = first([[msg, 'end', 'finish']], onFinish);

	  function onSocket (socket) {
	    // remove listener
	    msg.removeListener('socket', onSocket);

	    if (finished) return
	    if (eeMsg !== eeSocket) return

	    // finished on first socket event
	    eeSocket = first([[socket, 'error', 'close']], onFinish);
	  }

	  if (msg.socket) {
	    // socket already assigned
	    onSocket(msg.socket);
	    return
	  }

	  // wait for socket to be assigned
	  msg.on('socket', onSocket);

	  if (msg.socket === undefined) {
	    // istanbul ignore next: node.js 0.8 patch
	    patchAssignSocket(msg, onSocket);
	  }
	}

	/**
	 * Attach the listener to the message.
	 *
	 * @param {object} msg
	 * @return {function}
	 * @private
	 */

	function attachListener (msg, listener) {
	  var attached = msg.__onFinished;

	  // create a private single listener with queue
	  if (!attached || !attached.queue) {
	    attached = msg.__onFinished = createListener(msg);
	    attachFinishedListener(msg, attached);
	  }

	  attached.queue.push(listener);
	}

	/**
	 * Create listener on message.
	 *
	 * @param {object} msg
	 * @return {function}
	 * @private
	 */

	function createListener (msg) {
	  function listener (err) {
	    if (msg.__onFinished === listener) msg.__onFinished = null;
	    if (!listener.queue) return

	    var queue = listener.queue;
	    listener.queue = null;

	    for (var i = 0; i < queue.length; i++) {
	      queue[i](err, msg);
	    }
	  }

	  listener.queue = [];

	  return listener
	}

	/**
	 * Patch ServerResponse.prototype.assignSocket for node.js 0.8.
	 *
	 * @param {ServerResponse} res
	 * @param {function} callback
	 * @private
	 */

	// istanbul ignore next: node.js 0.8 patch
	function patchAssignSocket (res, callback) {
	  var assignSocket = res.assignSocket;

	  if (typeof assignSocket !== 'function') return

	  // res.on('socket', callback) is broken in 0.8
	  res.assignSocket = function _assignSocket (socket) {
	    assignSocket.call(this, socket);
	    callback(socket);
	  };
	}

	/**
	 * Try to require async_hooks
	 * @private
	 */

	function tryRequireAsyncHooks () {
	  try {
	    return require('async_hooks')
	  } catch (e) {
	    return {}
	  }
	}

	/**
	 * Wrap function with async resource, if possible.
	 * AsyncResource.bind static method backported.
	 * @private
	 */

	function wrap (fn) {
	  var res;

	  // create anonymous resource
	  if (asyncHooks.AsyncResource) {
	    res = new asyncHooks.AsyncResource(fn.name || 'bound-anonymous-fn');
	  }

	  // incompatible node.js
	  if (!res || !res.runInAsyncScope) {
	    return fn
	  }

	  // return bound function
	  return res.runInAsyncScope.bind(res, fn, null)
	}
	return onFinished.exports;
}

/*!
 * range-parser
 * Copyright(c) 2012-2014 TJ Holowaychuk
 * Copyright(c) 2015-2016 Douglas Christopher Wilson
 * MIT Licensed
 */

var rangeParser_1;
var hasRequiredRangeParser;

function requireRangeParser () {
	if (hasRequiredRangeParser) return rangeParser_1;
	hasRequiredRangeParser = 1;

	/**
	 * Module exports.
	 * @public
	 */

	rangeParser_1 = rangeParser;

	/**
	 * Parse "Range" header `str` relative to the given file `size`.
	 *
	 * @param {Number} size
	 * @param {String} str
	 * @param {Object} [options]
	 * @return {Array}
	 * @public
	 */

	function rangeParser (size, str, options) {
	  if (typeof str !== 'string') {
	    throw new TypeError('argument str must be a string')
	  }

	  var index = str.indexOf('=');

	  if (index === -1) {
	    return -2
	  }

	  // split the range string
	  var arr = str.slice(index + 1).split(',');
	  var ranges = [];

	  // add ranges type
	  ranges.type = str.slice(0, index);

	  // parse all ranges
	  for (var i = 0; i < arr.length; i++) {
	    var range = arr[i].split('-');
	    var start = parseInt(range[0], 10);
	    var end = parseInt(range[1], 10);

	    // -nnn
	    if (isNaN(start)) {
	      start = size - end;
	      end = size - 1;
	    // nnn-
	    } else if (isNaN(end)) {
	      end = size - 1;
	    }

	    // limit last-byte-pos to current length
	    if (end > size - 1) {
	      end = size - 1;
	    }

	    // invalid or unsatisifiable
	    if (isNaN(start) || isNaN(end) || start > end || start < 0) {
	      continue
	    }

	    // add range
	    ranges.push({
	      start: start,
	      end: end
	    });
	  }

	  if (ranges.length < 1) {
	    // unsatisifiable
	    return -1
	  }

	  return options && options.combine
	    ? combineRanges(ranges)
	    : ranges
	}

	/**
	 * Combine overlapping & adjacent ranges.
	 * @private
	 */

	function combineRanges (ranges) {
	  var ordered = ranges.map(mapWithIndex).sort(sortByRangeStart);

	  for (var j = 0, i = 1; i < ordered.length; i++) {
	    var range = ordered[i];
	    var current = ordered[j];

	    if (range.start > current.end + 1) {
	      // next range
	      ordered[++j] = range;
	    } else if (range.end > current.end) {
	      // extend range
	      current.end = range.end;
	      current.index = Math.min(current.index, range.index);
	    }
	  }

	  // trim ordered array
	  ordered.length = j + 1;

	  // generate combined range
	  var combined = ordered.sort(sortByRangeIndex).map(mapWithoutIndex);

	  // copy ranges type
	  combined.type = ranges.type;

	  return combined
	}

	/**
	 * Map function to add index value to ranges.
	 * @private
	 */

	function mapWithIndex (range, index) {
	  return {
	    start: range.start,
	    end: range.end,
	    index: index
	  }
	}

	/**
	 * Map function to remove index value from ranges.
	 * @private
	 */

	function mapWithoutIndex (range) {
	  return {
	    start: range.start,
	    end: range.end
	  }
	}

	/**
	 * Sort function to sort ranges by index.
	 * @private
	 */

	function sortByRangeIndex (a, b) {
	  return a.index - b.index
	}

	/**
	 * Sort function to sort ranges by start position.
	 * @private
	 */

	function sortByRangeStart (a, b) {
	  return a.start - b.start
	}
	return rangeParser_1;
}

/*!
 * send
 * Copyright(c) 2012 TJ Holowaychuk
 * Copyright(c) 2014-2022 Douglas Christopher Wilson
 * MIT Licensed
 */

var send_1;
var hasRequiredSend;

function requireSend () {
	if (hasRequiredSend) return send_1;
	hasRequiredSend = 1;

	/**
	 * Module dependencies.
	 * @private
	 */

	var createError = requireHttpErrors();
	var debug = requireSrc()('send');
	var encodeUrl = requireEncodeurl();
	var escapeHtml = requireEscapeHtml();
	var etag = requireEtag();
	var fresh = requireFresh();
	var fs = require$$1$2;
	var mime = requireMimeTypes();
	var ms = requireMs();
	var onFinished = requireOnFinished();
	var parseRange = requireRangeParser();
	var path = require$$0$2;
	var statuses = requireStatuses();
	var Stream = require$$13;
	var util = require$$1$1;

	/**
	 * Path function references.
	 * @private
	 */

	var extname = path.extname;
	var join = path.join;
	var normalize = path.normalize;
	var resolve = path.resolve;
	var sep = path.sep;

	/**
	 * Regular expression for identifying a bytes Range header.
	 * @private
	 */

	var BYTES_RANGE_REGEXP = /^ *bytes=/;

	/**
	 * Maximum value allowed for the max age.
	 * @private
	 */

	var MAX_MAXAGE = 60 * 60 * 24 * 365 * 1000; // 1 year

	/**
	 * Regular expression to match a path with a directory up component.
	 * @private
	 */

	var UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;

	/**
	 * Module exports.
	 * @public
	 */

	send_1 = send;

	/**
	 * Return a `SendStream` for `req` and `path`.
	 *
	 * @param {object} req
	 * @param {string} path
	 * @param {object} [options]
	 * @return {SendStream}
	 * @public
	 */

	function send (req, path, options) {
	  return new SendStream(req, path, options)
	}

	/**
	 * Initialize a `SendStream` with the given `path`.
	 *
	 * @param {Request} req
	 * @param {String} path
	 * @param {object} [options]
	 * @private
	 */

	function SendStream (req, path, options) {
	  Stream.call(this);

	  var opts = options || {};

	  this.options = opts;
	  this.path = path;
	  this.req = req;

	  this._acceptRanges = opts.acceptRanges !== undefined
	    ? Boolean(opts.acceptRanges)
	    : true;

	  this._cacheControl = opts.cacheControl !== undefined
	    ? Boolean(opts.cacheControl)
	    : true;

	  this._etag = opts.etag !== undefined
	    ? Boolean(opts.etag)
	    : true;

	  this._dotfiles = opts.dotfiles !== undefined
	    ? opts.dotfiles
	    : 'ignore';

	  if (this._dotfiles !== 'ignore' && this._dotfiles !== 'allow' && this._dotfiles !== 'deny') {
	    throw new TypeError('dotfiles option must be "allow", "deny", or "ignore"')
	  }

	  this._extensions = opts.extensions !== undefined
	    ? normalizeList(opts.extensions, 'extensions option')
	    : [];

	  this._immutable = opts.immutable !== undefined
	    ? Boolean(opts.immutable)
	    : false;

	  this._index = opts.index !== undefined
	    ? normalizeList(opts.index, 'index option')
	    : ['index.html'];

	  this._lastModified = opts.lastModified !== undefined
	    ? Boolean(opts.lastModified)
	    : true;

	  this._maxage = opts.maxAge || opts.maxage;
	  this._maxage = typeof this._maxage === 'string'
	    ? ms(this._maxage)
	    : Number(this._maxage);
	  this._maxage = !isNaN(this._maxage)
	    ? Math.min(Math.max(0, this._maxage), MAX_MAXAGE)
	    : 0;

	  this._root = opts.root
	    ? resolve(opts.root)
	    : null;
	}

	/**
	 * Inherits from `Stream`.
	 */

	util.inherits(SendStream, Stream);

	/**
	 * Emit error with `status`.
	 *
	 * @param {number} status
	 * @param {Error} [err]
	 * @private
	 */

	SendStream.prototype.error = function error (status, err) {
	  // emit if listeners instead of responding
	  if (hasListeners(this, 'error')) {
	    return this.emit('error', createHttpError(status, err))
	  }

	  var res = this.res;
	  var msg = statuses.message[status] || String(status);
	  var doc = createHtmlDocument('Error', escapeHtml(msg));

	  // clear existing headers
	  clearHeaders(res);

	  // add error headers
	  if (err && err.headers) {
	    setHeaders(res, err.headers);
	  }

	  // send basic response
	  res.statusCode = status;
	  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
	  res.setHeader('Content-Length', Buffer.byteLength(doc));
	  res.setHeader('Content-Security-Policy', "default-src 'none'");
	  res.setHeader('X-Content-Type-Options', 'nosniff');
	  res.end(doc);
	};

	/**
	 * Check if the pathname ends with "/".
	 *
	 * @return {boolean}
	 * @private
	 */

	SendStream.prototype.hasTrailingSlash = function hasTrailingSlash () {
	  return this.path[this.path.length - 1] === '/'
	};

	/**
	 * Check if this is a conditional GET request.
	 *
	 * @return {Boolean}
	 * @api private
	 */

	SendStream.prototype.isConditionalGET = function isConditionalGET () {
	  return this.req.headers['if-match'] ||
	    this.req.headers['if-unmodified-since'] ||
	    this.req.headers['if-none-match'] ||
	    this.req.headers['if-modified-since']
	};

	/**
	 * Check if the request preconditions failed.
	 *
	 * @return {boolean}
	 * @private
	 */

	SendStream.prototype.isPreconditionFailure = function isPreconditionFailure () {
	  var req = this.req;
	  var res = this.res;

	  // if-match
	  var match = req.headers['if-match'];
	  if (match) {
	    var etag = res.getHeader('ETag');
	    return !etag || (match !== '*' && parseTokenList(match).every(function (match) {
	      return match !== etag && match !== 'W/' + etag && 'W/' + match !== etag
	    }))
	  }

	  // if-unmodified-since
	  var unmodifiedSince = parseHttpDate(req.headers['if-unmodified-since']);
	  if (!isNaN(unmodifiedSince)) {
	    var lastModified = parseHttpDate(res.getHeader('Last-Modified'));
	    return isNaN(lastModified) || lastModified > unmodifiedSince
	  }

	  return false
	};

	/**
	 * Strip various content header fields for a change in entity.
	 *
	 * @private
	 */

	SendStream.prototype.removeContentHeaderFields = function removeContentHeaderFields () {
	  var res = this.res;

	  res.removeHeader('Content-Encoding');
	  res.removeHeader('Content-Language');
	  res.removeHeader('Content-Length');
	  res.removeHeader('Content-Range');
	  res.removeHeader('Content-Type');
	};

	/**
	 * Respond with 304 not modified.
	 *
	 * @api private
	 */

	SendStream.prototype.notModified = function notModified () {
	  var res = this.res;
	  debug('not modified');
	  this.removeContentHeaderFields();
	  res.statusCode = 304;
	  res.end();
	};

	/**
	 * Raise error that headers already sent.
	 *
	 * @api private
	 */

	SendStream.prototype.headersAlreadySent = function headersAlreadySent () {
	  var err = new Error('Can\'t set headers after they are sent.');
	  debug('headers already sent');
	  this.error(500, err);
	};

	/**
	 * Check if the request is cacheable, aka
	 * responded with 2xx or 304 (see RFC 2616 section 14.2{5,6}).
	 *
	 * @return {Boolean}
	 * @api private
	 */

	SendStream.prototype.isCachable = function isCachable () {
	  var statusCode = this.res.statusCode;
	  return (statusCode >= 200 && statusCode < 300) ||
	    statusCode === 304
	};

	/**
	 * Handle stat() error.
	 *
	 * @param {Error} error
	 * @private
	 */

	SendStream.prototype.onStatError = function onStatError (error) {
	  switch (error.code) {
	    case 'ENAMETOOLONG':
	    case 'ENOENT':
	    case 'ENOTDIR':
	      this.error(404, error);
	      break
	    default:
	      this.error(500, error);
	      break
	  }
	};

	/**
	 * Check if the cache is fresh.
	 *
	 * @return {Boolean}
	 * @api private
	 */

	SendStream.prototype.isFresh = function isFresh () {
	  return fresh(this.req.headers, {
	    etag: this.res.getHeader('ETag'),
	    'last-modified': this.res.getHeader('Last-Modified')
	  })
	};

	/**
	 * Check if the range is fresh.
	 *
	 * @return {Boolean}
	 * @api private
	 */

	SendStream.prototype.isRangeFresh = function isRangeFresh () {
	  var ifRange = this.req.headers['if-range'];

	  if (!ifRange) {
	    return true
	  }

	  // if-range as etag
	  if (ifRange.indexOf('"') !== -1) {
	    var etag = this.res.getHeader('ETag');
	    return Boolean(etag && ifRange.indexOf(etag) !== -1)
	  }

	  // if-range as modified date
	  var lastModified = this.res.getHeader('Last-Modified');
	  return parseHttpDate(lastModified) <= parseHttpDate(ifRange)
	};

	/**
	 * Redirect to path.
	 *
	 * @param {string} path
	 * @private
	 */

	SendStream.prototype.redirect = function redirect (path) {
	  var res = this.res;

	  if (hasListeners(this, 'directory')) {
	    this.emit('directory', res, path);
	    return
	  }

	  if (this.hasTrailingSlash()) {
	    this.error(403);
	    return
	  }

	  var loc = encodeUrl(collapseLeadingSlashes(this.path + '/'));
	  var doc = createHtmlDocument('Redirecting', 'Redirecting to ' + escapeHtml(loc));

	  // redirect
	  res.statusCode = 301;
	  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
	  res.setHeader('Content-Length', Buffer.byteLength(doc));
	  res.setHeader('Content-Security-Policy', "default-src 'none'");
	  res.setHeader('X-Content-Type-Options', 'nosniff');
	  res.setHeader('Location', loc);
	  res.end(doc);
	};

	/**
	 * Pipe to `res.
	 *
	 * @param {Stream} res
	 * @return {Stream} res
	 * @api public
	 */

	SendStream.prototype.pipe = function pipe (res) {
	  // root path
	  var root = this._root;

	  // references
	  this.res = res;

	  // decode the path
	  var path = decode(this.path);
	  if (path === -1) {
	    this.error(400);
	    return res
	  }

	  // null byte(s)
	  if (~path.indexOf('\0')) {
	    this.error(400);
	    return res
	  }

	  var parts;
	  if (root !== null) {
	    // normalize
	    if (path) {
	      path = normalize('.' + sep + path);
	    }

	    // malicious path
	    if (UP_PATH_REGEXP.test(path)) {
	      debug('malicious path "%s"', path);
	      this.error(403);
	      return res
	    }

	    // explode path parts
	    parts = path.split(sep);

	    // join / normalize from optional root dir
	    path = normalize(join(root, path));
	  } else {
	    // ".." is malicious without "root"
	    if (UP_PATH_REGEXP.test(path)) {
	      debug('malicious path "%s"', path);
	      this.error(403);
	      return res
	    }

	    // explode path parts
	    parts = normalize(path).split(sep);

	    // resolve the path
	    path = resolve(path);
	  }

	  // dotfile handling
	  if (containsDotFile(parts)) {
	    debug('%s dotfile "%s"', this._dotfiles, path);
	    switch (this._dotfiles) {
	      case 'allow':
	        break
	      case 'deny':
	        this.error(403);
	        return res
	      case 'ignore':
	      default:
	        this.error(404);
	        return res
	    }
	  }

	  // index file support
	  if (this._index.length && this.hasTrailingSlash()) {
	    this.sendIndex(path);
	    return res
	  }

	  this.sendFile(path);
	  return res
	};

	/**
	 * Transfer `path`.
	 *
	 * @param {String} path
	 * @api public
	 */

	SendStream.prototype.send = function send (path, stat) {
	  var len = stat.size;
	  var options = this.options;
	  var opts = {};
	  var res = this.res;
	  var req = this.req;
	  var ranges = req.headers.range;
	  var offset = options.start || 0;

	  if (res.headersSent) {
	    // impossible to send now
	    this.headersAlreadySent();
	    return
	  }

	  debug('pipe "%s"', path);

	  // set header fields
	  this.setHeader(path, stat);

	  // set content-type
	  this.type(path);

	  // conditional GET support
	  if (this.isConditionalGET()) {
	    if (this.isPreconditionFailure()) {
	      this.error(412);
	      return
	    }

	    if (this.isCachable() && this.isFresh()) {
	      this.notModified();
	      return
	    }
	  }

	  // adjust len to start/end options
	  len = Math.max(0, len - offset);
	  if (options.end !== undefined) {
	    var bytes = options.end - offset + 1;
	    if (len > bytes) len = bytes;
	  }

	  // Range support
	  if (this._acceptRanges && BYTES_RANGE_REGEXP.test(ranges)) {
	    // parse
	    ranges = parseRange(len, ranges, {
	      combine: true
	    });

	    // If-Range support
	    if (!this.isRangeFresh()) {
	      debug('range stale');
	      ranges = -2;
	    }

	    // unsatisfiable
	    if (ranges === -1) {
	      debug('range unsatisfiable');

	      // Content-Range
	      res.setHeader('Content-Range', contentRange('bytes', len));

	      // 416 Requested Range Not Satisfiable
	      return this.error(416, {
	        headers: { 'Content-Range': res.getHeader('Content-Range') }
	      })
	    }

	    // valid (syntactically invalid/multiple ranges are treated as a regular response)
	    if (ranges !== -2 && ranges.length === 1) {
	      debug('range %j', ranges);

	      // Content-Range
	      res.statusCode = 206;
	      res.setHeader('Content-Range', contentRange('bytes', len, ranges[0]));

	      // adjust for requested range
	      offset += ranges[0].start;
	      len = ranges[0].end - ranges[0].start + 1;
	    }
	  }

	  // clone options
	  for (var prop in options) {
	    opts[prop] = options[prop];
	  }

	  // set read options
	  opts.start = offset;
	  opts.end = Math.max(offset, offset + len - 1);

	  // content-length
	  res.setHeader('Content-Length', len);

	  // HEAD support
	  if (req.method === 'HEAD') {
	    res.end();
	    return
	  }

	  this.stream(path, opts);
	};

	/**
	 * Transfer file for `path`.
	 *
	 * @param {String} path
	 * @api private
	 */
	SendStream.prototype.sendFile = function sendFile (path) {
	  var i = 0;
	  var self = this;

	  debug('stat "%s"', path);
	  fs.stat(path, function onstat (err, stat) {
	    var pathEndsWithSep = path[path.length - 1] === sep;
	    if (err && err.code === 'ENOENT' && !extname(path) && !pathEndsWithSep) {
	      // not found, check extensions
	      return next(err)
	    }
	    if (err) return self.onStatError(err)
	    if (stat.isDirectory()) return self.redirect(path)
	    if (pathEndsWithSep) return self.error(404)
	    self.emit('file', path, stat);
	    self.send(path, stat);
	  });

	  function next (err) {
	    if (self._extensions.length <= i) {
	      return err
	        ? self.onStatError(err)
	        : self.error(404)
	    }

	    var p = path + '.' + self._extensions[i++];

	    debug('stat "%s"', p);
	    fs.stat(p, function (err, stat) {
	      if (err) return next(err)
	      if (stat.isDirectory()) return next()
	      self.emit('file', p, stat);
	      self.send(p, stat);
	    });
	  }
	};

	/**
	 * Transfer index for `path`.
	 *
	 * @param {String} path
	 * @api private
	 */
	SendStream.prototype.sendIndex = function sendIndex (path) {
	  var i = -1;
	  var self = this;

	  function next (err) {
	    if (++i >= self._index.length) {
	      if (err) return self.onStatError(err)
	      return self.error(404)
	    }

	    var p = join(path, self._index[i]);

	    debug('stat "%s"', p);
	    fs.stat(p, function (err, stat) {
	      if (err) return next(err)
	      if (stat.isDirectory()) return next()
	      self.emit('file', p, stat);
	      self.send(p, stat);
	    });
	  }

	  next();
	};

	/**
	 * Stream `path` to the response.
	 *
	 * @param {String} path
	 * @param {Object} options
	 * @api private
	 */

	SendStream.prototype.stream = function stream (path, options) {
	  var self = this;
	  var res = this.res;

	  // pipe
	  var stream = fs.createReadStream(path, options);
	  this.emit('stream', stream);
	  stream.pipe(res);

	  // cleanup
	  function cleanup () {
	    stream.destroy();
	  }

	  // response finished, cleanup
	  onFinished(res, cleanup);

	  // error handling
	  stream.on('error', function onerror (err) {
	    // clean up stream early
	    cleanup();

	    // error
	    self.onStatError(err);
	  });

	  // end
	  stream.on('end', function onend () {
	    self.emit('end');
	  });
	};

	/**
	 * Set content-type based on `path`
	 * if it hasn't been explicitly set.
	 *
	 * @param {String} path
	 * @api private
	 */

	SendStream.prototype.type = function type (path) {
	  var res = this.res;

	  if (res.getHeader('Content-Type')) return

	  var ext = extname(path);
	  var type = mime.contentType(ext) || 'application/octet-stream';

	  debug('content-type %s', type);
	  res.setHeader('Content-Type', type);
	};

	/**
	 * Set response header fields, most
	 * fields may be pre-defined.
	 *
	 * @param {String} path
	 * @param {Object} stat
	 * @api private
	 */

	SendStream.prototype.setHeader = function setHeader (path, stat) {
	  var res = this.res;

	  this.emit('headers', res, path, stat);

	  if (this._acceptRanges && !res.getHeader('Accept-Ranges')) {
	    debug('accept ranges');
	    res.setHeader('Accept-Ranges', 'bytes');
	  }

	  if (this._cacheControl && !res.getHeader('Cache-Control')) {
	    var cacheControl = 'public, max-age=' + Math.floor(this._maxage / 1000);

	    if (this._immutable) {
	      cacheControl += ', immutable';
	    }

	    debug('cache-control %s', cacheControl);
	    res.setHeader('Cache-Control', cacheControl);
	  }

	  if (this._lastModified && !res.getHeader('Last-Modified')) {
	    var modified = stat.mtime.toUTCString();
	    debug('modified %s', modified);
	    res.setHeader('Last-Modified', modified);
	  }

	  if (this._etag && !res.getHeader('ETag')) {
	    var val = etag(stat);
	    debug('etag %s', val);
	    res.setHeader('ETag', val);
	  }
	};

	/**
	 * Clear all headers from a response.
	 *
	 * @param {object} res
	 * @private
	 */

	function clearHeaders (res) {
	  for (const header of res.getHeaderNames()) {
	    res.removeHeader(header);
	  }
	}

	/**
	 * Collapse all leading slashes into a single slash
	 *
	 * @param {string} str
	 * @private
	 */
	function collapseLeadingSlashes (str) {
	  for (var i = 0; i < str.length; i++) {
	    if (str[i] !== '/') {
	      break
	    }
	  }

	  return i > 1
	    ? '/' + str.substr(i)
	    : str
	}

	/**
	 * Determine if path parts contain a dotfile.
	 *
	 * @api private
	 */

	function containsDotFile (parts) {
	  for (var i = 0; i < parts.length; i++) {
	    var part = parts[i];
	    if (part.length > 1 && part[0] === '.') {
	      return true
	    }
	  }

	  return false
	}

	/**
	 * Create a Content-Range header.
	 *
	 * @param {string} type
	 * @param {number} size
	 * @param {array} [range]
	 */

	function contentRange (type, size, range) {
	  return type + ' ' + (range ? range.start + '-' + range.end : '*') + '/' + size
	}

	/**
	 * Create a minimal HTML document.
	 *
	 * @param {string} title
	 * @param {string} body
	 * @private
	 */

	function createHtmlDocument (title, body) {
	  return '<!DOCTYPE html>\n' +
	    '<html lang="en">\n' +
	    '<head>\n' +
	    '<meta charset="utf-8">\n' +
	    '<title>' + title + '</title>\n' +
	    '</head>\n' +
	    '<body>\n' +
	    '<pre>' + body + '</pre>\n' +
	    '</body>\n' +
	    '</html>\n'
	}

	/**
	 * Create a HttpError object from simple arguments.
	 *
	 * @param {number} status
	 * @param {Error|object} err
	 * @private
	 */

	function createHttpError (status, err) {
	  if (!err) {
	    return createError(status)
	  }

	  return err instanceof Error
	    ? createError(status, err, { expose: false })
	    : createError(status, err)
	}

	/**
	 * decodeURIComponent.
	 *
	 * Allows V8 to only deoptimize this fn instead of all
	 * of send().
	 *
	 * @param {String} path
	 * @api private
	 */

	function decode (path) {
	  try {
	    return decodeURIComponent(path)
	  } catch (err) {
	    return -1
	  }
	}

	/**
	 * Determine if emitter has listeners of a given type.
	 *
	 * The way to do this check is done three different ways in Node.js >= 0.10
	 * so this consolidates them into a minimal set using instance methods.
	 *
	 * @param {EventEmitter} emitter
	 * @param {string} type
	 * @returns {boolean}
	 * @private
	 */

	function hasListeners (emitter, type) {
	  var count = typeof emitter.listenerCount !== 'function'
	    ? emitter.listeners(type).length
	    : emitter.listenerCount(type);

	  return count > 0
	}

	/**
	 * Normalize the index option into an array.
	 *
	 * @param {boolean|string|array} val
	 * @param {string} name
	 * @private
	 */

	function normalizeList (val, name) {
	  var list = [].concat(val || []);

	  for (var i = 0; i < list.length; i++) {
	    if (typeof list[i] !== 'string') {
	      throw new TypeError(name + ' must be array of strings or false')
	    }
	  }

	  return list
	}

	/**
	 * Parse an HTTP Date into a number.
	 *
	 * @param {string} date
	 * @private
	 */

	function parseHttpDate (date) {
	  var timestamp = date && Date.parse(date);

	  return typeof timestamp === 'number'
	    ? timestamp
	    : NaN
	}

	/**
	 * Parse a HTTP token list.
	 *
	 * @param {string} str
	 * @private
	 */

	function parseTokenList (str) {
	  var end = 0;
	  var list = [];
	  var start = 0;

	  // gather tokens
	  for (var i = 0, len = str.length; i < len; i++) {
	    switch (str.charCodeAt(i)) {
	      case 0x20: /*   */
	        if (start === end) {
	          start = end = i + 1;
	        }
	        break
	      case 0x2c: /* , */
	        if (start !== end) {
	          list.push(str.substring(start, end));
	        }
	        start = end = i + 1;
	        break
	      default:
	        end = i + 1;
	        break
	    }
	  }

	  // final token
	  if (start !== end) {
	    list.push(str.substring(start, end));
	  }

	  return list
	}

	/**
	 * Set an object of headers on a response.
	 *
	 * @param {object} res
	 * @param {object} headers
	 * @private
	 */

	function setHeaders (res, headers) {
	  var keys = Object.keys(headers);

	  for (var i = 0; i < keys.length; i++) {
	    var key = keys[i];
	    res.setHeader(key, headers[key]);
	  }
	}
	return send_1;
}

var sendExports = requireSend();
const send = /*@__PURE__*/getDefaultExportFromCjs(sendExports);

function resolveStaticPath(client, urlPath) {
  const filePath = path.join(client, urlPath);
  const resolved = path.resolve(filePath);
  const resolvedClient = path.resolve(client);
  if (resolved !== resolvedClient && !resolved.startsWith(resolvedClient + path.sep)) {
    return { filePath: resolved, isDirectory: false };
  }
  let isDirectory = false;
  try {
    isDirectory = fs.lstatSync(filePath).isDirectory();
  } catch {
  }
  return { filePath: resolved, isDirectory };
}
function createStaticHandler(app, options, headersMap) {
  const client = resolveClientDir(options);
  return (req, res, ssr) => {
    if (req.url) {
      let fullUrl = req.url;
      if (req.url.includes("#")) {
        fullUrl = fullUrl.slice(0, req.url.indexOf("#"));
      }
      const [urlPath, urlQuery] = fullUrl.split("?");
      const { isDirectory } = resolveStaticPath(client, app.removeBase(urlPath));
      const hasSlash = urlPath.endsWith("/");
      let pathname = urlPath;
      switch (app.manifest.trailingSlash) {
        case "never": {
          if (isDirectory && urlPath !== "/" && hasSlash) {
            pathname = urlPath.slice(0, -1) + (urlQuery ? "?" + urlQuery : "");
            res.statusCode = 301;
            res.setHeader("Location", pathname);
            return res.end();
          }
          if (isDirectory && !hasSlash) {
            pathname = `${urlPath}/index.html`;
          }
          break;
        }
        case "ignore": {
          if (isDirectory && !hasSlash) {
            pathname = `${urlPath}/index.html`;
          }
          break;
        }
        case "always": {
          if (!hasSlash && !hasFileExtension(urlPath) && !isInternalPath(urlPath)) {
            pathname = urlPath + "/" + (urlQuery ? "?" + urlQuery : "");
            res.statusCode = 301;
            res.setHeader("Location", pathname);
            return res.end();
          }
          break;
        }
      }
      pathname = prependForwardSlash(app.removeBase(pathname));
      const normalizedPathname = path.posix.normalize(pathname);
      const stream = send(req, normalizedPathname, {
        root: client,
        dotfiles: normalizedPathname.startsWith("/.well-known/") ? "allow" : "deny"
      });
      let forwardError = false;
      stream.on("error", (err) => {
        if (forwardError) {
          console.error(err.toString());
          res.writeHead(500);
          res.end("Internal server error");
          return;
        }
        ssr();
      });
      stream.on("headers", (_res) => {
        if (normalizedPathname.startsWith(`/${app.manifest.assetsDir}/`)) {
          _res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      });
      stream.on("file", () => {
        forwardError = true;
      });
      stream.pipe(res);
    } else {
      ssr();
    }
  };
}
function prependForwardSlash(pth) {
  return pth.startsWith("/") ? pth : "/" + pth;
}

const hostOptions = (host) => {
  if (typeof host === "boolean") {
    return host ? "0.0.0.0" : "localhost";
  }
  return host;
};
function standalone(app, options, headersMap) {
  const port = process.env.PORT ? Number(process.env.PORT) : options.port ?? 8080;
  const host = process.env.HOST ?? hostOptions(options.host);
  const resolvedOptions = { ...options, port };
  const handler = createStandaloneHandler(app, resolvedOptions);
  const server = createServer(handler, host, port);
  server.server.listen(port, host);
  if (process.env.ASTRO_NODE_LOGGING !== "disabled") {
    logListeningOn(app.getAdapterLogger(), server.server, host);
  }
  return {
    server,
    done: server.closed()
  };
}
function createStandaloneHandler(app, options, headersMap) {
  const appHandler = createAppHandler(app, options);
  const staticHandler = createStaticHandler(app, options);
  return (req, res) => {
    try {
      decodeURI(req.url);
    } catch {
      res.writeHead(400);
      res.end("Bad request.");
      return;
    }
    staticHandler(req, res, () => appHandler(req, res));
  };
}
function createServer(listener, host, port) {
  let httpServer;
  if (process.env.SERVER_CERT_PATH && process.env.SERVER_KEY_PATH) {
    httpServer = https.createServer(
      {
        key: fs.readFileSync(process.env.SERVER_KEY_PATH),
        cert: fs.readFileSync(process.env.SERVER_CERT_PATH)
      },
      listener
    );
  } else {
    httpServer = http.createServer(listener);
  }
  enableDestroy(httpServer);
  const closed = new Promise((resolve, reject) => {
    httpServer.addListener("close", resolve);
    httpServer.addListener("error", reject);
  });
  const previewable = {
    host,
    port,
    closed() {
      return closed;
    },
    async stop() {
      await new Promise((resolve, reject) => {
        httpServer.destroy((err) => err ? reject(err) : resolve(void 0));
      });
    }
  };
  return {
    server: httpServer,
    ...previewable
  };
}

const app = createApp({ streaming: true });
const handler = createStandaloneHandler(app, options);
const startServer = () => standalone(app, options);
if (process.env.ASTRO_NODE_AUTOSTART !== "disabled") {
  startServer();
}

export { handler, options, startServer };
