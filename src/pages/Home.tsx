import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sticky header scroll effect — listen on the .home-page div (the scroll container)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 10);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on nav link click
  const closeMobileMenu = () => setMenuOpen(false);

  const goToEditor = () => navigate('/editor');

  return (
    <div className="home-page" ref={containerRef}>
      {/* ══ HEADER ══ */}
      <header
        ref={headerRef}
        className={`hp-header${scrolled ? ' scrolled' : ''}`}
        role="banner"
      >
        <div className="hp-header-inner">
          <a href="#" className="hp-header-brand" aria-label="TERN home">
            <div className="hp-header-logo">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="5" r="2.5" fill="white" opacity="0.9" />
                <circle cx="4" cy="13" r="2" fill="white" opacity="0.7" />
                <circle cx="14" cy="13" r="2" fill="white" opacity="0.7" />
                <line x1="9" y1="7.5" x2="4.8" y2="11.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="9" y1="7.5" x2="13.2" y2="11.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="hp-header-wordmark">STM Creator</span>
          </a>

          <nav className="hp-header-nav" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#docs">Docs</a>
          </nav>

          <div className="hp-header-actions">
            <button className="hp-btn-link" onClick={goToEditor}>Log In</button>
            <button className="hp-btn-primary" onClick={goToEditor}>Get Started</button>
          </div>

          <button
            className="hp-hamburger"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`hp-mobile-menu${menuOpen ? ' open' : ''}`}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <a href="#features" onClick={closeMobileMenu}>Features</a>
        <a href="#how-it-works" onClick={closeMobileMenu}>How It Works</a>
        <a href="#vast" onClick={closeMobileMenu}>VAST System</a>
        <a href="#docs" onClick={closeMobileMenu}>Docs</a>
        <div className="hp-mobile-ctas">
          <button className="hp-btn-secondary" style={{ flex: 1 }} onClick={goToEditor}>Log In</button>
          <button className="hp-btn-primary" style={{ flex: 1 }} onClick={goToEditor}>Get Started</button>
        </div>
      </div>

      <main>
        {/* ══ HERO ══ */}
        <section className="hp-hero-wrap" aria-label="Hero">
          <div className="hp-section">
            <div className="hp-hero-grid">
              {/* Left: text */}
              <div className="hp-hero-text">
                <div className="hp-hero-eyebrow">
                  <span className="hp-dot" aria-hidden="true" />
                  Live Collaborative Editing
                </div>
                <h1 className="hp-hero-headline">
                  Model Ecosystems<br /><em>Together</em> —<br />In Real Time
                </h1>
                <p className="hp-hero-sub">
                  STM Creator is a shared canvas to build, annotate, and compare
                  state-and-transition models using the Australian Ecosystem Models Framework.
                </p>
                <div className="hp-hero-ctas">
                  <button
                    className="hp-btn-hero-primary"
                    aria-label="Start editing a model"
                    onClick={goToEditor}
                  >
                    Start Editing
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right: canvas mockup */}
              {/* Right: canvas mockup */}
              <div
                  className="hp-canvas-mockup"
                  role="img"
                  aria-label="TERN collaborative STM canvas editor showing vegetation state nodes and transitions"
              >
                <div className="hp-canvas-grid" aria-hidden="true" />

                <svg
                    className="hp-canvas-svg"
                    viewBox="0 0 830 460"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <marker id="arr-black" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
                      <path d="M0 0L7 3.5L0 7" fill="none" stroke="#1f2937" strokeWidth="1.4" />
                    </marker>
                    <marker id="arr-teal" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
                      <path d="M0 0L7 3.5L0 7" fill="none" stroke="#2a9d8f" strokeWidth="1.4" />
                    </marker>
                    <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity={0.12} />
                    </filter>
                  </defs>

                  {/* ===== Transitions ===== */}

                  {/* Top row: Class I  <-->  Class II  (horizontal pair) */}
                  {/* Black arrow: I -> II (degradation, going right) */}
                  <path d="M178 58 L322 58" stroke="#1f2937" strokeWidth="1.6" fill="none" markerEnd="url(#arr-black)" />
                  {/* Teal arrow: II -> I (restoration, going left) */}
                  <path d="M322 78 L235 78" stroke="#2a9d8f" strokeWidth="1.6" fill="none" markerEnd="url(#arr-teal)" />

                  {/* Class II <--> Class III (vertical pair, top-right to middle) */}
                  {/* Black solid: II -> III (down) */}
                  <path d="M412 122 L412 198" stroke="#1f2937" strokeWidth="1.6" fill="none" markerEnd="url(#arr-black)" />
                  {/* Teal dashed: III -> II (up) */}
                  <path d="M432 198 L432 122" stroke="#2a9d8f" strokeWidth="1.6" strokeDasharray="5 4" fill="none" markerEnd="url(#arr-teal)" />

                  {/* Class III <--> Class IV (vertical pair, middle to bottom-middle) */}
                  {/* Black solid: III -> IV (down) */}
                  <path d="M412 282 L412 358" stroke="#1f2937" strokeWidth="1.6" fill="none" markerEnd="url(#arr-black)" />
                  {/* Teal solid: IV -> III (up) */}
                  <path d="M432 358 L432 282" stroke="#2a9d8f" strokeWidth="1.6" fill="none" markerEnd="url(#arr-teal)" />

                  {/* Class IV <--> Class V (horizontal pair, bottom row) */}
                  {/* Black solid: IV -> V (right) */}
                  <path d="M518 398 L602 398" stroke="#1f2937" strokeWidth="1.6" fill="none" markerEnd="url(#arr-black)" />
                  {/* Teal solid: V -> IV (left) */}
                  <path d="M602 418 L518 418" stroke="#2a9d8f" strokeWidth="1.6" fill="none" markerEnd="url(#arr-teal)" />

                  {/* ===== Nodes ===== */}

                  {/* Node: Class I — Close to reference (top-left, dark teal) */}
                  <rect x="38" y="22" width="196" height="92" rx="6" fill="#2a9d8f" filter="url(#nodeShadow)" />
                  <text x="138" y="46" fontFamily="IBM Plex Sans,sans-serif" fontSize="11.5" fontWeight="700" fill="white" textAnchor="middle">Close to reference</text>
                  <text x="138" y="60" fontFamily="IBM Plex Sans,sans-serif" fontSize="11.5" fontWeight="700" fill="white" textAnchor="middle">tree layer</text>
                  <text x="138" y="78" fontFamily="IBM Plex Sans,sans-serif" fontSize="10" fill="rgba(255,255,255,0.92)" textAnchor="middle">with close to</text>
                  <text x="138" y="91" fontFamily="IBM Plex Sans,sans-serif" fontSize="10" fill="rgba(255,255,255,0.92)" textAnchor="middle">reference shrub/ground</text>
                  <text x="138" y="104" fontFamily="IBM Plex Sans,sans-serif" fontSize="10" fill="rgba(255,255,255,0.92)" textAnchor="middle">layers</text>

                  {/* Node: Class II — Highly modified tree, close-to-ref understory (top-right, light teal/sage) */}
                  <rect x="322" y="22" width="196" height="92" rx="6" fill="#8ec9bf" filter="url(#nodeShadow)" />
                  <text x="412" y="46" fontFamily="IBM Plex Sans,sans-serif" fontSize="11.5" fontWeight="700" fill="#0f172a" textAnchor="middle">Highly modified tree layer</text>
                  <text x="412" y="66" fontFamily="IBM Plex Sans,sans-serif" fontSize="10" fill="#0f172a" textAnchor="middle">with close to reference</text>
                  <text x="412" y="80" fontFamily="IBM Plex Sans,sans-serif" fontSize="10" fill="#0f172a" textAnchor="middle">shrub/ground layers</text>

                  {/* Node: Class III — Highly modified tree, modified understory (middle, yellow/tan) */}
                  <rect x="322" y="198" width="196" height="84" rx="6" fill="#e9d8a6" filter="url(#nodeShadow)" />
                  <text x="412" y="222" fontFamily="IBM Plex Sans,sans-serif" fontSize="11.5" fontWeight="700" fill="#0f172a" textAnchor="middle">Highly modified tree layer</text>
                  <text x="412" y="242" fontFamily="IBM Plex Sans,sans-serif" fontSize="10" fill="#0f172a" textAnchor="middle">with modified</text>
                  <text x="412" y="256" fontFamily="IBM Plex Sans,sans-serif" fontSize="10" fill="#0f172a" textAnchor="middle">shrub/ground layers</text>

                  {/* Node: Class IV — Highly modified tree, highly modified understory (bottom-middle, peach) */}
                  <rect x="322" y="358" width="196" height="84" rx="6" fill="#fcd5b5" filter="url(#nodeShadow)" />
                  <text x="420" y="382" fontFamily="IBM Plex Sans,sans-serif" fontSize="11.5" fontWeight="700" fill="#0f172a" textAnchor="middle">Highly modified tree layer</text>
                  <text x="420" y="402" fontFamily="IBM Plex Sans,sans-serif" fontSize="10" fill="#0f172a" textAnchor="middle">with highly modified</text>
                  <text x="420" y="416" fontFamily="IBM Plex Sans,sans-serif" fontSize="10" fill="#0f172a" textAnchor="middle">shrub/ground layers</text>

                  {/* Node: Class V — Collapsed tree layer (bottom-right, coral/red) */}
                  <rect x="602" y="358" width="196" height="84" rx="6" fill="#d96a6a" filter="url(#nodeShadow)" />
                  <text x="702" y="382" fontFamily="IBM Plex Sans,sans-serif" fontSize="11.5" fontWeight="700" fill="white" textAnchor="middle">Collapsed tree layer</text>
                  <text x="702" y="402" fontFamily="IBM Plex Sans,sans-serif" fontSize="10" fill="rgba(255,255,255,0.95)" textAnchor="middle">with highly modified</text>
                  <text x="702" y="416" fontFamily="IBM Plex Sans,sans-serif" fontSize="10" fill="rgba(255,255,255,0.95)" textAnchor="middle">shrub/ground layers</text>
                </svg>

                {/* Cursor: Sarah */}
                <div className="hp-cursor hp-cursor-sarah" aria-hidden="true">
                  <svg width="16" height="20" viewBox="0 0 16 20">
                    <path d="M2 2L14 9L8.5 10.5L6 16L2 2Z" fill="#2a9d8f" stroke="white" strokeWidth="1.2" />
                  </svg>
                  <span className="hp-cursor-label" style={{ background: '#2a9d8f' }}>Sarah</span>
                </div>

                {/* Cursor: James */}
                <div className="hp-cursor hp-cursor-james" aria-hidden="true">
                  <svg width="16" height="20" viewBox="0 0 16 20">
                    <path d="M2 2L14 9L8.5 10.5L6 16L2 2Z" fill="#6366f1" stroke="white" strokeWidth="1.2" />
                  </svg>
                  <span className="hp-cursor-label" style={{ background: '#6366f1' }}>James</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ══ TRUST BAR ══ */}
        <section className="hp-trust-bar" aria-label="Key capabilities">
          <div className="hp-trust-inner">
            <div className="hp-trust-item">
              <span>3 Model templates</span>
            </div>
            <div className="hp-trust-divider" role="separator" />
            <div className="hp-trust-item">
              <span>Multi-user editing</span>
            </div>
            <div className="hp-trust-divider" role="separator" />
            <div className="hp-trust-item">
              <span>Version snapshots &amp; Restore</span>
            </div>
            <div className="hp-trust-divider" role="separator" />
            <div className="hp-trust-item">
              <span>JSON export</span>
            </div>
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section className="hp-features-wrap" id="features" aria-labelledby="hp-features-heading">
          <div className="hp-section">
            <div className="hp-section-label">Features</div>
            <h2 className="hp-section-heading" id="hp-features-heading">
              A tool to develop ecosystem models <br /> collaboratively
            </h2>
            <p className="hp-section-sub">
               Using standarised templates to rapidly create state-and-transition models
            </p>

            <div className="hp-features-grid">
              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7" cy="10" r="3" /><circle cx="14" cy="7" r="2.5" />
                    <path d="M9.8 9L12 8M7 13v2M14 9.5v3" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Live collaboration</h3>
                <p className="hp-feat-desc">Users can work on the same model simultaneously, just like an electronic white board.</p>
              </article>



              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="4" r="2" /><circle cx="4" cy="15" r="2" /><circle cx="16" cy="15" r="2" />
                    <path d="M10 6L4 13M10 6L16 13" />
                    <path d="M14 2l2 2-2 2" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Smart auto-layout</h3>
                <p className="hp-feat-desc">Uses standardised layouts that can be easliy changed using different layout engines.</p>
              </article>

              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="10" r="7.5" />
                    <path d="M10 6v4l2.5 2.5" />
                    <path d="M6.5 3.5L4 2M13.5 3.5L16 2" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Version snapshots</h3>
                <p className="hp-feat-desc">Create versions at any point. Restore the full canvas to any previous version.</p>
              </article>

              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1.5" y="4" width="7" height="12" rx="2" />
                    <rect x="11.5" y="4" width="7" height="12" rx="2" />
                    <path d="M9 10h2" />
                    <path d="M4.5 7h2M4.5 10h2M4.5 13h2M14.5 7l1.5 1.5-1.5 1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Version comparison</h3>
                <p className="hp-feat-desc">Compare any two versions of a model side-by-side. Instantly see which states and transitions were added, removed, or modified between versions.</p>
              </article>

              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="16" height="16" rx="3" strokeDasharray="3 2" />
                    <circle cx="7" cy="7" r="2" fill="currentColor" stroke="none" opacity="0.5" />
                    <circle cx="13" cy="7" r="2" fill="currentColor" stroke="none" opacity="0.5" />
                    <circle cx="10" cy="13" r="2" fill="currentColor" stroke="none" opacity="0.5" />
                    <path d="M8.8 8L11.2 8M8 8.8L10.2 12.2" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Model templates</h3>
                <p className="hp-feat-desc">Create a model from a template to rapidly add standardised states.</p>
              </article>

              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8.5" cy="8.5" r="5.5" />
                    <path d="M13 13l4 4" />
                    <path d="M6.5 8.5h4M8.5 6.5v4" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Easy driver assignment</h3>
                <p className="hp-feat-desc">Easily search through a standardised driver list to add any driver (e.g. fire, grazing, drought) to a transition.</p>
              </article>

              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2L3 6v4c0 4 3 7 7 8 4-1 7-4 7-8V6L10 2z" />
                    <path d="M7 10l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Role-based access and management</h3>
                <p className="hp-feat-desc">Manage your model access and editing through assignment of role-based permisions. Give editing access to model developers, and review access to model reviewers.</p>
              </article>

              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2L3 6v4c0 4 3 7 7 8 4-1 7-4 7-8V6L10 2z" />
                    <path d="M7 10l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Review comments</h3>
                <p className="hp-feat-desc">Allows reviewers to add comments to the model for model creators to resolve.</p>
              </article>


            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section className="hp-how-wrap" id="how-it-works" aria-labelledby="hp-how-heading">
          <div className="hp-section">
            <div className="hp-section-label">Workflow</div>
            <h2 className="hp-section-heading" id="hp-how-heading">
              From Login to published<br />model!
            </h2>

            <div className="hp-steps-grid">
              <div className="hp-step-item">
                <div className="hp-step-num" aria-hidden="true">1</div>
                <div className="hp-step-body">
                  <div className="hp-step-title">Sign In or Continue as Guest</div>
                  <p className="hp-step-desc">Create a verified account or explore as a guest. Your role determines what you can create, edit, or view.</p>
                </div>
              </div>
              <div className="hp-step-item">
                <div className="hp-step-num" aria-hidden="true">2</div>
                <div className="hp-step-body">
                  <div className="hp-step-title">Open or Create a Model</div>
                  <p className="hp-step-desc">Pick from existing ecosystem models or start fresh from a template with pre-defined ecosystem states.</p>
                </div>
              </div>
              <div className="hp-step-item">
                <div className="hp-step-num" aria-hidden="true">3</div>
                <div className="hp-step-body">
                  <div className="hp-step-title">Build Your State-and-Transition Model</div>
                  <p className="hp-step-desc">Add or edit ecosystem states,  add transitions and drivers.</p>
                </div>
              </div>
              <div className="hp-step-item">
                <div className="hp-step-num" aria-hidden="true">4</div>
                <div className="hp-step-body">
                  <div className="hp-step-title">Collaborate &amp; Refine</div>
                  <p className="hp-step-desc">Invite your team. Watch live changes to the model and save named versions as your model evolves.</p>
                </div>
              </div>
              <div className="hp-step-item">
                <div className="hp-step-num" aria-hidden="true">5</div>
                <div className="hp-step-body">
                  <div className="hp-step-title">Export &amp; Share</div>
                  <p className="hp-step-desc">Export your model as JSON for use in other tools. Compare versions before finalising.</p>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* ══ FINAL CTA ══ */}
        <section className="hp-cta-wrap" aria-labelledby="hp-cta-heading">
          <div className="hp-section hp-cta-inner">
            <h2 className="hp-cta-headline" id="hp-cta-heading">Ready to model your ecosystem?</h2>
            <p className="hp-cta-sub">
              Start using STM creator by creating a free account and start building your first
              state-and-transition model today.
            </p>
            <div className="hp-cta-actions">
              <button className="hp-btn-cta-primary" aria-label="Create a free account" onClick={goToEditor}>
                Create a free account
              </button>
              <button className="hp-btn-cta-link" aria-label="Explore STM Creator as a guest" onClick={goToEditor}>
                Explore as guest
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ══ FOOTER ══ */}
      <footer className="hp-footer" role="contentinfo">
        <div className="hp-footer-grid">
          <div>
            <div className="hp-footer-logo-row">
              <div className="hp-footer-logo-box" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="5" r="2.5" fill="white" opacity="0.9" />
                  <circle cx="4" cy="13" r="2" fill="white" opacity="0.7" />
                  <circle cx="14" cy="13" r="2" fill="white" opacity="0.7" />
                  <line x1="9" y1="7.5" x2="4.8" y2="11.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="9" y1="7.5" x2="13.2" y2="11.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="hp-footer-wordmark">STM Creator</span>
            </div>
            <p className="hp-footer-brand-desc">Collaborative state-and-transition model development</p>
          </div>

          <div>
            <div className="hp-footer-col-title">Product</div>
            <nav className="hp-footer-links" aria-label="Product links">
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#features">Model templates</a>
              <a href="#features">EKS export</a>
            </nav>
          </div>

          <div>
            <div className="hp-footer-col-title">Resources</div>
            <nav className="hp-footer-links" aria-label="Resource links" id="docs">
              <a href="#">API Docs (Swagger)</a>
              <a href="#">GitHub — Frontend</a>
            </nav>
          </div>

          <div>
            <div className="hp-footer-col-title">Account</div>
            <nav className="hp-footer-links" aria-label="Account links">
              <a href="#" onClick={(e) => { e.preventDefault(); goToEditor(); }}>Log In</a>
              <a href="#" onClick={(e) => { e.preventDefault(); goToEditor(); }}>Sign Up</a>
              <a href="#" onClick={(e) => { e.preventDefault(); goToEditor(); }}>Guest Mode</a>
              <a href="#">Contact / Support</a>
            </nav>
          </div>
        </div>

        <div className="hp-footer-bottom">
          <span className="hp-footer-bottom-left">© 2026 STM Creator. Built for Australian ecological science.</span>
          <div className="hp-footer-bottom-right">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
