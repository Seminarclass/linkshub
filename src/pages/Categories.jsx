import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '../components/Icons.jsx';
import SEO from '../components/SEO.jsx';
import categories from '../data/categories.json';

export default function Categories() {
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('count');

  const filtered = useMemo(() => {
    let list = categories;
    if (q.trim()) {
      const term = q.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(term));
    }
    if (sortBy === 'count') list = [...list].sort((a, b) => b.count - a.count);
    else if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'newest') list = [...list].reverse();
    return list;
  }, [q, sortBy]);

  return (
    <>
      <SEO
        title={`All ${categories.length} Categories — LinksHub`}
        description={`Browse all ${categories.length} categories with ${categories.reduce((s, c) => s + c.count, 0).toLocaleString()}+ curated websites.`}
        url="https://linkshub.pages.dev/categories"
      />
      <section className="hero" style={{ padding: '48px 0 32px' }}>
        <div className="container">
          <h1 style={{ fontSize: 40 }}>All <span className="gradient">Categories</span></h1>
          <p style={{ fontSize: 16, marginTop: 8 }}>
            {categories.length} categories · {categories.reduce((s, c) => s + c.count, 0).toLocaleString()}+ websites
          </p>
          <div className="search-large" style={{ marginTop: 32 }}>
            <div className="icon">🔍</div>
            <input
              type="search"
              placeholder="Filter categories…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container">
          <div className="section-title">
            <h2>{filtered.length} {filtered.length === 1 ? 'Category' : 'Categories'}</h2>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '8px 12px', borderRadius: 8,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 13, outline: 'none',
                }}
              >
                <option value="count">Most sites</option>
                <option value="name">A → Z</option>
                <option value="newest">Recently added</option>
              </select>
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 60 }}>
              No categories match "<strong>{q}</strong>"
            </div>
          ) : (
            <div className="cat-grid">
              {filtered.map(c => (
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
          )}
        </div>
      </section>
    </>
  );
}
