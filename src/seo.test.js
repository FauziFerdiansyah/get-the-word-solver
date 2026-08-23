import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

// One test per Lighthouse SEO audit that a static build can control. The audits
// left out are server-side (HTTP status code) or manual (structured data review).
const html = readFileSync('index.html', 'utf8');
const built = existsSync('dist/index.html') ? readFileSync('dist/index.html', 'utf8') : '';
const env = readFileSync('.env', 'utf8');
const siteUrl = env.match(/VITE_SITE_URL\s*=\s*(.+)/)[1].trim();

const meta = (name, source = html) => {
  const match = source.match(
    new RegExp(`<meta\\s+(?:name|property)="${name}"[^>]*content="([^"]*)"`, 's')
  ) || source.match(
    new RegExp(`<meta[^>]*content="([^"]*)"[^>]*(?:name|property)="${name}"`, 's')
  );
  return match ? match[1] : null;
};

describe('crawlability', () => {
  it('is not blocked from indexing', () => {
    expect(meta('robots')).toMatch(/index/);
    expect(meta('robots')).not.toMatch(/noindex/);
    expect(meta('googlebot')).toMatch(/index/);
  });

  it('declares a canonical URL that matches the configured site', () => {
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)[1];
    expect(canonical).toBe('%VITE_SITE_URL%');
    if (built) {
      expect(built.match(/<link rel="canonical" href="([^"]*)"/)[1]).toBe(siteUrl);
    }
  });

  it('ships a robots.txt pointing at the sitemap', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    expect(robots).toMatch(/^User-agent: \*/m);
    expect(robots).toMatch(/^Allow: \//m);
    expect(robots).toContain(`Sitemap: ${siteUrl}sitemap.xml`);
    expect(robots).not.toMatch(/^Disallow: \/$/m);
  });

  it('ships a sitemap with the right namespace and URL', () => {
    const sitemap = readFileSync('public/sitemap.xml', 'utf8');
    expect(sitemap).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
    expect(sitemap).toContain(`<loc>${siteUrl}</loc>`);
    expect(sitemap).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });
});

describe('title and description', () => {
  it('has a title that fits a search result and names the game', () => {
    const title = html.match(/<title>(.*?)<\/title>/s)[1];
    expect(title).toMatch(/Get The Word/);
    expect(title.length).toBeGreaterThan(20);
    expect(title.length).toBeLessThanOrEqual(70);
  });

  it('has a description of a usable length', () => {
    const description = meta('description');
    expect(description).toBeTruthy();
    expect(description.length).toBeGreaterThan(70);
    expect(description.length).toBeLessThanOrEqual(320);
    // Get The Word! is the focus; Wordle is the secondary term.
    expect(description).toMatch(/Get The Word!/);
    expect(description).toMatch(/Wordle/);
    expect(description.indexOf('Get The Word')).toBeLessThan(description.indexOf('Wordle'));
  });

  it('declares the language the page actually renders in', () => {
    expect(html).toMatch(/<html lang="id">/);
    const i18n = readFileSync('src/data/i18n.js', 'utf8');
    // ThemeContext defaults to id, so the static attribute has to match.
    expect(i18n.indexOf("id: {")).toBeLessThan(i18n.indexOf("en: {"));
  });

  it('explains itself with JavaScript off', () => {
    expect(html).toMatch(/<noscript>[\s\S]*Get The Word[\s\S]*<\/noscript>/);
  });
});

describe('social previews', () => {
  it('gives Open Graph everything a crawler reads', () => {
    for (const tag of ['og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'og:site_name', 'og:locale']) {
      expect(meta(tag), `${tag} missing`).toBeTruthy();
    }
    expect(meta('og:image:alt')).toBeTruthy();
  });

  it('declares an image size that matches the file', () => {
    const width = meta('og:image:width');
    const height = meta('og:image:height');
    const real = execSync('file -b public/og-image.png').toString().match(/(\d+)\s*x\s*(\d+)/);
    expect(`${real[1]}x${real[2]}`).toBe(`${width}x${height}`);
    // The square logo, as asked — social platforms crop rather than stretch.
    expect(width).toBe(height);
  });

  it('gives Twitter its own tags', () => {
    expect(meta('twitter:card')).toBe('summary_large_image');
    for (const tag of ['twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) {
      expect(meta(tag), `${tag} missing`).toBeTruthy();
    }
  });
});

describe('structured data', () => {
  it('is valid JSON-LD describing the app', () => {
    const source = built || html;
    const block = source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
    const data = JSON.parse(block.replaceAll('%VITE_SITE_URL%', siteUrl));

    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('WebApplication');
    expect(data.name).toBe('Get The Word Solver');
    expect(data.applicationCategory).toBe('GameApplication');
    expect(data.offers.price).toBe('0');
    expect(data.isAccessibleForFree).toBe(true);
    expect(data.inLanguage).toEqual(['id', 'en']);
    expect(data.featureList.length).toBeGreaterThan(2);
  });
});

describe('a fork adapts on its own', () => {
  it('takes every absolute URL from one setting', () => {
    // Nothing may hardcode the author's domain except the author credit itself.
    const hardcoded = [...html.matchAll(/https:\/\/fauzi\.is-a\.dev[^"]*/g)].map((m) => m[0]);
    expect(hardcoded).toEqual(['https://fauzi.is-a.dev/']); // the author link in JSON-LD
    expect(html).toContain('%VITE_SITE_URL%');
  });

  it('regenerates robots and sitemap for whatever URL is configured', () => {
    const out = execSync('VITE_SITE_URL=https://example.test/app/ node scripts/build-seo.mjs 2>&1', {
      encoding: 'utf8',
    });
    expect(out).toContain('https://example.test/app/');
    expect(readFileSync('public/sitemap.xml', 'utf8')).toContain('<loc>https://example.test/app/</loc>');

    // Put the real one back so the working tree is not left pointing elsewhere.
    execSync('node scripts/build-seo.mjs 2>/dev/null');
    expect(readFileSync('public/sitemap.xml', 'utf8')).toContain(`<loc>${siteUrl}</loc>`);
  });

  it('runs the generator as part of the build', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.scripts.build).toContain('build-seo.mjs');
  });
});

describe('images', () => {
  it('gives every image an alt attribute', () => {
    // Source files only: a test that merely mentions <img> is not markup.
    const sources = execSync("grep -rl '<img' src/ --include='*.jsx' | grep -v '.test.'")
      .toString().trim().split('\n');
    for (const file of sources) {
      const code = readFileSync(file, 'utf8');
      const images = code.split('<img').slice(1);
      for (const tag of images) {
        const head = tag.slice(0, tag.indexOf('/>') + 2);
        expect(head, `an <img> in ${file} has no alt`).toMatch(/alt=/);
      }
    }
  });
});
