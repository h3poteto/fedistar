const HIGHLIGHT_COLOR_STYLE_ID = 'fedistar-highlight-color'

const HIGHLIGHT_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const clamp = (value: number) => Math.min(255, Math.max(0, Math.round(value)))

const mix = (base: number, target: number, ratio: number) => clamp(base + (target - base) * ratio)

const hexToRgb = (color: string) => {
  const normalized = normalizeHexColor(color)
  if (!normalized) {
    return null
  }

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16)
  }
}

const focusRing = (color: string) => {
  const rgb = hexToRgb(color)
  if (!rgb) {
    return 'rgba(52, 152, 255, 0.25)'
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`
}

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[clamp(r), clamp(g), clamp(b)]
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`

const tint = (color: string, ratio: number) => {
  const rgb = hexToRgb(color)
  if (!rgb) {
    return color
  }

  return rgbToHex(mix(rgb.r, 255, ratio), mix(rgb.g, 255, ratio), mix(rgb.b, 255, ratio))
}

export const normalizeHexColor = (value: string | null | undefined) => {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }

  const prefixed = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  if (!HIGHLIGHT_COLOR_PATTERN.test(prefixed)) {
    return null
  }

  if (prefixed.length === 4) {
    return `#${prefixed
      .slice(1)
      .split('')
      .map(char => `${char}${char}`)
      .join('')
      .toUpperCase()}`
  }

  return prefixed.toUpperCase()
}

export const applyHighlightColor = (value: string | null | undefined) => {
  if (typeof document === 'undefined') {
    return
  }

  const existing = document.getElementById(HIGHLIGHT_COLOR_STYLE_ID)
  const color = normalizeHexColor(value)

  if (!color) {
    existing?.remove()
    return
  }

  const style = existing instanceof HTMLStyleElement ? existing : document.createElement('style')
  style.id = HIGHLIGHT_COLOR_STYLE_ID
  style.textContent = `
:root,
.rs-theme-light,
.rs-theme-dark,
.rs-theme-high-contrast {
  --rs-color-primary: ${color};
  --rs-primary-100: ${tint(color, 0.42)};
  --rs-primary-200: ${tint(color, 0.3)};
  --rs-primary-300: ${tint(color, 0.18)};
  --rs-primary-400: ${tint(color, 0.08)};
  --rs-primary-500: ${color};
  --rs-primary-600: ${color};
  --rs-primary-700: ${color};
  --rs-primary-800: ${color};
  --rs-primary-900: ${color};
  --rs-color-focus-ring: ${focusRing(color)};
}
`.trim()

  if (!existing) {
    document.head.appendChild(style)
  }
}
