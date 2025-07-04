function styleToString(style: Record<string, string>) {
  return Object.entries(style)
    .map(([key, val]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${val}`)
    .join(';')
}

export function renderSVGNode([tag, attrs, children]: [string, Record<string, any>, any[]]): string {
  let attrString = ''
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'style') {
      attrString += ` style="${styleToString(v)}"`
    } else {
      attrString += ` ${k}="${v}"`
    }
  }

  if (children && children.length > 0) {
    return `<${tag}${attrString}>${children.map(renderSVGNode).join('')}</${tag}>`
  } else {
    return `<${tag}${attrString} />`
  }
}
