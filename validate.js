'use strict';
// Validates dist/msx/*.json against the MSX wiki schema (required fields), sizes, and (with --online) URL availability.
const fs = require('fs');
const path = require('path');
const { ID_RE, isVk } = require('./lib');

const MENU_MAX = 50 * 1024, START_MAX = 4 * 1024, IMG_MAX = 30 * 1024;
const ACTION_RE = /^(video:|link:window:|link:)https?:\/\/\S+$/;

function validateDist(distDir) {
  const errors = [], warnings = [], urls = new Set();
  const dir = path.join(distDir, 'msx');
  const load = (name, max) => {
    const f = path.join(dir, name);
    if (!fs.existsSync(f)) { errors.push(name + ' missing'); return null; }
    const raw = fs.readFileSync(f, 'utf8');
    if (Buffer.byteLength(raw) > max) errors.push(name + ' exceeds ' + max + ' bytes');
    if (/\n\s{2,}/.test(raw)) errors.push(name + ' is not minified');
    try { return JSON.parse(raw); } catch (e) { errors.push(name + ' invalid JSON: ' + e.message); return null; }
  };
  const start = load('start.json', START_MAX), menu = load('menu.json', MENU_MAX);
  if (start) {
    ['name', 'version', 'parameter'].forEach((k) => { if (typeof start[k] !== 'string' || !start[k]) errors.push('start.' + k + ' is mandatory string'); });
    if (typeof start.parameter === 'string') {
      if (!/^(menu|content):https:\/\/\S+\/msx\/menu\.json$/.test(start.parameter)) errors.push('start.parameter must be menu:https://.../msx/menu.json');
      else urls.add(start.parameter.replace(/^menu:/, ''));
    }
  }
  if (menu) {
    if (!Array.isArray(menu.menu) || !menu.menu.length) errors.push('menu.menu must be a non-empty array (mandatory)');
    const ids = new Set();
    const uniq = (id, where) => {
      if (id === undefined) return;
      if (!ID_RE.test(id)) errors.push(where + ' id "' + id + '" has illegal chars');
      if (ids.has(id)) errors.push(where + ' duplicate id "' + id + '"');
      ids.add(id);
    };
    (menu.menu || []).forEach((m, i) => {
      if (m.type !== 'separator' && !m.label) errors.push('menu[' + i + '] has no label');
      uniq(m.id, 'menu[' + i + ']');
      const d = m.data;
      if (d && typeof d === 'object') {
        if (!d.template || !Array.isArray(d.items)) errors.push('menu[' + i + '].data needs template + items (templated content)');
        (d.items || []).forEach((it, j) => {
          uniq(it.id, 'menu[' + i + '].items[' + j + ']');
          if (!ACTION_RE.test(it.action || '')) errors.push('menu[' + i + '].items[' + j + '] bad action: ' + it.action);
          else urls.add(it.action.replace(/^(video:|link:window:|link:)/, ''));
        });
      } else if (typeof d === 'string') urls.add(d);
    });
  }
  const imgDir = path.join(dir, 'img');
  if (fs.existsSync(imgDir)) fs.readdirSync(imgDir).forEach((f) => {
    if (fs.statSync(path.join(imgDir, f)).size > IMG_MAX) errors.push('image ' + f + ' exceeds ' + IMG_MAX + ' bytes');
  });
  return { errors, warnings, urls: [...urls] };
}

async function checkOnline(urls, errors, warnings) {
  for (const u of urls) {
    let ok = false, note = '';
    try {
      let r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) });
      if (r.status >= 400) r = await fetch(u, { method: 'GET', redirect: 'follow', headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(10000) });
      ok = r.status < 400; note = 'HTTP ' + r.status;
    } catch (e) { note = e.message; }
    if (!ok) (isVk(u) ? warnings : errors).push('URL unreachable: ' + u + ' (' + note + ')' + (isVk(u) ? ' [VK: warn-only, platform may block bots]' : ''));
  }
}

if (require.main === module) {
  const dist = path.resolve(__dirname, '..', 'dist');
  const r = validateDist(dist);
  (async () => {
    if (process.argv.includes('--online')) await checkOnline(r.urls, r.errors, r.warnings);
    r.warnings.forEach((w) => console.warn('WARN  ' + w));
    r.errors.forEach((e) => console.error('ERROR ' + e));
    console.log(r.errors.length ? 'validation FAILED' : 'validation OK (' + r.urls.length + ' URLs referenced)');
    process.exit(r.errors.length ? 1 : 0);
  })();
}
module.exports = { validateDist, checkOnline };
