// SEO helper — sets document.title, meta description, OG, Twitter, canonical, JSON-LD.
import { useEffect } from 'react';

export default function SEO({
  title,
  description,
  url,
  type = 'website',
  image = '/og-image.png',
  jsonLd = null,
}) {
  useEffect(() => {
    const set = (name, content, attr = 'name') => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };

    if (title) document.title = title;
    set('description', description);
    set('og:title', title, 'property');
    set('og:description', description, 'property');
    set('og:type', type, 'property');
    set('og:url', url, 'property');
    set('og:image', image, 'property');
    set('twitter:card', 'summary_large_image');
    set('twitter:title', title);
    set('twitter:description', description);
    set('twitter:image', image);
    if (url) setLink('canonical', url);

    // JSON-LD structured data
    let ldEl = document.querySelector('script[data-seo-jsonld]');
    if (jsonLd) {
      if (!ldEl) { ldEl = document.createElement('script'); ldEl.type = 'application/ld+json'; ldEl.setAttribute('data-seo-jsonld', ''); document.head.appendChild(ldEl); }
      ldEl.textContent = JSON.stringify(jsonLd);
    } else if (ldEl) {
      ldEl.remove();
    }
  }, [title, description, url, type, image, jsonLd]);

  return null;
}
