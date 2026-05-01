import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup, resendVerification, authStorage, ApiError, type AuthResponse } from './api';
import { ModelSelectionModal } from '../components/ModelSelectionModal';
import EcosystemPanel from './EcosystemPanel';

const TERN_TEAL = '#10b981';
const TERN_CHARCOAL = '#3D5060';

type Props = {
  readonly onAuthenticated: (auth: AuthResponse) => void;
  readonly onContinueGuest: () => void;
  readonly onModelSelected?: (modelName: string, isNew: boolean) => void;
};

// --- UI Helper Components (Keeping your design) ---

function AField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11.5, fontWeight: 500, color: '#52525b', letterSpacing: '0.01em' }}>{label}</label>
      {children}
    </div>
  );
}

function APrimaryBtn({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="submit"
      disabled={loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '12px 0', width: '100%', marginTop: 4,
        backgroundColor: loading ? '#a1a1aa' : hov ? '#2e9a95' : TERN_TEAL,
        color: 'white', border: 'none', borderRadius: 7,
        fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'IBM Plex Sans, sans-serif', transition: 'background 0.15s',
        letterSpacing: '0.01em',
      }}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}

// --- Main Page Component ---

export default function AuthPage({ onAuthenticated, onContinueGuest, onModelSelected }: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [mounted, setMounted] = useState(false);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<AuthResponse | null>(null);

  useEffect(() => { 
    const t = setTimeout(() => setMounted(true), 60); 
    return () => clearTimeout(t); 
  }, []);

  const trans = (delay = 0): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(12px)',
    transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
  });

  const handleAuthenticated = (auth: AuthResponse) => {
    setPendingAuth(auth);
    setShowModelSelection(true);
  };

  const handleModelSelected = (modelName: string, isNew: boolean) => {
    setShowModelSelection(false);
    if (onModelSelected) onModelSelected(modelName, isNew);
    if (pendingAuth) { 
        onAuthenticated(pendingAuth); 
        setPendingAuth(null); 
    }
  };

  const handleCloseModelSelection = () => {
    setShowModelSelection(false);
    if (pendingAuth) { 
        onAuthenticated(pendingAuth); 
        setPendingAuth(null); 
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'IBM Plex Sans, sans-serif', overflow: 'hidden' }}>
      <style>{`
        .auth-input::placeholder { color:#a1a1aa; }
        .auth-tab-btn:hover { color: ${TERN_CHARCOAL} !important; }
        .auth-guest:hover { color: ${TERN_CHARCOAL} !important; }
        @media (max-width: 768px) {
          .auth-left { width: 100% !important; min-width: unset !important; padding: 36px 28px !important; }
          .auth-right-panel { display: none !important; }
        }
      `}</style>

      {/* LEFT: Form Section */}
      <div className="auth-left" style={{ width: '46%', minWidth: 380, backgroundColor: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', padding: '44px 64px', overflowY: 'auto' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute', top: 24, left: 32,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#a1a1aa', fontFamily: 'IBM Plex Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px',
            borderRadius: 6, transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = TERN_CHARCOAL; (e.currentTarget as HTMLButtonElement).style.background = '#f4f4f5'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
        >
          ← Home
        </button>

        <div style={{ maxWidth: 360 }}>
          <div style={trans(80)}>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: TERN_CHARCOAL, margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {tab === 'login' ? 'Welcome back.' : 'Create account.'}
            </h1>
            <p style={{ fontSize: 14, color: '#71717a', margin: '0 0 28px', lineHeight: 1.55 }}>
              {tab === 'login' ? 'Sign in to your workspace.' : 'Start building state transition models today.'}
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', marginBottom: 26, ...trans(120) }}>
            {(['login', 'signup'] as const).map((k) => (
              <button
                key={k}
                className="auth-tab-btn"
                onClick={() => setTab(k)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
                  marginRight: 24, fontSize: 13.5, fontFamily: 'IBM Plex Sans, sans-serif',
                  fontWeight: tab === k ? 600 : 400,
                  color: tab === k ? TERN_CHARCOAL : '#a1a1aa',
                  borderBottom: `2px solid ${tab === k ? TERN_TEAL : 'transparent'}`,
                  marginBottom: -1, transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {k === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div style={trans(160)}>
            {tab === 'login' ? (
              <LoginForm onAuthenticated={handleAuthenticated} />
            ) : (
              <SignupForm onAuthenticated={handleAuthenticated} />
            )}
          </div>

          <div style={{ marginTop: 20, ...trans(240) }}>
            <button className="auth-guest" onClick={onContinueGuest} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5,
              color: '#a1a1aa', fontFamily: 'IBM Plex Sans, sans-serif', padding: 0, transition: 'color 0.15s',
            }}>
              Continue as Guest →
            </button>
          </div>
        </div>

        <p style={{ position: 'absolute', bottom: 28, left: 64, fontSize: 11, color: '#d4d4d8', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em', ...trans(0) }}>
          State and Transition Model Creator · v2.4.1
        </p>
      </div>

      {/* RIGHT: Live ecosystem STM panel (Your new feature) */}
      <div className="auth-right-panel" style={{ flex: 1, backgroundColor: '#f8fafc', overflow: 'hidden' }}>
        <EcosystemPanel />
      </div>

      {/* Modal logic from the main branch */}
      <ModelSelectionModal
        isOpen={showModelSelection}
        onClose={handleCloseModelSelection}
        onCreateNew={(modelName) => handleModelSelected(modelName, true)}
        onLoadExisting={(modelName) => handleModelSelected(modelName, false)}
      />
    </div>
  );
}

// --- Form Components (Refined with shared styles) ---

function LoginForm({ onAuthenticated }: { readonly onAuthenticated: (auth: AuthResponse) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const inputStyle = (id: string): React.CSSProperties => ({
    width: '100%', padding: '11px 14px', fontSize: 14,
    fontFamily: 'IBM Plex Sans, sans-serif', color: TERN_CHARCOAL,
    border: `1.5px solid ${focused === id ? TERN_TEAL : '#e4e4e7'}`,
    borderRadius: 7, outline: 'none', backgroundColor: 'white',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);
    setLoading(true);
    try {
      const auth = await login(email, password);
      authStorage.save(auth);
      onAuthenticated(auth);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'AUTH_UNVERIFIED') {
        setIsUnverified(true);
      } else {
        setError((err as Error).message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AField label="Email">
        <input className="auth-input" type="email" required style={inputStyle('l-e')} value={email}
          placeholder="researcher@institution.edu"
          onFocus={() => setFocused('l-e')} onBlur={() => setFocused(null)}
          onChange={e => setEmail(e.target.value)} />
      </AField>
      <AField label="Password">
        <input className="auth-input" type="password" required style={inputStyle('l-p')} value={password}
          placeholder="••••••••"
          onFocus={() => setFocused('l-p')} onBlur={() => setFocused(null)}
          onChange={e => setPassword(e.target.value)} />
      </AField>
      {error && <p style={{ color: '#ef4444', fontSize: 12.5, margin: 0 }}>{error}</p>}
      {isUnverified && (
        <div style={{ padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, border: '1px solid #fee2e2' }}>
            <p style={{ color: '#991b1b', fontSize: 12, margin: '0 0 8px' }}>Email not verified.</p>
            <button type="button" onClick={() => resendVerification(email)} style={{ fontSize: 12, color: TERN_TEAL, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Resend link</button>
        </div>
      )}
      <APrimaryBtn loading={loading}>Login</APrimaryBtn>
    </form>
  );
}

function SignupForm({ onAuthenticated }: { readonly onAuthenticated: (auth: AuthResponse) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Editor');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const inputStyle = (id: string): React.CSSProperties => ({
    width: '100%', padding: '11px 14px', fontSize: 14,
    fontFamily: 'IBM Plex Sans, sans-serif', color: TERN_CHARCOAL,
    border: `1.5px solid ${focused === id ? TERN_TEAL : '#e4e4e7'}`,
    borderRadius: 7, outline: 'none', backgroundColor: 'white',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(name, email, password, role);
      setSentTo(email);
    } catch (err) {
      setError((err as Error).message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <p style={{ fontWeight: 600, color: TERN_CHARCOAL }}>Check your inbox</p>
        <p style={{ fontSize: 14, color: '#71717a' }}>Link sent to {sentTo}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AField label="Full Name">
        <input className="auth-input" type="text" required style={inputStyle('s-n')} value={name}
          placeholder="Dr. Jane Smith"
          onFocus={() => setFocused('s-n')} onBlur={() => setFocused(null)}
          onChange={e => setName(e.target.value)} />
      </AField>
      <AField label="Email">
        <input className="auth-input" type="email" required style={inputStyle('s-e')} value={email}
          placeholder="researcher@institution.edu"
          onFocus={() => setFocused('s-e')} onBlur={() => setFocused(null)}
          onChange={e => setEmail(e.target.value)} />
      </AField>
      <AField label="Password">
        <input className="auth-input" type="password" required minLength={8} style={inputStyle('s-p')} value={password}
          placeholder="••••••••"
          onFocus={() => setFocused('s-p')} onBlur={() => setFocused(null)}
          onChange={e => setPassword(e.target.value)} />
      </AField>
      <AField label="Role">
        <select style={{ ...inputStyle('s-r'), cursor: 'pointer' }} value={role} onChange={e => setRole(e.target.value)}>
          <option>Viewer</option>
          <option>Editor</option>
          <option>Admin</option>
        </select>
      </AField>
      {error && <p style={{ color: '#ef4444', fontSize: 12.5, margin: 0 }}>{error}</p>}
      <APrimaryBtn loading={loading}>Create Account</APrimaryBtn>
    </form>
  );
}