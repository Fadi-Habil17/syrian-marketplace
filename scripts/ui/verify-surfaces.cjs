/* Additional real UI checks for shared tokens, keyboard use and larger text. */
const fs = require('node:fs'),
  assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
fs.mkdirSync('tmp/ui-run', { recursive: true });
fs.mkdirSync('docs/ui-upgrade/after', { recursive: true });
const base = 'http://127.0.0.1:14274',
  results = [];
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  async function check(name, fn) {
    if (process.env.UI_FILTER && !new RegExp(process.env.UI_FILTER).test(name)) return;
    try {
      await fn();
      results.push({ name, status: 'PASS' });
      console.log('PASS ' + name);
    } catch (e) {
      results.push({ name, status: 'FAIL', error: e.stack });
      console.log('FAIL ' + name + ': ' + e.message.split('\n')[0]);
    }
  }
  try {
    for (const locale of ['ar', 'en'])
      for (const theme of ['light', 'dark'])
        await check(
          'Keyboard and 200% desktop zoom equivalent ' + locale + ' ' + theme,
          async () => {
            const c = await b.newContext({
                viewport: { width: 720, height: 500 },
                deviceScaleFactor: 2,
              }),
              p = await c.newPage();
            try {
              await c.addInitScript((t) => localStorage.setItem('dukkan-appearance', t), theme);
              await p.goto(base + '/' + locale + '/login', { waitUntil: 'networkidle' });
              await p.locator('[name=email]').focus();
              await p.keyboard.press('Tab');
              assert.equal(
                await p.locator('[name=password]').evaluate((e) => e === document.activeElement),
                true,
              );
              await p.keyboard.press('Tab');
              assert.equal(
                await p
                  .locator('.password-input button')
                  .evaluate((e) => e === document.activeElement),
                true,
              );
              await p.keyboard.press('Enter');
              assert.equal(await p.locator('[name=password]').getAttribute('type'), 'text');
              assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
              await p.screenshot({
                path: `docs/ui-upgrade/after/login-${locale}-${theme}-200-zoom.png`,
                fullPage: true,
              });
            } finally {
              await c.close();
            }
          },
        );
    for (const [role, route] of [
      ['FREELANCER', 'workspace'],
      ['PROFESSIONAL', 'workspace'],
      ['STORE_OWNER', 'workspace'],
      ['DELIVERY_DRIVER', 'driver'],
      ['ADMIN', 'admin'],
    ])
      for (const theme of ['light', 'dark'])
        await check('Signed surface ' + role + ' ' + theme, async () => {
          const c = await b.newContext({ viewport: { width: 390, height: 844 } }),
            p = await c.newPage();
          try {
            await c.addInitScript((t) => localStorage.setItem('dukkan-appearance', t), theme);
            await p.goto(base + '/en/login?next=/en/' + route);
            await p.locator('[name=email]').fill(role.toLowerCase() + '@demo.marketplace.test');
            await p.locator('[name=password]').fill('Marketplace123!');
            await p.locator('.auth-submit').click();
            await p.waitForURL('**/en/' + route);
            await p.waitForLoadState('networkidle');
            assert.equal(await p.locator('html').getAttribute('data-theme'), theme);
            assert((await c.cookies()).some((x) => x.name === '__Host-market-access'));
            assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            await p.addScriptTag({
              path: process.env.AXE_SCRIPT || 'tmp/ui-run/package/axe.min.js',
            });
            const scan = await p.evaluate(() =>
              axe.run(document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
              }),
            );
            assert.deepEqual(
              scan.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
              [],
            );
            await p.screenshot({
              path: `docs/ui-upgrade/after/${role.toLowerCase()}-${theme}.png`,
              fullPage: true,
            });
          } finally {
            await c.close();
          }
        });
  } finally {
    await b.close();
    fs.writeFileSync(
      'tmp/ui-run/surface-results.json',
      JSON.stringify({ date: '2026-11-24', results }, null, 2),
    );
    console.log(
      JSON.stringify({
        pass: results.filter((x) => x.status === 'PASS').length,
        fail: results.filter((x) => x.status === 'FAIL').length,
      }),
    );
    if (results.some((x) => x.status === 'FAIL')) process.exitCode = 1;
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
