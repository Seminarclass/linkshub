import SEO from '../components/SEO.jsx';
import { GithubIcon, StarIcon } from '../components/Icons.jsx';
import categories from '../data/categories.json';

const TOTAL = categories.reduce((s, c) => s + c.count, 0);

export default function About() {
  return (
    <>
      <SEO
        title="About LinksHub — A Curated Web Directory"
        description="LinksHub is a free, open-source directory of the best websites on the internet, organized by category."
        url="https://linkshub.pages.dev/about"
      />
      <section className="section" style={{ paddingTop: 60 }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h1 style={{ fontSize: 40, marginBottom: 16 }}>About <span className="gradient">LinksHub</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 18, lineHeight: 1.7, marginBottom: 24 }}>
            LinksHub is a curated directory of <strong>{TOTAL.toLocaleString()}+</strong> websites across <strong>{categories.length}</strong> categories — from AI tools and news outlets to streaming services, anime trackers, and developer resources. Every link is hand-picked.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
            We started LinksHub to solve a simple problem: the web is full of great sites, but search engines are full of SEO spam. So we built a fast, beautiful, ad-free directory that respects your time and your privacy.
          </p>
          <h2 style={{ fontSize: 24, marginTop: 40, marginBottom: 16 }}>How it works</h2>
          <ul style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.8, paddingLeft: 24 }}>
            <li>Browse 45+ categories covering nearly every interest</li>
            <li>Press <kbd>⌘K</kbd> (or <kbd>Ctrl+K</kbd>) to instantly search 5,000+ sites</li>
            <li>Every link opens in a new tab — we never trap you</li>
            <li>No accounts, no tracking, no cookies required</li>
            <li>Open source — add a new site via GitHub Pull Request</li>
          </ul>
          <h2 style={{ fontSize: 24, marginTop: 40, marginBottom: 16 }}>Open source</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>
            The entire site is built with React + Vite and hosted on Cloudflare Pages. The codebase is MIT licensed and contributions are welcome.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <a href="https://github.com/Seminarclass/linkshub" target="_blank" rel="noopener" className="icon-btn" style={{ background: 'var(--accent)', color: 'white', padding: '12px 20px', display: 'inline-flex' }}>
              <GithubIcon /> &nbsp;View on GitHub
            </a>
            <a href="https://github.com/Seminarclass/linkshub/stargazers" target="_blank" rel="noopener" className="icon-btn" style={{ border: '1px solid var(--border)', padding: '12px 20px', display: 'inline-flex' }}>
              <StarIcon /> &nbsp;Star the repo
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
