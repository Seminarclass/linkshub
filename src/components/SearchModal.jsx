import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, ArrowRight, CloseIcon } from './Icons.jsx';
import categories from '../data/categories.json';

export default function SearchModal({ onClose }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    if (!q.trim()) {
      // Show categories by default
      return categories.slice(0, 8).map(c => ({
        type: 'category', name: c.name, slug: c.slug, icon: c.icon, count: c.count,
      }));
    }
    const term = q.toLowerCase();
    const out = [];
    for (const cat of categories) {
      if (cat.name.toLowerCase().includes(term)) {
        out.push({ type: 'category', name: cat.name, slug: cat.slug, icon: cat.icon, count: cat.count });
      }
      for (const [section, items] of Object.entries(cat.sections)) {
        for (const item of items) {
          if (item.name.toLowerCase().includes(term) || item.url.toLowerCase().includes(term)) {
            out.push({
              type: 'link', name: item.name, url: item.url,
              category: cat.name, slug: cat.slug, icon: cat.icon,
            });
            if (out.length > 80) break;
          }
        }
        if (out.length > 80) break;
      }
      if (out.length > 80) break;
    }
    return out;
  }, [q]);

  const onSelect = (r) => {
    if (r.type === 'category') {
      nav(`/category/${r.slug}`);
    } else {
      nav(`/category/${r.slug}?q=${encodeURIComponent(r.name)}`);
    }
    onClose();
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter' && results[active]) { onSelect(results[active]); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-search">
          <div className="icon"><SearchIcon /></div>
          <input
            ref={inputRef}
            value={q}
            onChange={e => { setQ(e.target.value); setActive(0); }}
            onKeyDown={onKey}
            placeholder={q ? "Type to search…" : "Search categories or websites…"}
          />
          <button className="clear" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="modal-results">
          {!results.length && <div className="empty-state">No results for "<strong>{q}</strong>"</div>}
          {results.map((r, i) => (
            <div
              key={`${r.type}-${i}`}
              className={`result-item ${i === active ? 'active' : ''}`}
              onClick={() => onSelect(r)}
              onMouseEnter={() => setActive(i)}
            >
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{r.icon || '🔗'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </div>
                {r.url && (
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.url}
                  </div>
                )}
              </div>
              {r.type === 'category' ? (
                <span className="result-cat">{r.count} sites</span>
              ) : (
                <span className="result-cat">{r.category}</span>
              )}
              <ArrowRight />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
