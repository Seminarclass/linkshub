import { Link } from 'react-router-dom';
import { ArrowRight } from '../components/Icons.jsx';
import SEO from '../components/SEO.jsx';
import categories from '../data/categories.json';

const TOTAL = categories.reduce((s, c) => s + c.count, 0);

export default function Home() {
  const featured = categories.slice(0, 12);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LinksHub',
    description: 'A curated directory of 5,000+ websites across 45 categories',
    url: 'https://linkshub.pages.dev',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: 'https://linkshub.pages.dev/search?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <SEO
        title="LinksHub — Discover 5,000+ Curated Websites Across 45 Categories"
        description="A fast, beautiful directory of the best sites on the web — from AI tools to streaming, news to coding. Find what you need in seconds."
        url="https://linkshub.pages.dev"
        jsonLd={jsonLd}
      />
      <section className="hero">
        <div className="container">
          <div className="hero-badge">
            <span className="dot"></span>
            <span>Updated daily · 100% free · No tracking</span>
          </div>
          <h1>
            Discover the <span className="gradient">Best of the Web</span><br />
            in One Place
          </h1>
          <p>
            A hand-curated directory of {TOTAL.toLocaleString()}+ websites across {categories.length} categories.
            Built for speed, designed for discovery.
          </p>
          <div className="search-large">
            <div className="icon">🔍</div>
            <input
              type="search"
              placeholder="Search 5,000+ sites…"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  window.dispatchEvent(new CustomEvent('open-search', { detail: e.target.value }));
                }
              }}
            />
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">{TOTAL.toLocaleString()}+</div>
              <div className="label">Curated Sites</div>
            </div>
            <div className="hero-stat">
              <div className="num">{categories.length}</div>
              <div className="label">Categories</div>
            </div>
            <div className="hero-stat">
              <div className="num">100%</div>
              <div className="label">Free & Open</div>
            </div>
            <div className="hero-stat">
              <div className="num">0</div>
              <div className="label">Trackers</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="categories">
        <div className="container">
          <div className="section-title">
            <h2>Browse Categories</h2>
            <p>Most popular destinations</p>
            <Link to="/categories" className="badge">View all →</Link>
          </div>
          <div className="cat-grid">
            {featured.map(c => (
              <Link key={c.slug} to={`/category/${c.slug}`} className="cat-card">
                <div className="cat-icon">{c.icon}</div>
                <div className="cat-info">
                  <div className="cat-name">{c.name}</div>
                  <div className="cat-count">{c.count} sites</div>
                </div>
                <div className="cat-arrow"><ArrowRight /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="section-title">
            <h2>Why LinksHub?</h2>
          </div>
          <div className="cat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div className="cat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <div className="cat-icon" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,.2), rgba(99,102,241,.05))' }}>⚡</div>
              <div className="cat-name">Lightning Fast</div>
              <div className="cat-count" style={{ fontSize: 13, lineHeight: 1.5 }}>No backend. Static site loads in under 100ms. No ads, no scripts.</div>
            </div>
            <div className="cat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <div className="cat-icon" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,.2), rgba(236,72,153,.05))' }}>🎯</div>
              <div className="cat-name">Hand-Curated</div>
              <div className="cat-count" style={{ fontSize: 13, lineHeight: 1.5 }}>Every site is reviewed. No spam, no scams, no AI-generated junk.</div>
            </div>
            <div className="cat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <div className="cat-icon" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,.2), rgba(6,182,212,.05))' }}>🔍</div>
              <div className="cat-name">Powerful Search</div>
              <div className="cat-count" style={{ fontSize: 13, lineHeight: 1.5 }}>Press <kbd>⌘K</kbd> to instantly search 5,000+ sites by name or URL.</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
