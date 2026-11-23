/* Real Chromium UI acceptance. PLAYWRIGHT_MODULE can point to an existing test installation. */
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:14274';
if (!/^http:\/\/(127\.0\.0\.1|localhost):14274$/.test(base))
  throw Error('Use the isolated UI test server on 14274');
const dir = 'docs/ui-upgrade/after',
  out = 'tmp/ui-run';
fs.mkdirSync(dir, { recursive: true });
fs.mkdirSync(out, { recursive: true });
const results = [];
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  async function context(theme = 'light', width = 390) {
    const c = await browser.newContext({
      viewport: { width, height: width < 800 ? 844 : 1000 },
      hasTouch: width < 800,
      colorScheme: 'light',
    });
    await c.addInitScript((t) => {
      if (!localStorage.getItem('dukkan-appearance')) localStorage.setItem('dukkan-appearance', t);
    }, theme);
    return c;
  }
  async function check(name, fn) {
    if (process.env.UI_FILTER && !new RegExp(process.env.UI_FILTER).test(name)) return;
    try {
      const detail = await fn();
      results.push({ name, status: 'PASS', detail });
      console.log('PASS ' + name);
    } catch (e) {
      results.push({ name, status: 'FAIL', error: e.stack });
      console.log('FAIL ' + name + ': ' + e.message.split('\n')[0]);
    }
  }
  try {
    for (const width of [1440, 390, 320])
      for (const locale of ['en', 'ar'])
        for (const theme of ['light', 'dark'])
          for (const route of ['', 'login', 'register'])
            await check(`layout ${route || 'home'} ${locale} ${theme} ${width}`, async () => {
              const c = await context(theme, width),
                p = await c.newPage();
              try {
                const r = await p.goto(`${base}/${locale}${route ? '/' + route : ''}`, {
                  waitUntil: 'networkidle',
                });
                assert.equal(r.status(), 200);
                assert.equal(
                  await p.locator('html').getAttribute('dir'),
                  locale === 'ar' ? 'rtl' : 'ltr',
                );
                assert.equal(await p.locator('html').getAttribute('data-theme'), theme);
                assert(
                  await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
                  'horizontal overflow',
                );
                await p.screenshot({
                  path: `${dir}/${route || 'home'}-${locale}-${width}-${theme}.png`,
                  fullPage: true,
                });
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
                return { axeViolations: 0 };
              } finally {
                await c.close();
              }
            });
    for (const locale of ['en', 'ar'])
      await check(`journeys keyboard/touch/reduced-motion ${locale}`, async () => {
        const c = await context('dark'),
          p = await c.newPage();
        try {
          await p.emulateMedia({ reducedMotion: 'reduce' });
          await p.goto(`${base}/${locale}`, { waitUntil: 'networkidle' });
          const tabs = p.getByRole('tab');
          await tabs.nth(0).focus();
          await p.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
          assert.equal(await tabs.nth(1).getAttribute('aria-selected'), 'true');
          assert.equal(await tabs.nth(1).evaluate((e) => e === document.activeElement), true);
          await p.keyboard.press('End');
          assert.equal(await tabs.nth(2).getAttribute('aria-selected'), 'true');
          await tabs.nth(0).tap();
          await p.locator('.journey-steps button').nth(2).tap();
          assert.equal(
            await p.locator('.journey-steps button').nth(2).getAttribute('aria-pressed'),
            'true',
          );
          assert.equal(
            await p.locator('.journey-preview').evaluate((e) => getComputedStyle(e).animationName),
            'none',
          );
          assert(
            (await p.locator('.journey-preview .button').getAttribute('href')).endsWith(
              '/home-store',
            ),
          );
        } finally {
          await c.close();
        }
      });
    await check('appearance persistence, OS changes and pre-hydration render', async () => {
      const c = await context('system'),
        p = await c.newPage();
      try {
        await p.goto(base + '/en', { waitUntil: 'networkidle' });
        const picker = p.getByRole('combobox', { name: 'Appearance', exact: true });
        await picker.selectOption('dark');
        await p.reload({ waitUntil: 'networkidle' });
        assert.equal(await picker.inputValue(), 'dark');
        assert.equal(
          await p.locator('html').evaluate((e) => getComputedStyle(e).colorScheme),
          'dark',
        );
        await picker.selectOption('system');
        await p.emulateMedia({ colorScheme: 'dark' });
        await p.waitForTimeout(100);
        assert.equal(
          await p
            .locator('html')
            .evaluate((e) => getComputedStyle(e).getPropertyValue('--paper').trim()),
          '#101d19',
        );
        await p.emulateMedia({ colorScheme: 'light' });
        await p.waitForTimeout(100);
        assert.equal(
          await p
            .locator('html')
            .evaluate((e) => getComputedStyle(e).getPropertyValue('--paper').trim()),
          '#f7f3e9',
        );
      } finally {
        await c.close();
      }
      const cold = await browser.newContext();
      await cold.route('**/_next/static/**/*.js', (r) => r.abort());
      const q = await cold.newPage();
      try {
        await q.goto(base + '/en');
        await q.evaluate(() => localStorage.setItem('dukkan-appearance', 'dark'));
        await q.reload();
        assert.equal(
          await q.locator('html').getAttribute('data-theme'),
          'dark',
          'pre-body script should apply stored theme',
        );
      } finally {
        await cold.close();
      }
    });
    for (const locale of ['en', 'ar'])
      for (const theme of ['light', 'dark'])
        await check(`login validation/failure/persistence/success ${locale} ${theme}`, async () => {
          const c = await context(theme),
            p = await c.newPage();
          try {
            await p.goto(`${base}/${locale}/login?next=/${locale}/wallet`, {
              waitUntil: 'networkidle',
            });
            const submit = p.locator('.auth-form button[type=submit],.auth-form .auth-submit');
            await submit.click();
            assert.equal(await p.locator('[name=email]').getAttribute('aria-invalid'), 'true');
            await p.locator('[name=email]').fill('customer@demo.marketplace.test');
            await p.locator('[name=password]').fill('IncorrectPassword123!');
            await submit.click();
            await p.locator('.auth-form [role=alert]').waitFor();
            assert.equal(
              await p.locator('[name=email]').inputValue(),
              'customer@demo.marketplace.test',
            );
            assert.equal(await p.locator('[name=password]').inputValue(), 'IncorrectPassword123!');
            await p.locator('.password-input button').click();
            assert.equal(await p.locator('[name=password]').getAttribute('type'), 'text');
            await p.locator('.password-input button').click();
            await p.locator('[name=password]').fill('Marketplace123!');
            await submit.click();
            await p.waitForURL(new RegExp('/' + locale + '/wallet(?:\\?|$)'), { timeout: 15000 });
            await p
              .getByRole('heading', { name: locale === 'ar' ? 'المحفظة' : 'Wallet', exact: true })
              .waitFor();
            for (
              let i = 0;
              i < 30 && !(await c.cookies()).some((x) => x.name === '__Host-market-access');
              i++
            )
              await p.waitForTimeout(100);
            assert(
              (await c.cookies()).some(
                (x) => x.name === '__Host-market-access' && x.httpOnly && x.secure,
              ),
              'Authenticated response must store Secure HttpOnly session cookies',
            );
            assert.equal(await p.locator('html').getAttribute('data-theme'), theme);
            await p.screenshot({ path: `${dir}/wallet-${locale}-${theme}.png`, fullPage: true });
          } finally {
            await c.close();
          }
        });
    for (const locale of ['en', 'ar'])
      for (const theme of ['light', 'dark'])
        await check(`registration success/duplicate preservation ${locale} ${theme}`, async () => {
          const c = await context(theme),
            p = await c.newPage();
          const email = 'ui-' + locale + '-' + Date.now() + '@demo.marketplace.test';
          try {
            await p.goto(`${base}/${locale}/register`);
            await p.locator('.auth-submit').click();
            assert.equal(
              await p.locator('[name=displayName]').getAttribute('aria-invalid'),
              'true',
            );
            async function fill() {
              await p.locator('[name=displayName]').fill('Fictional UI review');
              await p.locator('[name=email]').fill(email);
              await p.locator('[name=password]').fill('Marketplace123!');
              if (locale === 'ar')
                await p.locator('[name=businessRole]').selectOption('PROFESSIONAL');
            }
            await fill();
            await p.locator('.auth-submit').click();
            await p.locator('.registration-success').waitFor({ timeout: 15000 });
            await p.screenshot({
              path: `${dir}/registration-success-${locale}-${theme}.png`,
              fullPage: true,
            });
            await p.reload();
            await fill();
            await p.locator('.auth-submit').click();
            await p.locator('.auth-form [role=alert]').waitFor();
            assert.equal(await p.locator('[name=email]').inputValue(), email);
            assert.equal(await p.locator('[name=displayName]').inputValue(), 'Fictional UI review');
          } finally {
            await c.close();
          }
        });
    await check('admin dark surface and preserved target redirect', async () => {
      const c = await context('dark', 1440),
        p = await c.newPage();
      try {
        await p.goto(base + '/en/login?next=/en/admin');
        await p.locator('[name=email]').fill('admin@demo.marketplace.test');
        await p.locator('[name=password]').fill('Marketplace123!');
        await p.locator('.auth-submit').click();
        await p.waitForURL('**/en/admin', { timeout: 15000 });
        await p.getByRole('heading', { name: 'Administration', exact: true }).waitFor();
        await p.getByRole('navigation', { name: 'Admin sections', exact: true }).waitFor();
        assert.equal(await p.locator('html').getAttribute('data-theme'), 'dark');
        assert(!p.url().includes('/login'));
        await p.screenshot({ path: dir + '/admin-en-dark.png', fullPage: true });
      } finally {
        await c.close();
      }
    });
    await check('video deferred loading, actual playback and captions', async () => {
      const c = await context(),
        p = await c.newPage(),
        media = [];
      p.on('request', (r) => {
        if (r.url().includes('.webm')) media.push(r.url());
      });
      try {
        await p.goto(base + '/en', { waitUntil: 'networkidle' });
        assert.equal(media.length, 0);
        assert.equal(await p.locator('.marketplace-film .watch-button').count(), 0);
        await p.locator('.walkthrough-card .watch-button').click();
        await p.locator('video').waitFor();
        await p.waitForFunction(
          () => {
            const v = document.querySelector('video');
            return v && v.readyState >= 2 && v.currentTime > 0;
          },
          { timeout: 15000 },
        );
        const info = await p.locator('video').evaluate((v) => ({
          duration: v.duration,
          cues: v.textTracks[0]?.cues?.length,
          controls: v.controls,
        }));
        assert(info.duration > 5 && info.controls);
        await p.waitForFunction(
          () => document.querySelector('video').textTracks[0]?.cues?.length > 0,
        );
        assert(media.length > 0);
        return info;
      } finally {
        await c.close();
      }
    });
    await check('video network failure keeps a usable poster and browse action', async () => {
      const c = await context(),
        p = await c.newPage();
      try {
        await p.route('**/media/product-tour.webm', (r) => r.abort());
        await p.goto(base + '/en');
        await p.locator('.walkthrough-card .watch-button').click();
        await p.getByRole('status').filter({ hasText: 'could not play' }).waitFor();
        assert.equal(await p.locator('.walkthrough-card video').count(), 0);
        assert(
          (await p.locator('.walkthrough-card .text-link').getAttribute('href')).endsWith(
            '/home-store',
          ),
        );
      } finally {
        await c.close();
      }
    });
  } finally {
    await browser.close();
    fs.writeFileSync(
      out + '/web-results.json',
      JSON.stringify(
        { date: '2026-11-24', browser: 'Chromium (installed Chrome)', results },
        null,
        2,
      ),
    );
    const fail = results.filter((x) => x.status === 'FAIL');
    console.log(JSON.stringify({ pass: results.length - fail.length, fail: fail.length }));
    if (fail.length) process.exitCode = 1;
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
