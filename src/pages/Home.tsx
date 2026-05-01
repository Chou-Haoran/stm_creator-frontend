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
            <span className="hp-header-wordmark">TERN</span>
          </a>

          <nav className="hp-header-nav" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#vast">VAST System</a>
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
                  TERN gives ecologists and land managers a shared canvas to build, annotate, and compare
                  State Transition Models using Australia's VAST classification system.
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
              <div
                className="hp-canvas-mockup"
                role="img"
                aria-label="TERN collaborative STM canvas editor showing vegetation state nodes and transitions"
              >
                <div className="hp-canvas-grid" aria-hidden="true" />

                <svg
                  className="hp-canvas-svg"
                  viewBox="0 0 560 420"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0 0L6 3L0 6" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
                    </marker>
                    <marker id="arr-g" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0 0L6 3L0 6" fill="none" stroke="#10b981" strokeWidth="1.2" />
                    </marker>
                    <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity={0.12} />
                    </filter>
                  </defs>

                  {/* Transition edges */}
                  <path d="M190 118 Q260 80 340 118" stroke="#94a3b8" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
                  <path d="M190 142 Q130 200 155 258" stroke="#94a3b8" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
                  <path d="M360 142 Q390 200 370 258" stroke="#10b981" strokeWidth="1.5" fill="none" markerEnd="url(#arr-g)" />
                  <path d="M190 282 Q260 330 330 282" stroke="#94a3b8" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
                  <path d="M350 118 Q460 160 420 258" stroke="#94a3b8" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
                  <path d="M175 270 Q110 340 155 360 Q230 380 280 300" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3" fill="none" markerEnd="url(#arr)" />

                  {/* Edge labels */}
                  <rect x="248" y="72" width="64" height="19" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                  <text x="280" y="85" fontFamily="IBM Plex Mono,monospace" fontSize="9.5" fill="#64748b" textAnchor="middle">Fire · 25 yrs</text>

                  <rect x="108" y="195" width="48" height="18" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                  <text x="132" y="208" fontFamily="IBM Plex Mono,monospace" fontSize="9.5" fill="#64748b" textAnchor="middle">Grazing</text>

                  <rect x="376" y="195" width="58" height="18" rx="4" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                  <text x="405" y="208" fontFamily="IBM Plex Mono,monospace" fontSize="9.5" fill="#059669" textAnchor="middle">Restore</text>

                  <rect x="242" y="330" width="76" height="18" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                  <text x="280" y="343" fontFamily="IBM Plex Mono,monospace" fontSize="9.5" fill="#64748b" textAnchor="middle">Drought · 5 yrs</text>

                  {/* Node: Class I */}
                  <rect x="128" y="98" width="124" height="60" rx="10" fill="#166534" filter="url(#nodeShadow)" />
                  <text x="190" y="122" fontFamily="IBM Plex Sans,sans-serif" fontSize="11" fontWeight="600" fill="white" textAnchor="middle">Class I — Intact</text>
                  <text x="190" y="138" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.7)" textAnchor="middle">EKS·A1·pristine</text>

                  {/* Node: Class II */}
                  <rect x="298" y="98" width="128" height="60" rx="10" fill="#16a34a" filter="url(#nodeShadow)" />
                  <text x="362" y="122" fontFamily="IBM Plex Sans,sans-serif" fontSize="11" fontWeight="600" fill="white" textAnchor="middle">Class II — Lg. Intact</text>
                  <text x="362" y="138" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.7)" textAnchor="middle">EKS·A2·largely-intact</text>

                  {/* Node: Class III */}
                  <rect x="94" y="242" width="136" height="60" rx="10" fill="#65a30d" filter="url(#nodeShadow)" />
                  <text x="162" y="266" fontFamily="IBM Plex Sans,sans-serif" fontSize="11" fontWeight="600" fill="white" textAnchor="middle">Class III — Sw. Degraded</text>
                  <text x="162" y="282" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.7)" textAnchor="middle">EKS·B1·sw-degraded</text>

                  {/* Node: Class IV */}
                  <rect x="290" y="242" width="120" height="60" rx="10" fill="#ca8a04" filter="url(#nodeShadow)" />
                  <text x="350" y="266" fontFamily="IBM Plex Sans,sans-serif" fontSize="11" fontWeight="600" fill="white" textAnchor="middle">Class IV — Degraded</text>
                  <text x="350" y="282" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.7)" textAnchor="middle">EKS·B2·degraded</text>

                  {/* Node: Class V */}
                  <rect x="428" y="242" width="110" height="60" rx="10" fill="#ea580c" filter="url(#nodeShadow)" />
                  <text x="483" y="266" fontFamily="IBM Plex Sans,sans-serif" fontSize="11" fontWeight="600" fill="white" textAnchor="middle">Class V — Lg. Deg.</text>
                  <text x="483" y="282" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.7)" textAnchor="middle">EKS·C1·largely-deg.</text>

                  {/* Selection ring on Class II */}
                  <rect x="294" y="94" width="136" height="68" rx="13" stroke="#10b981" strokeWidth="2" fill="none" />

                  {/* Node lock badge */}
                  <rect x="414" y="91" width="60" height="18" rx="5" fill="#10b981" />
                  <text x="444" y="104" fontFamily="IBM Plex Mono,monospace" fontSize="8.5" fontWeight="600" fill="white" textAnchor="middle">🔒 Sarah</text>
                </svg>

                {/* Cursor: Sarah */}
                <div className="hp-cursor hp-cursor-sarah" aria-hidden="true">
                  <svg width="16" height="20" viewBox="0 0 16 20">
                    <path d="M2 2L14 9L8.5 10.5L6 16L2 2Z" fill="#10b981" stroke="white" strokeWidth="1.2" />
                  </svg>
                  <span className="hp-cursor-label" style={{ background: '#10b981' }}>Sarah</span>
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
              <span>6 VAST Condition Classes</span>
            </div>
            <div className="hp-trust-divider" role="separator" />
            <div className="hp-trust-item">
              <span>Real-Time Multi-User Editing</span>
            </div>
            <div className="hp-trust-divider" role="separator" />
            <div className="hp-trust-item">
              <span>Milestone Snapshots &amp; Restore</span>
            </div>
            <div className="hp-trust-divider" role="separator" />
            <div className="hp-trust-item">
              <span>EKS JSON Export</span>
            </div>
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section className="hp-features-wrap" id="features" aria-labelledby="hp-features-heading">
          <div className="hp-section">
            <div className="hp-section-label">Features</div>
            <h2 className="hp-section-heading" id="hp-features-heading">
              Everything a Field<br />Ecologist Needs
            </h2>
            <p className="hp-section-sub">
              From first sketch to final export, built for the complexity of real ecosystem science.
            </p>

            <div className="hp-features-grid">
              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7" cy="10" r="3" /><circle cx="14" cy="7" r="2.5" />
                    <path d="M9.8 9L12 8M7 13v2M14 9.5v3" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Live Collaboration</h3>
                <p className="hp-feat-desc">Multiple scientists edit the same model simultaneously. See each other's cursors, claim node edit locks, and stay in sync without merge conflicts.</p>
              </article>

              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="14" width="4" height="4" rx="1" fill="currentColor" stroke="none" opacity="0.4" />
                    <rect x="8" y="10" width="4" height="8" rx="1" fill="currentColor" stroke="none" opacity="0.6" />
                    <rect x="14" y="6" width="4" height="12" rx="1" fill="currentColor" stroke="none" opacity="0.9" />
                    <path d="M3 13L9 9L15 5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">VAST Classification</h3>
                <p className="hp-feat-desc">Every state is classified using Australia's VAST system, Class I (pristine) through Class VI (bare/degraded) with EKS codes attached to each node.</p>
              </article>

              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="4" r="2" /><circle cx="4" cy="15" r="2" /><circle cx="16" cy="15" r="2" />
                    <path d="M10 6L4 13M10 6L16 13" />
                    <path d="M14 2l2 2-2 2" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Smart Auto-Layout</h3>
                <p className="hp-feat-desc">One click re-arranges your entire model using the ELK layout engine, running in a background worker so your canvas never freezes.</p>
              </article>

              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="10" r="7.5" />
                    <path d="M10 6v4l2.5 2.5" />
                    <path d="M6.5 3.5L4 2M13.5 3.5L16 2" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Milestone Snapshots</h3>
                <p className="hp-feat-desc">Capture named snapshots at any point. Restore the full canvas to any past milestone if a session goes wrong or stakeholders change their mind.</p>
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
                <h3 className="hp-feat-title">Version Comparison</h3>
                <p className="hp-feat-desc">Compare any two milestones side-by-side. Instantly see which states and transitions were added, removed, or modified between versions.</p>
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
                <h3 className="hp-feat-title">Model Templates</h3>
                <p className="hp-feat-desc">Start from stakeholder-defined ecosystem templates with pre-loaded vegetation states. Draw transitions yourself to explore degradation pathways.</p>
              </article>

              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8.5" cy="8.5" r="5.5" />
                    <path d="M13 13l4 4" />
                    <path d="M6.5 8.5h4M8.5 6.5v4" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Driver Autocomplete</h3>
                <p className="hp-feat-desc">Type any driver (fire, grazing, drought) and fuzzy-search against the full driver library. Consistent labelling across all models in your organisation.</p>
              </article>

              <article className="hp-feat-card">
                <div className="hp-feat-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2L3 6v4c0 4 3 7 7 8 4-1 7-4 7-8V6L10 2z" />
                    <path d="M7 10l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="hp-feat-title">Role-Based Access</h3>
                <p className="hp-feat-desc">Assign Admin, Editor, or Viewer roles per model. Admins control structure; Editors collaborate; Viewers observe full RBAC enforced throughout.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section className="hp-how-wrap" id="how-it-works" aria-labelledby="hp-how-heading">
          <div className="hp-section">
            <div className="hp-section-label">Workflow</div>
            <h2 className="hp-section-heading" id="hp-how-heading">
              From Login to Published<br />Model in Minutes
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
                  <p className="hp-step-desc">Pick from existing ecosystem models or start fresh from a templates with pre-defined VAST states.</p>
                </div>
              </div>
              <div className="hp-step-item">
                <div className="hp-step-num" aria-hidden="true">3</div>
                <div className="hp-step-body">
                  <div className="hp-step-title">Build Your State Transition Graph</div>
                  <p className="hp-step-desc">Add vegetation states, classify them with VAST codes, then draw transitions annotated with timing, likelihood, and drivers.</p>
                </div>
              </div>
              <div className="hp-step-item">
                <div className="hp-step-num" aria-hidden="true">4</div>
                <div className="hp-step-body">
                  <div className="hp-step-title">Collaborate &amp; Refine</div>
                  <p className="hp-step-desc">Invite your team. Watch live cursors move, see node locks appear, and save named milestones as your model evolves.</p>
                </div>
              </div>
              <div className="hp-step-item">
                <div className="hp-step-num" aria-hidden="true">5</div>
                <div className="hp-step-body">
                  <div className="hp-step-title">Export &amp; Share</div>
                  <p className="hp-step-desc">Export your model as EKS JSON for use in other VAST-compatible tools. Compare versions before finalising for stakeholder sign-off.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ VAST SYSTEM ══ */}
        <section className="hp-vast-wrap" id="vast" aria-labelledby="hp-vast-heading">
          <div className="hp-section">
            <div className="hp-vast-grid">
              <div className="hp-vast-text">
                <div className="hp-section-label">Classification System</div>
                <h2 className="hp-section-heading" id="hp-vast-heading">
                  Built on Australia's<br />VAST Standard
                </h2>
                <p>
                  TERN is the only collaborative STM editor natively integrated with the Vegetation Assets,
                  States and Transitions classification framework.
                </p>
                <p>
                  The VAST system classifies Australia's vegetation into six condition classes, from fully
                  intact (Class I) to completely transformed (Class VI). Each class carries defined measurable
                  attributes: canopy height, species richness, ground cover, and more.
                </p>
                <p>
                  TERN embeds VAST directly into the editor canvas. Every state node carries its class, EKS
                  code, and attribute values. Transitions between states reflect the real ecological processes —
                  fire regimes, grazing pressure, restoration efforts — that drive vegetation change across the
                  landscape.
                </p>
              </div>

              <div className="hp-vast-visual" aria-label="VAST condition class gradient from Class I Intact to Class VI Transformed">
                <div className="hp-vast-bar" role="img" aria-label="Colour gradient from deep green to red-brown representing VAST classes I through VI" />
                <div className="hp-vast-labels">
                  {[
                    { num: 'I',   color: '#166534', label: 'Intact' },
                    { num: 'II',  color: '#16a34a', label: 'Largely\nIntact' },
                    { num: 'III', color: '#65a30d', label: 'Somewhat\nDegraded' },
                    { num: 'IV',  color: '#ca8a04', label: 'Degraded' },
                    { num: 'V',   color: '#f97316', label: 'Largely\nDegraded' },
                    { num: 'VI',  color: '#b91c1c', label: 'Transformed' },
                  ].map(({ num, color, label }) => (
                    <div className="hp-vast-class" key={num}>
                      <div className="hp-vast-class-num" style={{ color }}>{num}</div>
                      <div className="hp-vast-class-label">{label.split('\n').map((l, i) => (
                        <span key={i}>{l}{i === 0 && label.includes('\n') ? <br /> : null}</span>
                      ))}</div>
                    </div>
                  ))}
                </div>

                <div className="hp-vast-node-examples">
                  <div className="hp-vast-node-header">Example State Nodes</div>
                  <div className="hp-vast-node-tags">
                    {[
                      { label: 'A1 · Pristine',  bg: '#166534' },
                      { label: 'A2 · Intact',    bg: '#16a34a' },
                      { label: 'B1 · Modified',  bg: '#65a30d' },
                      { label: 'B2 · Degraded',  bg: '#ca8a04' },
                      { label: 'C1 · Severely',  bg: '#f97316' },
                      { label: 'C2 · Bare',      bg: '#b91c1c' },
                    ].map(({ label, bg }) => (
                      <span key={label} className="hp-vast-tag" style={{ background: bg }}>{label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ══ FINAL CTA ══ */}
        <section className="hp-cta-wrap" aria-labelledby="hp-cta-heading">
          <div className="hp-section hp-cta-inner">
            <h2 className="hp-cta-headline" id="hp-cta-heading">Ready to Map Your Ecosystem?</h2>
            <p className="hp-cta-sub">
              Join ecologists and land managers already using TERN to build collaborative, VAST-compliant
              state transition models.
            </p>
            <div className="hp-cta-actions">
              <button className="hp-btn-cta-primary" aria-label="Create a free TERN account" onClick={goToEditor}>
                Create a Free Account
              </button>
              <button className="hp-btn-cta-link" aria-label="Explore TERN as a guest" onClick={goToEditor}>
                Explore as Guest
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
              <span className="hp-footer-wordmark">TERN</span>
            </div>
            <p className="hp-footer-brand-desc">Collaborative State Transition Model editing for Australian ecologists.</p>
          </div>

          <div>
            <div className="hp-footer-col-title">Product</div>
            <nav className="hp-footer-links" aria-label="Product links">
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#features">Model Templates</a>
              <a href="#features">EKS Export</a>
            </nav>
          </div>

          <div>
            <div className="hp-footer-col-title">Resources</div>
            <nav className="hp-footer-links" aria-label="Resource links" id="docs">
              <a href="#">API Docs (Swagger)</a>
              <a href="#">GitHub — Frontend</a>
              <a href="#" aria-label="VAST System Overview (external link)">VAST System Overview ↗</a>
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
          <span className="hp-footer-bottom-left">© 2026 TERN. Built for Australian ecological science.</span>
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
