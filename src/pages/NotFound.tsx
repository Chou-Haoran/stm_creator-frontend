import { useState, useEffect } from 'react';
import './NotFound.css';

const NotFound = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="wrapper-404">
      <header className="header-404" role="banner">
        <div className="container-404">
          <nav className="nav-404" aria-label="Primary">
            <div className="brand-404">
              <img 
                src="/tern.png" 
                alt="State & Transition Model Creator logo" 
                className="logo-404"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <strong aria-label="Product name" className="brand-text-404">
                State & Transition Model Creator
              </strong>
            </div>
            <div className="menu-404">
              <a href="/" className="btn-primary-404">Go Home</a>
            </div>
          </nav>
        </div>
      </header>

      <main className="main-404" role="main">
        <div className="error-content-404">
          <div className="visual-container-404">
            <svg viewBox="0 0 400 300" width="100%" height="100%" role="img" aria-label="404 illustration" className="svg-404">
              <defs>
                <linearGradient id="bg-gradient" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00A15D" stopOpacity="0.1"/>
                  <stop offset="100%" stopColor="#00A0B0" stopOpacity="0.1"/>
                </linearGradient>
                <linearGradient id="node-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00B3E6"/>
                  <stop offset="100%" stopColor="#007DB3"/>
                </linearGradient>
              </defs>
              
              <rect x="0" y="0" width="400" height="300" rx="16" fill="url(#bg-gradient)"/>
              
              <g>
                <circle cx="80" cy="150" r="28" fill="#ffffff" stroke="#007DB3" strokeWidth="3" opacity="0.4"/>
                <circle cx="200" cy="150" r="28" fill="#ffffff" stroke="#007DB3" strokeWidth="3" strokeDasharray="4,4"/>
                <circle cx="320" cy="150" r="28" fill="#ffffff" stroke="#007DB3" strokeWidth="3" opacity="0.4"/>
                
                <path d="M 108 150 L 172 150" stroke="#00B3E6" strokeWidth="2" strokeDasharray="8,4" opacity="0.3"/>
                <path d="M 228 150 L 292 150" stroke="#00B3E6" strokeWidth="2" strokeDasharray="8,4" opacity="0.3"/>
                
                <text x="200" y="158" fontSize="16" fontWeight="700" textAnchor="middle" fill="#007DB3">?</text>
              </g>
              
              <text x="200" y="240" fontSize="48" fontWeight="800" textAnchor="middle" fill="url(#node-gradient)" opacity="0.6">404</text>
            </svg>
          </div>

          <div className="text-content-404">
            <h1 className="h1-404">
              <span className="gradient-404">Page not found</span>
            </h1>
            <p className="lead-404">
              This path doesn't exist in our state transition model. Let's help you find your way back.
            </p>
            <div className="cta-group-404">
              <a href="/" className="btn-primary-404">
                Return Home
              </a>
              <a href="/editor" className="btn-secondary-404">
                Try the Editor
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer-404" role="contentinfo">
        <div className="container-404 footer-content-404">
          <div>© {currentYear} State & Transition Model Creator</div>
          <nav aria-label="Legal links" className="footer-nav-404">
            <a href="#privacy" className="footer-link-404">Privacy</a>
            <a href="#terms" className="footer-link-404">Terms</a>
            <a href="#accessibility" className="footer-link-404">Accessibility</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;