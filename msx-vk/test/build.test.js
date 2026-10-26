'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { build } = require('../src/build');
const { validateDist } = require('../src/validate');
const { toAction, checkLinks } = require('../src/lib');

const root = path.resolve(__dirname, '..');
const BASE = 'https://example.github.io/msx-vk';
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'msxvk-'));

test('build + validate default links.yaml', () => {
  const out = tmp();
  const r = build({ linksPath: path.join(root, 'links.yaml'), outDir: out, baseUrl: BASE });
  assert.strictEqual(r.startUrl, BASE + '/msx/start.json');
  const v = validateDist(out);
  assert.deepStrictEqual(v.errors, []);
  const menuSize = fs.statSync(path.join(out, 'msx/menu.json')).size;
  assert.ok(menuSize < 50 * 1024, 'menu.json < 50 KB');
});

test('start.json has mandatory fields and absolute menu URL', () => {
  const out = tmp();
  build({ linksPath: path.join(root, 'links.yaml'), outDir: out, baseUrl: BASE });
  const s = JSON.parse(fs.readFileSync(path.join(out, 'msx/start.json'), 'utf8'));
  assert.strictEqual(s.parameter, 'menu:' + BASE + '/msx/menu.json');
  assert.ok(s.name && s.version);
});

test('VK pages are never mapped to video: (no legal direct stream)', () => {
  assert.strictEqual(toAction({ type: 'video', url: 'https://vkvideo.ru/video-1_2.mp4' }), 'link:https://vkvideo.ru/video-1_2.mp4');
  assert.strictEqual(toAction({ type: 'video', url: 'https://vk.com/video-1_2' }), 'link:https://vk.com/video-1_2');
});

test('direct media and window mode', () => {
  assert.strictEqual(toAction({ type: 'video', url: 'https://x.org/a.m3u8' }), 'video:https://x.org/a.m3u8');
  assert.strictEqual(toAction({ type: 'web', url: 'https://x.org/', open: 'window' }), 'link:window:https://x.org/');
});

test('invalid links.yaml rejected', () => {
  assert.ok(checkLinks({ site: { name: 'a', version: '1' }, items: [{ title: 't', type: 'audio', url: 'nope' }] }).length >= 2);
  assert.ok(checkLinks({}).length > 0);
});

test('http base URL rejected', () => {
  assert.throws(() => build({ linksPath: path.join(root, 'links.yaml'), outDir: tmp(), baseUrl: 'http://x.io' }), /https/);
});

test('validator catches broken menu', () => {
  const out = tmp();
  build({ linksPath: path.join(root, 'links.yaml'), outDir: out, baseUrl: BASE });
  const f = path.join(out, 'msx/menu.json');
  const m = JSON.parse(fs.readFileSync(f, 'utf8'));
  m.menu[0].data.items[0].action = 'javascript:alert(1)';
  m.menu[0].data.items[1].id = m.menu[0].data.items[0].id;
  fs.writeFileSync(f, JSON.stringify(m));
  const v = validateDist(out);
  assert.ok(v.errors.some((e) => /bad action/.test(e)));
  assert.ok(v.errors.some((e) => /duplicate id/.test(e)));
});

test('oversized image rejected', () => {
  const out = tmp();
  const img = tmp();
  fs.writeFileSync(path.join(img, 'big.png'), Buffer.alloc(31 * 1024));
  build({ linksPath: path.join(root, 'links.yaml'), outDir: out, baseUrl: BASE, imgDir: img });
  assert.ok(validateDist(out).errors.some((e) => /big\.png/.test(e)));
});
