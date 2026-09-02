// Generate sitemap.xml from categories data
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'categories.json'), 'utf8'));
const BASE = 'https://linkshub.pages.dev';

const urls = [
  { loc: `${BASE}/`, priority: 1.0, changefreq: 'daily' },
  { loc: `${BASE}/categories`, priority: 0.9, changefreq: 'daily' },
  { loc: `${BASE}/about`, priority: 0.5, changefreq: 'monthly' },
];
for (const c of DATA) {
  urls.push({ loc: `${BASE}/category/${c.slug}`, priority: 0.8, changefreq: 'weekly' });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${urls.length} URLs`);
