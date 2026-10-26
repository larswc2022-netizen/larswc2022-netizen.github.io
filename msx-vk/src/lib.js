'use strict';
// Shared helpers: link classification, action mapping, JSON generation.
// JSON structures follow https://msx.benzac.de/wiki/ (Start Object, Menu Root/Item Object, Content Root/Item Object, Actions).
const VK_HOSTS = ['vk.com', 'vk.ru', 'vkvideo.ru'];
const DIRECT_MEDIA = /\.(mp4|m3u8|mpd|webm|mkv|mov)(\?.*)?$/i;
const ID_RE = /^[A-Za-z0-9_.-]+$/;
const ICONS = { video: 'movie', web: 'pages' }; // icons seen in official benzac-de/msx example menu

function hostOf(u) { return new URL(u).hostname.toLowerCase(); }
function isVk(u) { const h = hostOf(u); return VK_HOSTS.some((v) => h === v || h.endsWith('.' + v)); }
function isDirectMedia(u) { return DIRECT_MEDIA.test(u) && !isVk(u); }

// Map a links.yaml item to an MSX action string. VK pages are never played inline: no legal direct stream exists.
function toAction(item) {
  if (item.type === 'video' && isDirectMedia(item.url)) return 'video:' + item.url;
  return (item.open === 'window' ? 'link:window:' : 'link:') + item.url;
}

function checkLinks(doc) {
  const errors = [];
  if (!doc || typeof doc !== 'object') return ['links.yaml: empty or not an object'];
  const site = doc.site || {};
  if (!site.name) errors.push('site.name is required');
  if (!site.version) errors.push('site.version is required');
  if (!Array.isArray(doc.items) || doc.items.length === 0) errors.push('items must be a non-empty list');
  (doc.items || []).forEach((it, i) => {
    const p = 'items[' + i + ']';
    if (!it.title) errors.push(p + '.title is required');
    if (!['video', 'web'].includes(it.type)) errors.push(p + '.type must be video|web');
    try { const u = new URL(it.url); if (!/^https?:$/.test(u.protocol)) throw new Error(); } catch (e) { errors.push(p + '.url must be a valid http(s) URL'); }
    if (it.open && !['inline', 'window'].includes(it.open)) errors.push(p + '.open must be inline|window');
  });
  return errors;
}

function buildJson(doc, baseUrl) {
  const base = String(baseUrl).replace(/\/+$/, '');
  const groups = [['video', 'Видео', 'v'], ['web', 'Сайты', 'w']];
  const menu = [];
  groups.forEach(([type, label, prefix]) => {
    const items = doc.items.filter((i) => i.type === type).map((it, n) => {
      const o = { id: prefix + (n + 1), label: it.title, extensionLabel: hostOf(it.url), action: toAction(it) };
      if (o.action.indexOf('video:') === 0) o.playerLabel = it.title;
      if (it.icon) o.icon = it.icon;
      return o;
    });
    if (!items.length) return;
    menu.push({
      id: 'g_' + type, icon: ICONS[type], label,
      // Inline content root object: avoids one extra request per menu entry.
      data: { type: 'list', template: { type: 'control', layout: '0,0,12,1', icon: ICONS[type] }, items }
    });
  });
  const start = {
    name: doc.site.name, version: String(doc.site.version),
    parameter: 'menu:' + base + '/msx/menu.json', launcher: { icon: 'pages' }
  };
  const menuRoot = { name: doc.site.name, version: String(doc.site.version), headline: doc.site.name, menu };
  return { start, menu: menuRoot };
}

module.exports = { VK_HOSTS, ID_RE, hostOf, isVk, isDirectMedia, toAction, checkLinks, buildJson };
