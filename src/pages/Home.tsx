import { useEffect, useState } from 'react';
import './Home.css';

const Home = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="wrapper">
      <header className="header" role="banner">
        <div className="container">
          <nav className="nav" aria-label="Primary">
            <div className="brand">
              <img 
                src="/tern.png" 
                alt="State & Transition Model Creator logo" 
                className="logo"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <strong aria-label="Product name" className="brand-text">
                State & Transition Model Creator
              </strong>
            </div>
            <div className="menu">
              <a href="#features" className="menu-link">Features</a>
              <a href="#how" className="menu-link">How it works</a>
              <a href="#tech" className="menu-link">Tech</a>
              <a className="btn btn-primary" href="/editor">Get Started</a>
            </div>
          </nav>
        </div>
      </header>

      <main id="main" className="container" role="main">
        <section className="hero" id="start">
          <div className="hero-content">
            <span className="badge" aria-label="Project lineage">
              Built on the Ecological Knowledge System (EKS)
            </span>
            <h1 className="h1">
              Design, edit & share ecological{' '}
              <span className="gradient">State & Transition Models</span>
            </h1>
            <p className="lead">
              An intuitive web app to visually create STM graphs, annotate states & transitions 
              with metadata, query models, and persist changes straight to PostgreSQL via a robust API.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="/editor" aria-label="Launch interactive demo">
                Try the demo
              </a>
              <a className="btn btn-secondary" href="#docs" aria-label="Read the documentation">
                Read docs
              </a>
            </div>
          </div>
          <div className="panel" aria-label="Illustration">
            <STMVisualization />
          </div>
        </section>

        <section className="section" id="features" aria-labelledby="features-title">
          <p className="kicker" id="features-title">Why STM Creator</p>
          <div className="card-grid">
            <FeatureCard 
              title="Visual graph editor" 
              description="Create and connect ecological states with drag-and-drop nodes and directional transitions."
            />
            <FeatureCard 
              title="Rich metadata" 
              description="Attach evidence, indicators, drivers, and provenance to nodes and edges for transparent decisions."
            />
            <FeatureCard 
              title="Direct to PostgreSQL" 
              description="Persist changes through a secure API that speaks natively to your EKS-aligned schema."
            />
            <FeatureCard 
              title="Query & validate" 
              description="Filter by conditions (e.g., rainfall, land use, confidence) and run rule-based checks."
            />
            <FeatureCard 
              title="Collaboration" 
              description="Project spaces, version history, and shareable links for reviews and workshops."
            />
            <FeatureCard 
              title="Interoperability" 
              description="Import/export JSON, CSV, and PNG/SVG diagrams; align with ISO 19115 & vocabularies."
            />
          </div>
        </section>

        <section className="section" id="how" aria-labelledby="how-title">
          <p className="kicker" id="how-title">How it works</p>
          <div className="showcase">
            <div className="panel">
              <ol className="ordered-list">
                <li className="list-item"><strong>Model</strong> states & transitions in the canvas.</li>
                <li className="list-item"><strong>Annotate</strong> with drivers, indicators, evidence & uncertainty.</li>
                <li className="list-item"><strong>Query</strong> with filters & rules to test scenarios.</li>
                <li className="list-item"><strong>Persist</strong> to PostgreSQL via the API.</li>
              </ol>
              <div className="cta">
                <a className="btn btn-primary" href="/editor">Open live demo</a>
                <a className="btn btn-secondary" href="#docs">API docs</a>
              </div>
            </div>
            <pre className="code" aria-label="Example API request">
              <code>{`POST /api/v1/models
Content-Type: application/json
{
  "name": "Eucalypt Woodlands",
  "nodes": [
    {"id":"S1","label":"Grassland"},
    {"id":"S2","label":"Shrub"}
  ],
  "edges": [
    {"from":"S1","to":"S2",
     "driver":"Fire frequency ↑",
     "evidence":"Smith 2024"}
  ]
}`}</code>
            </pre>
          </div>
        </section>

        <section className="section" id="tech" aria-labelledby="tech-title">
          <p className="kicker" id="tech-title">Under the hood</p>
          <div className="feature-list">
            <TechFeature 
              icon="DB" 
              title="PostgreSQL / PostGIS" 
              description="Schema aligned to EKS STM store; spatial joins and constraints supported."
            />
            <TechFeature 
              icon="API" 
              title="TypeScript API" 
              description="REST (and optional GraphQL) endpoints for CRUD, validation & queries."
            />
            <TechFeature 
              icon="UI" 
              title="React + D3" 
              description="High-performance graph editing, zoom/pan, and keyboard-first shortcuts."
            />
            <TechFeature 
              icon="Ops" 
              title="Docker / CI" 
              description="Containerised services with CI/CD, role-based access, and audit logs."
            />
          </div>
        </section>

        <section className="section" id="cta-section" aria-labelledby="cta-title">
          <p className="kicker" id="cta-title">Ready to build</p>
          <div className="cta-panel">
            <div>
              <h2 className="h2">Start your first STM</h2>
              <p className="lead" style={{ margin: 0 }}>
                Launch the editor, import an existing model, or begin with a template.
              </p>
            </div>
            <div className="cta">
              <a className="btn btn-primary" href="/editor">Launch editor</a>
              <a className="btn btn-secondary" href="#contact">Contact us</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" role="contentinfo">
        <div className="container footer-content">
          <div>&copy; {currentYear} State & Transition Model Creator</div>
          <nav aria-label="Legal links" className="footer-nav">
            <a href="#privacy" className="footer-link">Privacy</a>
            <a href="#terms" className="footer-link">Terms</a>
            <a href="#accessibility" className="footer-link">Accessibility</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

// Component for feature cards
const FeatureCard = ({ title, description }: { title: string; description: string }) => (
  <article className="card" aria-label={title}>
    <h3 className="h3">{title}</h3>
    <p className="card-text">{description}</p>
  </article>
);

// Component for tech features
const TechFeature = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <div className="feature">
    <div className="icon">{icon}</div>
    <div>
      <strong className="feature-title">{title}</strong>
      <div className="feature-desc">{description}</div>
    </div>
  </div>
);

// STM Visualization SVG Component
const STMVisualization = () => (
  <svg viewBox="0 0 520 360" width="100%" height="100%" role="img" aria-label="Example STM graph">
    <defs>
      <linearGradient id="g1" x1="0" x2="1">
        <stop offset="0%" stopColor="#00A15D"/>
        <stop offset="100%" stopColor="#00A0B0"/>
      </linearGradient>
      <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#00B3E6"/>
      </marker>
    </defs>
    <rect x="0" y="0" width="520" height="360" rx="16" fill="url(#g1)" fillOpacity=".08"/>
    <g fill="#ffffff" stroke="#007DB3" strokeWidth="2">
      <circle cx="110" cy="110" r="34"/>
      <circle cx="270" cy="80" r="34"/>
      <circle cx="420" cy="140" r="34"/>
      <circle cx="210" cy="240" r="34"/>
      <circle cx="360" cy="280" r="34"/>
    </g>
    <g fill="#12202A" fontSize="12" fontWeight="600" textAnchor="middle">
      <text x="110" y="114">Grass</text>
      <text x="270" y="84">Shrub</text>
      <text x="420" y="144">Woodland</text>
      <text x="210" y="244">Bare</text>
      <text x="360" y="284">Restored</text>
    </g>
    <g stroke="#00B3E6" strokeWidth="3" fill="none" markerEnd="url(#arrow)">
      <path d="M144,104 C190,90 226,85 236,83"/>
      <path d="M304,90 C350,110 386,125 392,130"/>
      <path d="M260,110 C230,150 220,200 212,206"/>
      <path d="M230,240 C270,250 320,270 326,273"/>
      <path d="M350,250 C360,220 380,180 408,160"/>
    </g>
  </svg>
);

export default Home;