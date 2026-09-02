import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Categories from './pages/Categories.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import About from './pages/About.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={
            <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
              <h1 style={{ fontSize: 64, marginBottom: 16 }}>404</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>This page wandered off.</p>
              <a href="/" className="icon-btn" style={{ background: 'var(--accent)', color: 'white', display: 'inline-flex', padding: '10px 20px' }}>
                Take me home
              </a>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
