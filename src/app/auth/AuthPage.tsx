import { useState } from 'react';
import { login, signup, authStorage, type AuthResponse } from './api';
import { ModelSelectionModal } from '../components/ModelSelectionModal';

type Props = {
  readonly onAuthenticated: (auth: AuthResponse) => void;
  readonly onContinueGuest: () => void;
  readonly onModelSelected?: (modelName: string, isNew: boolean) => void;
};

export default function AuthPage({ onAuthenticated, onContinueGuest, onModelSelected }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [hasLogo, setHasLogo] = useState(true);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<AuthResponse | null>(null);

  const handleAuthenticated = (auth: AuthResponse) => {
    setPendingAuth(auth);
    setShowModelSelection(true);
  };

  const handleModelSelected = (modelName: string, isNew: boolean) => {
    setShowModelSelection(false);
    if (onModelSelected) {
      onModelSelected(modelName, isNew);
    }
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
    <div style={container}>
      <div style={hero}>
        {hasLogo ? (
          <img
            src="/tern.png"
            alt="TERN logo"
            style={logoImg}
            onError={() => setHasLogo(false)}
          />
        ) : (
          <div style={logoCircle}><span aria-hidden>🌿</span></div>
        )}
        <h1 style={title}>Ecosystem Model Studio</h1>
        <p style={subtitle}>State-transition modeling for landscapes and ecosystems</p>
      </div>
      <div style={card}>
        <div style={tabs}>
          <button style={mode === 'login' ? tabActive : tab} onClick={() => setMode('login')}>Login</button>
          <button style={mode === 'signup' ? tabActive : tab} onClick={() => setMode('signup')}>Sign Up</button>
        </div>
        {mode === 'login' ? (
          <LoginForm onAuthenticated={handleAuthenticated} />
        ) : (
          <SignupForm onAuthenticated={handleAuthenticated} />
        )}
        <div style={divider}><span style={dividerLine} /> or <span style={dividerLine} /></div>
        <button style={ghostBtn} onClick={onContinueGuest}>
          Continue as Guest
        </button>
      </div>
      
      <ModelSelectionModal
        isOpen={showModelSelection}
        onClose={handleCloseModelSelection}
        onCreateNew={(modelName) => handleModelSelected(modelName, true)}
        onLoadExisting={(modelName) => handleModelSelected(modelName, false)}
      />
    </div>
  );
}

function LoginForm({ onAuthenticated }: { readonly onAuthenticated: (auth: AuthResponse) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await login(email, password);
      authStorage.save(auth);
      onAuthenticated(auth);
    } catch (err) {
      setError((err as Error).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="login-email" style={label}>Email</label>
      <input id="login-email" style={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="login-password" style={label}>Password</label>
      <input id="login-password" style={input} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <div style={errorBox}>{error}</div>}
      <button style={primaryBtn} disabled={loading} type="submit">{loading ? 'Logging in…' : 'Login'}</button>
    </form>
  );
}

function SignupForm({ onAuthenticated }: { readonly onAuthenticated: (auth: AuthResponse) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('Viewer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await signup(name, email, password, role);
      authStorage.save(auth);
      onAuthenticated(auth);
    } catch (err) {
      setError((err as Error).message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="signup-name" style={label}>Name</label>
      <input id="signup-name" style={input} type="text" required value={name} onChange={(e) => setName(e.target.value)} />
      <label htmlFor="signup-email" style={label}>Email</label>
      <input id="signup-email" style={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="signup-password" style={label}>Password</label>
      <input id="signup-password" style={input} type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      <label htmlFor="signup-role" style={label}>Role (optional)</label>
      <select id="signup-role" style={input} value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="Viewer">Viewer</option>
        <option value="Editor">Editor</option>
        <option value="Admin">Admin</option>
      </select>
      {error && <div style={errorBox}>{error}</div>}
      <button style={primaryBtn} disabled={loading} type="submit">{loading ? 'Creating…' : 'Create account'}</button>
    </form>
  );
}

const container: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  minHeight: '100vh',
  padding: 24,
  background: 'linear-gradient(180deg, #ecfdf5 0%, #f0fdf4 60%, #ffffff 100%)',
};

const hero: React.CSSProperties = {
  marginTop: 24,
  marginBottom: 16,
  textAlign: 'center',
  color: '#064e3b',
};

const logoCircle: React.CSSProperties = {
  width: 68,
  height: 68,
  borderRadius: '12px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#fff',
  border: '2px solid #CDAE6B',
  color: '#065f46',
  fontSize: 28,
  boxShadow: '0 8px 18px rgba(205,174,107,0.25)'
};

const logoImg: React.CSSProperties = {
  height: 56,
  width: 'auto',
  objectFit: 'contain',
  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))'
};

const title: React.CSSProperties = {
  marginTop: 12,
  marginBottom: 4,
  fontSize: 24,
  fontWeight: 700,
  color: '#064e3b',
};

const subtitle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: '#065f46',
};

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: '#ffffff',
  border: '1px solid #bbf7d0',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 10px 30px rgba(16,185,129,0.10)'
};

const tabs: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 16,
};

const tab: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  background: '#ffffff',
  color: '#065f46',
  border: '1px solid #bbf7d0',
  borderRadius: 10,
  cursor: 'pointer',
};

const tabActive: React.CSSProperties = {
  ...tab,
  background: '#FFF7E6',
  color: '#4a3c12',
  borderColor: '#F0D9A6',
  fontWeight: 600,
};

const label: React.CSSProperties = {
  display: 'block',
  color: '#065f46',
  marginTop: 12,
  marginBottom: 6,
  fontSize: 13,
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #F0D9A6',
  background: '#ffffff',
  color: '#065f46',
  outline: 'none',
};

const primaryBtn: React.CSSProperties = {
  width: '100%',
  marginTop: 16,
  padding: '10px 12px',
  background: 'linear-gradient(135deg, #CDAE6B, #A6812D)',
  color: '#2f2819',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 600,
};

const errorBox: React.CSSProperties = {
  marginTop: 10,
  padding: 10,
  background: 'rgba(127, 29, 29, 0.08)',
  color: '#7f1d1d',
  borderRadius: 6,
  border: '1px solid #ef4444',
};

const divider: React.CSSProperties = {
  marginTop: 16,
  marginBottom: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  color: '#065f46',
  fontSize: 12,
};

const dividerLine: React.CSSProperties = {
  display: 'inline-block',
  height: 1,
  width: '40%',
  background: 'linear-gradient(90deg, rgba(205,174,107,0.0), rgba(205,174,107,0.7), rgba(205,174,107,0.0))',
};

const ghostBtn: React.CSSProperties = {
  width: '100%',
  marginTop: 8,
  padding: '10px 12px',
  background: '#ffffff',
  color: '#4a3c12',
  border: '1px dashed #E7D2A2',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 500,
};
