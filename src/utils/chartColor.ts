export function reduceSaturation(hex: string, satFactor: number): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  }
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6
    : max === g ? ((b - r) / d + 2) / 6
    : ((r - g) / d + 4) / 6
  const ns = s * satFactor
  const q = l < 0.5 ? l * (1 + ns) : l + ns - l * ns
  const p = 2 * l - q
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
  return `#${toHex(hue2rgb(p, q, h + 1/3))}${toHex(hue2rgb(p, q, h))}${toHex(hue2rgb(p, q, h - 1/3))}`
}

export function getChartColorByMode(
  mode: string,
  ratio: number,
  originalColor: string,
): string {
  if (mode === 'lowSaturation') return reduceSaturation(originalColor, 0.3)
  if (mode === 'blue') return `hsl(${210 + ratio * 40}, 70%, ${40 + ratio * 20}%)`
  if (mode === 'pastel') return reduceSaturation(originalColor, 0.6)
  if (mode === 'mono') return `hsl(0, 0%, ${30 + ratio * 40}%)`
  return originalColor
}
