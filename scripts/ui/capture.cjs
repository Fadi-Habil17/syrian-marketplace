const fs = require('node:fs'),
  path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw Error('Use before or after');
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:14274';
const dir = path.resolve('docs/ui-upgrade', phase);
fs.mkdirSync(dir, { recursive: true });
(async () => {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(base + '/en');
      if (response.ok) break;
    } catch {}
    if (attempt === 30) throw Error('Isolated web server did not become ready');
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const evidence = { phase, browser: browser.version(), screens: [], performance: [] };
  try {
    for (const width of [1440, 390])
      for (const locale of ['en', 'ar'])
        for (const route of ['', 'login', 'register']) {
          const page = await browser.newPage({
            viewport: { width, height: width === 390 ? 844 : 1000 },
            colorScheme: 'light',
          });
          const url = base + '/' + locale + (route ? '/' + route : '');
          const response = await page.goto(url, { waitUntil: 'networkidle' });
          if (response.status() !== 200) throw Error('Route ' + url + ' ' + response.status());
          await page.evaluate(() => document.fonts.ready);
          const name = (route || 'home') + '-' + locale + '-' + width + '.png';
          await page.screenshot({ path: path.join(dir, name), fullPage: true });
          const data = await page.evaluate(() => ({
            width: innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            dir: document.documentElement.dir,
            background: getComputedStyle(document.body).backgroundColor,
          }));
          evidence.screens.push({ name, ...data });
          await page.close();
        }
    for (let run = 0; run < 5; run++) {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        colorScheme: 'light',
      });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 100,
        downloadThroughput: 200000,
        uploadThroughput: 100000,
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.addInitScript(() => {
        window.__lcp = 0;
        window.__cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) window.__lcp = e.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(base + '/en', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      evidence.performance.push(
        await page.evaluate(() => ({
          lcp: window.__lcp,
          cls: window.__cls,
          ttfb: performance.getEntriesByType('navigation')[0].responseStart,
          transferBytes: performance
            .getEntriesByType('resource')
            .reduce((s, e) => s + e.transferSize, 0),
          requests: performance.getEntriesByType('resource').length,
        })),
      );
      await page.close();
    }
    fs.writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(evidence, null, 2));
    console.log(
      JSON.stringify({
        phase,
        screens: evidence.screens.length,
        performance: evidence.performance,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
