// Runs only against a locally bound API using the explicit test database.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawn } = require('node:child_process');
const { resolve } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
process.loadEnvFile(process.argv[2] || 'backend/.env');
const database = new URL(process.env.DATABASE_TEST_URL);
assert(
  ['localhost', '127.0.0.1'].includes(database.hostname) &&
    /(?:^\/|_)(?:test|ci)$/i.test(database.pathname),
);
const web = 'http://127.0.0.1:14384',
  api = 'http://127.0.0.1:14383/api/v1';
const children = [];
function start(cwd, args, env) {
  children.push(
    spawn(process.execPath, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'ignore',
      windowsHide: true,
    }),
  );
}
async function ready(url) {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw Error('Review server did not start');
}
async function json(path, options) {
  const response = await fetch(api + path, options);
  assert(response.ok, path + ' ' + response.status);
  return response.json();
}
(async () => {
  let browser;
  try {
    start('backend', ['dist/main.js'], {
      PORT: '14383',
      DATABASE_URL: database.href,
      WEB_ORIGINS: web,
    });
    await ready(api + '/health');
    start(
      'frontend',
      [
        resolve('node_modules/next/dist/bin/next'),
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        '14384',
      ],
      { NEST_API_URL: api, NEXT_TELEMETRY_DISABLED: '1' },
    );
    await ready(web + '/en');
    const email = 'map-' + randomUUID() + '@demo.test',
      password = randomUUID();
    const post = (body) => ({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    await json(
      '/auth/register',
      post({ email, password, displayName: 'Map review', locale: 'en' }),
    );
    const token = (await json('/auth/login', post({ email, password, client: 'WEB' }))).accessToken;
    const saved = async () =>
      (await json('/me/addresses', { headers: { Authorization: 'Bearer ' + token } })).items[0];
    const gov = (await json('/geography/governorates')).items.find((g) => g.nameEn === 'Hama');
    const city = (await json('/geography/cities?governorateId=' + gov.id)).items.find(
      (c) => c.nameEn === 'Salamiyah',
    );
    const area = (await json('/geography/areas?cityId=' + city.id)).items[0];
    const query = '?governorateId=' + gov.id + '&cityId=' + city.id;
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
      args: ['--enable-unsafe-swiftshader'],
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    let permissionReads = 0,
      styleReads = 0,
      offline = false;
    await context.exposeFunction('locationRead', () => permissionReads++);
    await context.addInitScript(() =>
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition(_success, fail) {
            void window.locationRead();
            fail({ code: 1 });
          },
        },
      }),
    );
    await context.route('https://tiles.openfreemap.org/**', async (route) => {
      styleReads++;
      const headers = route.request().headers();
      assert(!headers.authorization && !headers.cookie && !headers.referer);
      assert.equal(route.request().url(), 'https://tiles.openfreemap.org/styles/liberty');
      if (offline) return route.abort();
      return route.fulfill({
        json: {
          version: 8,
          sources: {},
          layers: [
            { id: 'background', type: 'background', paint: { 'background-color': '#ecefe7' } },
          ],
        },
      });
    });
    await page.goto(web + '/en/login');
    await page.locator('[name=email]').fill(email);
    await page.locator('[name=password]').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL((url) => !url.pathname.includes('login'));
    await page.goto(web + '/en/account' + query);
    const add = page
      .locator('details.command')
      .filter({ has: page.locator('summary', { hasText: 'Add an address' }) });
    await add.locator('summary').click();
    assert.equal(permissionReads, 0);
    await add.getByRole('button', { name: 'Use my location' }).click();
    await add.getByText('Location unavailable. Choose the point manually.').waitFor();
    assert.equal(permissionReads, 1);
    await add.locator('[name=label]').fill('Map test');
    await add.locator('[name=cityId]').selectOption(city.id);
    await add.locator('[name=details]').fill('Fictional entrance');
    await add.locator('[name=contactName]').fill('Demo buyer');
    await add.locator('[name=contactPhone]').fill('000000');
    if (process.env.TEST_MAP_STYLE === '1') {
      const canvas = add.locator('canvas.maplibregl-canvas');
      await canvas.scrollIntoViewIfNeeded();
      await canvas.click({ position: { x: 90, y: 90 } });
      assert.notEqual(await add.getByLabel('Latitude', { exact: true }).inputValue(), '');
      assert(styleReads > 0);
    }
    await add.getByLabel('Latitude', { exact: true }).fill('35.01');
    await add.getByLabel('Longitude', { exact: true }).fill('37.05');
    await add.getByRole('button', { name: 'Add an address', exact: true }).click();
    await add.getByText('Saved.', { exact: true }).waitFor();
    assert.deepEqual((await saved()).pin, { latitude: 35.01, longitude: 37.05 });
    offline = true;
    await page.goto(web + '/en/account' + query);
    const edit = page
      .locator('details.command')
      .filter({ has: page.locator('summary', { hasText: 'Edit address' }) })
      .first();
    await edit.locator('summary').click();
    await edit.locator('[name=details]').fill('Revised text');
    await edit.getByRole('button', { name: 'Edit address', exact: true }).click();
    await edit.getByText('Saved.', { exact: true }).waitFor();
    assert.deepEqual((await saved()).pin, { latitude: 35.01, longitude: 37.05 });
    await edit.getByRole('button', { name: 'Remove pin' }).click();
    await edit.getByRole('button', { name: 'Edit address', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('form fieldset:disabled'));
    for (let i = 0; i < 20 && (await saved()).pin; i++) await page.waitForTimeout(100);
    assert.equal((await saved()).pin, null);
    console.log('PASS web pin placement, permission denial, preserve and remove during map outage');
    for (const locale of ['ar', 'en']) {
      await page.goto(web + '/' + locale + '/discover' + query);
      const areaPicker = page.getByRole('combobox', {
        name: locale === 'ar' ? 'المنطقة' : 'Area',
        exact: true,
      });
      try {
        await areaPicker.selectOption(area.id);
      } catch (error) {
        console.error(
          'Discovery screen:',
          await page.locator('h1').allTextContents(),
          'selects:',
          await page.getByRole('combobox').count(),
        );
        throw error;
      }
      await page.getByRole('button', { name: locale === 'ar' ? 'بالقرب مني' : 'Near me' }).click();
      const result = page.locator('section li a').first();
      await result.waitFor();
      await result.focus();
      await result.press('Enter');
      await page.waitForURL((url) => /\/(stores|professionals)\//.test(url.pathname));
    }
    console.log('PASS keyboard discovery results in Arabic and English during provider outage');
    if (process.env.TEST_MAP_STYLE === '1') {
      offline = false;
      const expected = await json(
        '/discovery/local/search',
        post({ cityId: city.id, areaId: area.id }),
      );
      const mapped = expected.items.filter((item) => item.point);
      assert(mapped.length > 0, 'seeded area should have mapped businesses');
      await page.goto(web + '/en/discover' + query);
      await page.getByRole('combobox', { name: 'Area', exact: true }).selectOption(area.id);
      await page.locator('section div[aria-label="Map"]').scrollIntoViewIfNeeded();
      await page.waitForFunction(
        (count) =>
          [...document.querySelectorAll('section .map-marker')].reduce(
            (sum, el) => sum + (Number(el.textContent) || 1),
            0,
          ) === count,
        mapped.length,
      );
      assert.deepEqual(
        await page.locator('section li a').allTextContents(),
        expected.items.map((item) => item.nameEn),
      );
      if (new Set(mapped.map((item) => JSON.stringify(item.point))).size < mapped.length) {
        assert(
          (await page.locator('section .map-marker').count()) < mapped.length,
          'overlapping points should share a marker',
        );
      }
      console.log('PASS discovery map markers and accessible list match the same API page');
      offline = true;
    }
    const professional = {
      email: 'professional@demo.marketplace.test',
      password: 'Marketplace123!',
      client: 'WEB',
    };
    const session = await json('/auth/login', post(professional));
    const profileId = session.user.activeBusinessProfile.id;
    const venuePath = '/business-profiles/' + profileId + '/public-venue';
    const auth = { Authorization: 'Bearer ' + session.accessToken };
    const original = (await json(venuePath, { headers: auth })).point;
    const ownerContext = await browser.newContext();
    try {
      const owner = await ownerContext.newPage();
      await ownerContext.route('https://tiles.openfreemap.org/**', (route) => route.abort());
      await owner.goto(web + '/en/login');
      await owner.locator('[name=email]').fill(professional.email);
      await owner.locator('[name=password]').fill(professional.password);
      await owner.getByRole('button', { name: 'Sign in', exact: true }).click();
      await owner.waitForURL((url) => !url.pathname.includes('login'));
      await owner.goto(web + '/en/workspace');
      const publish = owner.getByRole('button', { name: 'Publish venue', exact: true });
      const field = owner.locator('fieldset').filter({ has: publish });
      await field.getByLabel('Latitude', { exact: true }).fill('35.03');
      await field.getByLabel('Longitude', { exact: true }).fill('37.04');
      assert(await publish.isDisabled());
      await field.getByRole('checkbox').check();
      await publish.click();
      await field.getByText('Saved', { exact: true }).waitFor();
      assert.deepEqual((await json(venuePath, { headers: auth })).point, {
        latitude: 35.03,
        longitude: 37.04,
      });
      await field.getByRole('button', { name: 'Withdraw public location' }).click();
      await field
        .getByRole('button', { name: 'Withdraw public location' })
        .waitFor({ state: 'hidden' });
      assert.equal((await json(venuePath, { headers: auth })).point, null);
      console.log('PASS web professional publication consent and withdrawal');
    } finally {
      await json(venuePath, {
        method: 'PATCH',
        headers: { ...auth, 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() },
        body: JSON.stringify({ point: original, confirmedPublic: Boolean(original) }),
      });
      await ownerContext.close();
    }
  } finally {
    await browser?.close();
    for (const child of children.reverse()) child.kill();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
