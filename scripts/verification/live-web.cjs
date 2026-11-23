const { spawn } = require('node:child_process'),
  { resolve } = require('node:path'),
  assert = require('node:assert/strict');
require('node:process').loadEnvFile(
  process.argv[2] ||
    (() => {
      throw Error('Explicit isolated env file required');
    })(),
);
if (!new URL(process.env.DATABASE_TEST_URL).pathname.includes('test'))
  throw Error('Isolated DB required');
const children = [],
  logs = {};
const base = 'http://127.0.0.1:14274';
function start(name, args, cwd, env) {
  logs[name] = '';
  const p = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  children.push(p);
  for (const s of [p.stdout, p.stderr])
    s.on('data', (b) => (logs[name] = (logs[name] + b).slice(-100000)));
}
async function ready(url) {
  for (let n = 0; n < 150; n++) {
    try {
      const r = await fetch(url, { redirect: 'manual' });
      if (r.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw Error('Process not ready');
}
const jar = new Map();
function cookies(r) {
  for (const s of r.headers.getSetCookie()) {
    const [kv] = s.split(';'),
      i = kv.indexOf('=');
    if (/max-age=0|expires=Thu, 01 Jan 1970/i.test(s)) jar.delete(kv.slice(0, i));
    else jar.set(kv.slice(0, i), kv.slice(i + 1));
  }
}
const get = (path, extra = {}) =>
  fetch(base + path, {
    ...extra,
    headers: { cookie: [...jar].map(([k, v]) => k + '=' + v).join('; '), ...extra.headers },
    redirect: 'manual',
  });
const decode = (s) =>
  s
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
function form(html, predicate) {
  const markup = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)]
    .map((m) => m[0])
    .find(predicate);
  assert(markup, 'Expected web form');
  const data = new FormData();
  for (const [tag] of markup.matchAll(/<input\b[^>]*>/g)) {
    const attrs = Object.fromEntries(
      [...tag.matchAll(/([^\s=]+)="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]),
    );
    if (attrs.name && (attrs.type === 'hidden' || attrs.name.startsWith('$ACTION')))
      data.append(attrs.name, attrs.value ?? '');
  }
  return data;
}
(async () => {
  try {
    start('api', ['dist/main.js'], 'backend', {
      DATABASE_URL: process.env.DATABASE_TEST_URL,
      PORT: '14273',
      WEB_ORIGINS: base,
    });
    await ready('http://127.0.0.1:14273/api/v1/health');
    start(
      'web',
      [
        resolve('node_modules/next/dist/bin/next'),
        'start',
        '--port',
        '14274',
        '--hostname',
        '127.0.0.1',
      ],
      'frontend',
      {
        NEST_API_URL: 'http://127.0.0.1:14273/api/v1',
        NEXT_PUBLIC_WS_URL: 'http://127.0.0.1:14273/orders',
        NEXT_TELEMETRY_DISABLED: '1',
      },
    );
    await ready(base + '/en');
    for (const locale of ['ar', 'en']) {
      const r = await get('/' + locale);
      assert.equal(r.status, 200);
      const html = await r.text();
      assert(html.includes(`lang="${locale}"`));
      assert(html.includes(`dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`));
    }
    console.log('LIVE_WEB_LOCALE_PAGES passed');
    const anonymous = await get('/en/wallet');
    const anonymousHtml = await anonymous.text();
    assert(
      ([303, 307].includes(anonymous.status) &&
        (anonymous.headers.get('location') ?? '').includes('/en/login')) ||
        (anonymous.status === 200 &&
          anonymousHtml.includes('NEXT_REDIRECT') &&
          anonymousHtml.includes('/en/login')),
      'Anonymous page must redirect before rendering private data',
    );
    assert(!anonymousHtml.includes('customer@demo.marketplace.test'));
    console.log('LIVE_WEB_ANONYMOUS_GUARD passed');
    let html = await (await get('/en/login')).text();
    const login = form(html, (s) => s.includes('name="password"'));
    login.set('email', 'customer@demo.marketplace.test');
    login.set('password', 'Marketplace123!');
    const signed = await get('/en/login', {
      method: 'POST',
      headers: { Origin: base },
      body: login,
    });
    assert([303, 307].includes(signed.status), 'Sign-in redirect ' + signed.status);
    const set = signed.headers.getSetCookie();
    assert(
      set.some((x) => x.includes('HttpOnly') && x.includes('Secure') && x.includes('SameSite=lax')),
    );
    cookies(signed);
    assert(jar.has('__Host-market-access'));
    assert(jar.has('__Host-market-refresh'));
    for (const path of [
      '/en/account',
      '/en/wallet',
      '/en/orders',
      '/en/workspace',
      '/en/notifications',
    ]) {
      const r = await get(path);
      assert.equal(r.status, 200, path);
      html = await r.text();
      for (const token of jar.values())
        assert(!html.includes(token), 'Bearer credential leaked into HTML');
      assert(!html.includes('Internal Server Error'));
    }
    console.log('LIVE_WEB_SIGNIN_HTTPONLY_AND_AUTHENTICATED_PAGES passed');
    const denied = await (await get('/en/admin')).text();
    assert(denied.includes('Administrator access required'));
    console.log('LIVE_WEB_CUSTOMER_ADMIN_GUARD passed');
    jar.delete('__Host-market-access');
    const gate = await (await get('/en/wallet')).text();
    const resume = form(gate, (s) => s.includes('Continue session'));
    const resumed = await get('/en/wallet', {
      method: 'POST',
      headers: { Origin: base },
      body: resume,
    });
    assert([303, 307].includes(resumed.status));
    cookies(resumed);
    assert(jar.has('__Host-market-access'));
    assert.equal((await get('/en/wallet')).status, 200);
    console.log('LIVE_WEB_REFRESH_ACTION passed');
    html = await (await get('/en/account')).text();
    const logout = form(html, (s) => s.includes('Sign out'));
    const out = await get('/en/account', {
      method: 'POST',
      headers: { Origin: base },
      body: logout,
    });
    assert([303, 307].includes(out.status));
    cookies(out);
    assert.equal(jar.size, 0);
    console.log('LIVE_WEB_SIGNOUT passed');
    for (const [role, paths] of [
      ['freelancer', ['/en/workspace']],
      ['professional', ['/en/workspace']],
      ['store_owner', ['/en/workspace']],
      ['delivery_driver', ['/en/driver', '/en/driver?tab=assignments']],
      [
        'admin',
        [
          '/en/admin',
          '/en/admin?tab=cases',
          '/en/admin?tab=rates',
          '/en/admin?tab=accounts',
          '/en/admin?tab=audit',
        ],
      ],
    ]) {
      const entry = form(await (await get('/en/login')).text(), (s) =>
        s.includes('name="password"'),
      );
      entry.set('email', role + '@demo.marketplace.test');
      entry.set('password', 'Marketplace123!');
      const signedRole = await get('/en/login', {
        method: 'POST',
        headers: { Origin: base },
        body: entry,
      });
      assert([303, 307].includes(signedRole.status), role + ' sign-in');
      cookies(signedRole);
      for (const path of paths) {
        const page = await get(path);
        assert.equal(page.status, 200, role + ' ' + path);
        const body = await page.text();
        assert(!body.includes('Administrator access required'));
        assert(!body.includes('Check the required fields.'));
        for (const token of jar.values()) assert(!body.includes(token));
      }
      const leave = form(await (await get('/en/account')).text(), (s) => s.includes('Sign out'));
      cookies(await get('/en/account', { method: 'POST', headers: { Origin: base }, body: leave }));
      assert.equal(jar.size, 0);
    }
    assert(!/Error:|⨯/.test(logs.web), 'Server rendering must not log errors');
    console.log('LIVE_WEB_BUSINESS_DRIVER_ADMIN_PAGES passed');
  } catch (e) {
    console.error('Web live review failed:', e.message);
    for (const [name, text] of Object.entries(logs))
      console.error(
        name,
        text
          .split('\n')
          .filter((l) => /Error|failed|Exception/.test(l))
          .slice(-3)
          .join('\n'),
      );
    process.exitCode = 1;
  } finally {
    for (const p of children) p.kill();
  }
})();
