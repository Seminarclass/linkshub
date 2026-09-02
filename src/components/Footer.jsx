import { Link } from 'react-router-dom';
import { GithubIcon, StarIcon, ExternalIcon } from './Icons.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="logo">
              <div className="logo-mark">L</div>
              <span className="logo-text">LinksHub</span>
            </div>
            <p>A curated directory of 5,000+ websites across 45 categories. Built for discovery, optimized for speed.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/categories">All Categories</Link></li>
              <li><a href="#top">Trending</a></li>
            </ul>
          </div>
          <div>
            <h4>Resources</h4>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><a href="https://github.com/Seminarclass/linkshub" target="_blank" rel="noopener">Source Code</a></li>
              <li><a href="https://github.com/Seminarclass/linkshub/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">Contribute</a></li>
            </ul>
          </div>
          <div>
            <h4>Support</h4>
            <ul>
              <li><a href="https://github.com/Seminarclass/linkshub/issues" target="_blank" rel="noopener">Report Issue</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); localStorage.removeItem('theme'); }}>Reset Preferences</a></li>
              <li><Link to="/sitemap">Sitemap</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} LinksHub · MIT License · Made with ❤️</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
