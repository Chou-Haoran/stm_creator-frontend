import { useNavigate } from 'react-router-dom';
import { authStorage } from '../app/auth/api';

export default function Forbidden() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    authStorage.clear();
    navigate('/');
  };

  return (
    <main style={pageStyle}>
      <div style={editorBackdropStyle} aria-hidden="true">
        <div style={toolbarMockStyle}>
          {['STM', 'Add Node', 'Save Model', 'Share', 'Dashboard'].map((label) => (
            <span key={label} style={toolbarChipStyle}>{label}</span>
          ))}
        </div>
        <div style={canvasStyle}>
          <div style={{ ...nodeStyle, top: '24%', left: '18%' }}>Woodland</div>
          <div style={{ ...nodeStyle, top: '46%', left: '45%' }}>Recovery</div>
          <div style={{ ...nodeStyle, top: '66%', left: '68%' }}>Review</div>
          <div style={lineOneStyle} />
          <div style={lineTwoStyle} />
        </div>
      </div>

      <section style={cardStyle} role="dialog" aria-labelledby="forbidden-title">
        <div style={badgeStyle}>403</div>
        <h1 id="forbidden-title" style={titleStyle}>
          You don't have permission to access this resource
        </h1>
        <p style={copyStyle}>
          This session does not have access to the requested model or workspace area.
        </p>
        <div style={actionsStyle}>
          <button type="button" onClick={() => navigate(-1)} style={secondaryButtonStyle}>
            Go back
          </button>
          <button type="button" onClick={handleGoHome} style={primaryButtonStyle}>
            Go home
          </button>
        </div>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  position: 'relative',
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  overflow: 'hidden',
  background: '#0f172a',
};

const editorBackdropStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  filter: 'blur(7px)',
  transform: 'scale(1.03)',
  opacity: 0.65,
  background: '#eef8f3',
};

const toolbarMockStyle: React.CSSProperties = {
  height: 64,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 22px',
  background: '#ffffff',
  borderBottom: '1px solid #dbe7df',
};

const toolbarChipStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  background: '#ecfdf5',
  color: '#065f46',
  fontSize: 13,
  fontWeight: 600,
};

const canvasStyle: React.CSSProperties = {
  position: 'relative',
  height: 'calc(100vh - 64px)',
  backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
  backgroundSize: '22px 22px',
};

const nodeStyle: React.CSSProperties = {
  position: 'absolute',
  padding: '18px 24px',
  borderRadius: 8,
  background: '#ffffff',
  border: '2px solid #10b981',
  boxShadow: '0 18px 42px rgba(15, 23, 42, 0.18)',
  color: '#064e3b',
  fontWeight: 700,
};

const lineOneStyle: React.CSSProperties = {
  position: 'absolute',
  top: '37%',
  left: '31%',
  width: '24%',
  height: 3,
  background: '#14b8a6',
  transform: 'rotate(20deg)',
};

const lineTwoStyle: React.CSSProperties = {
  position: 'absolute',
  top: '58%',
  left: '55%',
  width: '18%',
  height: 3,
  background: '#f59e0b',
  transform: 'rotate(24deg)',
};

const cardStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  width: 520,
  maxWidth: '100%',
  padding: 28,
  textAlign: 'center',
  borderRadius: 10,
  background: 'rgba(255, 255, 255, 0.92)',
  border: '1px solid rgba(255, 255, 255, 0.75)',
  boxShadow: '0 24px 80px rgba(15, 23, 42, 0.34)',
  backdropFilter: 'blur(14px)',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 58,
  height: 58,
  marginBottom: 14,
  borderRadius: 999,
  background: '#fff7ed',
  color: '#c2410c',
  fontWeight: 800,
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: 28,
  lineHeight: 1.15,
  color: '#0f172a',
};

const copyStyle: React.CSSProperties = {
  margin: 0,
  color: '#475569',
  fontSize: 14,
  lineHeight: 1.6,
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 12,
  marginTop: 24,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#0f172a',
  cursor: 'pointer',
  fontWeight: 600,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#059669',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 700,
};
