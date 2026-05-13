import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE, apiFetch } from '../app/auth/api';
import { StatsCard } from '../components/admin/StatsCard';
import { UsersTable, type User } from '../components/admin/UsersTable';
import styles from './AdminDashboard.module.css';

interface AuditLog {
  id: number;
  actor_email: string;
  action: string;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeSessions: number;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let _toastSeq = 0;

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<'dashboard' | 'users' | 'sessions'>('dashboard');

  const addToast = (type: Toast['type'], message: string) => {
    const id = ++_toastSeq;
    setToasts(prev => [...prev, { id, type, message }]);
    window.setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
  };

  useEffect(() => {
    const load = async () => {
      await Promise.allSettled([fetchStats(), fetchUsers(), fetchAuditLog()]);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStats() {
    setStatsLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/stats`);
      if (!res.ok) throw new Error(`Failed to load stats (${res.status})`);
      setStats(await res.json());
    } catch (err) {
      setGlobalError((err as Error).message);
    } finally {
      setStatsLoading(false);
    }
  }

  async function fetchUsers() {
    setUsersLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/users`);
      if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
      const data = await res.json();
      setUsers(data?.users ?? []);
    } catch (err) {
      setGlobalError((err as Error).message);
    } finally {
      setUsersLoading(false);
    }
  }

  async function fetchAuditLog() {
    setAuditLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/audit-log`);
      if (!res.ok) throw new Error(`Audit log: ${res.status}`);
      const data = await res.json();
      setAuditLogs(data?.logs ?? []);
    } catch {
      // Non-critical — silently show empty state
    } finally {
      setAuditLoading(false);
    }
  }

  const handleRoleChange = async (userId: number, role: string) => {
    setUsersError(null);
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error(`Failed to update role (${res.status})`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as User['role'] } : u));
      addToast('success', 'Role updated successfully');
    } catch (err) {
      setUsersError((err as Error).message);
      addToast('error', (err as Error).message);
    }
  };

  const handleRevokeSession = async (userId: number) => {
    setUsersError(null);
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/users/${userId}/sessions`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Failed to revoke session (${res.status})`);
      addToast('success', 'Session revoked successfully');
    } catch (err) {
      setUsersError((err as Error).message);
      addToast('error', (err as Error).message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setUsersError(null);
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Failed to delete user (${res.status})`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      addToast('success', 'User deleted successfully');
    } catch (err) {
      setUsersError((err as Error).message);
      addToast('error', (err as Error).message);
    }
  };

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== Sidebar ===== */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <img
            src="/tern.png"
            alt="TERN"
            className={styles.sidebarLogo}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
          <div className={styles.sidebarBrand}>
            <span className={styles.sidebarTitle}>Ecosystem Model Studio</span>
            <span className={styles.sidebarSubtitle}>Admin Panel</span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Admin navigation">
          <button
            className={`${styles.navLink} ${activeNav === 'dashboard' ? styles.navLinkActive : ''}`}
            onClick={() => { setActiveNav('dashboard'); scrollTo('section-stats'); }}
          >
            <IconDashboard />
            Dashboard
          </button>
          <button
            className={`${styles.navLink} ${activeNav === 'users' ? styles.navLinkActive : ''}`}
            onClick={() => { setActiveNav('users'); scrollTo('section-users'); }}
          >
            <IconUsers />
            Users
          </button>
          <button
            className={`${styles.navLink} ${activeNav === 'sessions' ? styles.navLinkActive : ''}`}
            onClick={() => { setActiveNav('sessions'); scrollTo('section-audit'); }}
          >
            <IconClock />
            Sessions
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/editor" className={styles.backLink}>
            <IconChevronLeft />
            Back to Editor
          </Link>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <main className={styles.main}>
        {/* Mobile top bar */}
        <div className={styles.mobileHeader}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <span /><span /><span />
          </button>
          <span className={styles.mobileTitle}>Admin Panel</span>
        </div>

        {/* Page heading */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSubtitle}>Manage users, roles, and review audit activity.</p>
        </div>

        {/* Global data-fetch error */}
        {globalError && (
          <div className={styles.errorBanner}>
            <span>{globalError}</span>
            <button className={styles.dismissBtn} onClick={() => setGlobalError(null)} aria-label="Dismiss">✕</button>
          </div>
        )}

        {/* ===== Stats ===== */}
        <section id="section-stats" className={styles.section}>
          <h2 className={styles.sectionTitle}>Overview</h2>
          <div className={styles.statsGrid}>
            <StatsCard
              icon={<IconUsersGold />}
              value={stats?.totalUsers ?? 0}
              label="Total Users"
              loading={statsLoading}
            />
            <StatsCard
              icon={<IconCheckGold />}
              value={stats?.verifiedUsers ?? 0}
              label="Verified Users"
              loading={statsLoading}
            />
            <StatsCard
              icon={<IconAlertGold />}
              value={stats?.unverifiedUsers ?? 0}
              label="Unverified Users"
              loading={statsLoading}
            />
            <StatsCard
              icon={<IconClockGold />}
              value={stats?.activeSessions ?? 0}
              label="Active Sessions"
              loading={statsLoading}
            />
          </div>
        </section>

        {/* ===== Users table ===== */}
        <section id="section-users" className={styles.section}>
          <h2 className={styles.sectionTitle}>Users Management</h2>
          {usersError && (
            <div className={styles.errorBanner}>
              <span>{usersError}</span>
              <button className={styles.dismissBtn} onClick={() => setUsersError(null)} aria-label="Dismiss">✕</button>
            </div>
          )}
          <UsersTable
            users={users}
            loading={usersLoading}
            onRoleChange={handleRoleChange}
            onRevokeSession={handleRevokeSession}
            onDeleteUser={handleDeleteUser}
          />
        </section>

        {/* ===== Audit log ===== */}
        <section id="section-audit" className={styles.section}>
          <h2 className={styles.sectionTitle}>Audit Log</h2>
          <div style={{
            background: '#ffffff',
            border: '1px solid #eaecf0',
            borderRadius: 8,
            boxShadow: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
            overflow: 'hidden',
          }}>
            {auditLoading ? (
              <div className={styles.auditLoading}>Loading audit log…</div>
            ) : auditLogs.length === 0 ? (
              <div className={styles.auditEmpty}>No audit log entries found.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.auditTable}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, i) => (
                      <tr
                        key={log.id}
                        className={i % 2 === 0 ? styles.auditRowEven : styles.auditRowOdd}
                      >
                        <td style={{ whiteSpace: 'nowrap', color: '#475467', fontVariantNumeric: 'tabular-nums' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={{ color: '#101828', fontWeight: 500 }}>{log.actor_email}</td>
                        <td style={{ color: '#475467' }}>{log.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ===== Toasts ===== */}
      <div className={styles.toastContainer} role="status" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${styles.toast} ${t.type === 'success' ? styles.toastSuccess : styles.toastError}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Inline SVG icons ===== */

function IconDashboard() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconUsersGold() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#175cd3" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCheckGold() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#027a48" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconAlertGold() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b54708" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconClockGold() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5925dc" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
