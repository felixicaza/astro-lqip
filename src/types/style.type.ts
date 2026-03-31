type StylePrimitive = string | number | undefined
export type StyleMap<TExtra = never> = Record<string, StylePrimitive | TExtra>
export type StyleInput<TExtra = never> = StyleMap<TExtra> | string
