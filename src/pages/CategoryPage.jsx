import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { ExternalIcon } from '../components/Icons.jsx';
import SEO from '../components/SEO.jsx';
import categories from '../data/categories.json';

const DESCRIPTIONS = {
  VPN: 'Top VPN services and tools for privacy, security, and unrestricted internet access.',
  Videos: 'Video hosting, sharing, and streaming platforms.',
  TV: 'Live TV streaming and on-demand television services.',
  Torrent: 'Torrent clients, trackers, and download resources.',
  Tools: 'Online utilities, calculators, and web tools.',
  Tech: 'Technology news, blogs, and developer resources.',
  Streaming: 'Music and video streaming services.',
  Software: 'Desktop and mobile software downloads.',
  'Social Media': 'Social networks and online communities.',
  Shopping: 'Online marketplaces and stores.',
  Security: 'Cybersecurity, antivirus, and privacy tools.',
  Reddit: 'Subreddits and Reddit communities.',
  Proxy: 'Web proxies and unblockers.',
  PDF: 'PDF readers, editors, and converters.',
  'Open Source Code': 'Open source projects and code repositories.',
  'Online Video Players': 'Browser-based video players and embed tools.',
  News: 'World news, technology, finance, and current events.',
  Music: 'Music streaming, downloads, and discovery.',
  Movies: 'Movie streaming, downloads, and reviews.',
  Motors: 'Automotive news, reviews, and marketplaces.',
  Memes: 'Meme generators and meme communities.',
  Jobs: 'Job boards and career resources.',
  Images: 'Image hosting, search, and stock photos.',
  Hosting: 'Web hosting, cloud, and server providers.',
  Games: 'Gaming platforms, downloads, and communities.',
  Forums: 'Discussion forums and online communities.',
  Extensions: 'Browser extensions and add-ons.',
  Editing: 'Photo, video, and audio editors.',
  Downloader: 'Video and file downloaders.',
  Domains: 'Domain registrars and DNS services.',
  DNS: 'DNS providers and management tools.',
  Cryptocurrency: 'Crypto exchanges, wallets, and blockchain explorers.',
  Creativity: 'Design tools, fonts, and creative resources.',
  Community: 'Online communities and discussion platforms.',
  Comics: 'Comics, manga, and webtoons.',
  Coding: 'Programming resources, tutorials, and tools.',
  Books: 'Ebook libraries, publishers, and reading platforms.',
  Blogs: 'Personal and professional blogs.',
  Antivirus: 'Antivirus and anti-malware software.',
  Anime: 'Anime streaming and tracking sites.',
  APKs: 'Android APK download sites and stores.',
  'Search Engines': 'Alternative search engines and search tools.',
  AI: 'AI tools, chatbots, and machine learning platforms.',
  Extra: 'Useful sites and miscellaneous resources.',
};

export default function CategoryPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');

  const category = useMemo(() => categories.find(c => c.slug === slug), [slug]);

  if (!category) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>Category not found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>The category "{slug}" doesn't exist.</p>
        <Link to="/categories" className="icon-btn" style={{ background: 'var(--accent)', color: 'white', display: 'inline-flex', padding: '10px 20px' }}>
          Browse all categories
        </Link>
      </div>
    );
  }

  // Filter items by search query
  const filterItems = (items) => {
    if (!q.trim()) return items;
    const term = q.toLowerCase();
    return items.filter(it => it.name.toLowerCase().includes(term) || it.url.toLowerCase().includes(term));
  };

  const sections = Object.entries(category.sections)
    .map(([name, items]) => [name, filterItems(items)])
    .filter(([_, items]) => items.length > 0);

  const totalShown = sections.reduce((s, [_, items]) => s + items.length, 0);
  const desc = DESCRIPTIONS[category.name] || `Discover ${category.count} curated ${category.name.toLowerCase()} resources.`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} — LinksHub`,
    description: desc,
    url: `https://linkshub.pages.dev/category/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: category.count,
      itemListElement: sections.flatMap(([_, items]) => items.slice(0, 10)).map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        url: it.url,
      })),
    },
  };

  return (
    <>
      <SEO
        title={`${category.name} — ${category.count} Curated Sites | LinksHub`}
        description={desc}
        url={`https://linkshub.pages.dev/category/${category.slug}`}
        jsonLd={jsonLd}
      />
      <section className="cat-header">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/categories">Categories</Link>
            <span>/</span>
            <span style={{ color: 'var(--text)' }}>{category.name}</span>
          </div>
          <div className="row">
            <div className="icon">{category.icon}</div>
            <div style={{ flex: 1 }}>
              <h1>{category.name}</h1>
              <p className="desc">{desc}</p>
              <div className="meta">
                <span>📦 {category.count} sites</span>
                <span>📑 {Object.keys(category.sections).length} sections</span>
                <span>🔄 Updated regularly</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container">
          <div className="search-large" style={{ maxWidth: '100%', marginBottom: 32 }}>
            <div className="icon">🔍</div>
            <input
              type="search"
              placeholder={`Filter ${category.name} sites…`}
              value={q}
              onChange={e => { setQ(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}); }}
            />
            {q && (
              <button className="clear" onClick={() => { setQ(''); setParams({}); }}>Clear</button>
            )}
          </div>

          {q && (
            <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>
              Showing {totalShown} of {category.count} sites matching "<strong>{q}</strong>"
            </p>
          )}

          {sections.length === 0 ? (
            <div className="empty-state" style={{ padding: 60 }}>
              No sites in this category match "<strong>{q}</strong>". Try a different search.
            </div>
          ) : (
            sections.map(([name, items]) => (
              <div key={name} className="subgroup">
                <div className="subgroup-head">
                  <h3>{name}</h3>
                  <span className="count">{items.length}</span>
                </div>
                <div className="link-grid">
                  {items.map((it, i) => {
                    const initial = it.name.charAt(0).toUpperCase();
                    const domain = it.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
                    return (
                      <a
                        key={i}
                        href={it.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-card"
                        title={it.url}
                      >
                        <div className="link-favicon">{initial}</div>
                        <div className="link-info">
                          <div className="link-name">{it.name}</div>
                          <div className="link-domain">{domain}</div>
                        </div>
                        <ExternalIcon />
                      </a>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <RelatedCategories current={category.name} />
        </div>
      </section>
    </>
  );
}

function RelatedCategories({ current }) {
  const related = categories
    .filter(c => c.name !== current)
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);
  return (
    <div style={{ marginTop: 60 }}>
      <div className="section-title">
        <h2>Explore More</h2>
      </div>
      <div className="cat-grid">
        {related.map(c => (
          <Link key={c.slug} to={`/category/${c.slug}`} className="cat-card">
            <div className="cat-icon">{c.icon}</div>
            <div className="cat-info">
              <div className="cat-name">{c.name}</div>
              <div className="cat-count">{c.count} sites</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
