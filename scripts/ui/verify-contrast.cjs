const fs = require('fs'),
  assert = require('node:assert/strict');
const src = fs.readFileSync('mobile/src/appearance.tsx', 'utf8');
const result = [];
const L = (h) => {
  const n = parseInt(h.slice(1), 16),
    c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
for (const theme of ['light', 'dark']) {
  const block = src.match(
    new RegExp('const ' + theme + '(?:\\s*:\\s*ThemeColors)? = \\{([\\s\\S]*?)\\n\\};'),
  )?.[1];
  assert(block);
  const p = Object.fromEntries(
    [...block.matchAll(/(\w+): '(#[a-f0-9]{6})'/g)].map((m) => [m[1], m[2]]),
  );
  for (const [fg, bg, min] of [
    ['ink', 'cream', 4.5],
    ['ink', 'paper', 4.5],
    ['muted', 'cream', 4.5],
    ['muted', 'paper', 4.5],
    ['green', 'cream', 4.5],
    ['onAction', 'green', 4.5],
    ['error', 'paper', 4.5],
    ['control', 'paper', 3],
    ['focus', 'cream', 3],
  ]) {
    const a = L(p[fg]),
      b = L(p[bg]),
      ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    result.push({
      theme,
      foreground: fg,
      background: bg,
      ratio: Number(ratio.toFixed(2)),
      minimum: min,
      status: ratio >= min ? 'PASS' : 'FAIL',
    });
    assert(ratio >= min, theme + ' ' + fg + '/' + bg + ' ' + ratio);
  }
}
fs.writeFileSync(
  'docs/ui-upgrade/results/native-token-contrast.json',
  JSON.stringify(result, null, 2),
);
console.log('PASS ' + result.length + ' native semantic foreground/background contrast pairs');
