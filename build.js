'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { checkLinks, buildJson } = require('./lib');

function build({ linksPath, outDir, baseUrl, imgDir }) {
  const doc = yaml.load(fs.readFileSync(linksPath, 'utf8'));
  const errors = checkLinks(doc);
  if (errors.length) throw new Error('links.yaml invalid:\n - ' + errors.join('\n - '));
  const base = baseUrl || process.env.BASE_URL || doc.site.base_url;
  if (!/^https:\/\//.test(base)) throw new Error('BASE_URL must start with https:// (got ' + base + ')');
  const out = buildJson(doc, base);
  const dir = path.join(outDir, 'msx');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'start.json'), JSON.stringify(out.start));
  fs.writeFileSync(path.join(dir, 'menu.json'), JSON.stringify(out.menu));
  if (imgDir && fs.existsSync(imgDir)) {
    const dst = path.join(dir, 'img');
    fs.mkdirSync(dst, { recursive: true });
    fs.readdirSync(imgDir).filter((f) => /\.(webp|png)$/i.test(f)).forEach((f) => fs.copyFileSync(path.join(imgDir, f), path.join(dst, f)));
  }
  return { base, startUrl: base.replace(/\/+$/, '') + '/msx/start.json' };
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const r = build({ linksPath: path.join(root, 'links.yaml'), outDir: path.join(root, 'dist'), imgDir: path.join(root, 'img') });
  console.log('built. start.json URL: ' + r.startUrl);
}
module.exports = { build };
