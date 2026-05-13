import React, { useState, useMemo } from 'react';
import { ConfirmModal, type ConfirmModalProps } from './ConfirmModal';
import { GLOBAL_ROLES, type GlobalRole } from '../../constants/roles';

export interface User {
  id: number;
  name: string;
  email: string;
  role: GlobalRole;
  is_verified: boolean;
  created_at: string;
}

interface UsersTableProps {
  users: User[];
  loading: boolean;
  onRoleChange: (userId: number, role: string) => Promise<void>;
  onRevokeSession: (userId: number) => Promise<void>;
  onDeleteUser: (userId: number) => Promise<void>;
}

const PAGE_SIZE = 10;

const ROLE_BADGE: Record<User['role'], React.CSSProperties> = {
  [GLOBAL_ROLES.ADMIN]:  { background: '#ecfdf3', color: '#027a48', borderColor: '#abefc6' },
  [GLOBAL_ROLES.EDITOR]: { background: '#eff8ff', color: '#175cd3', borderColor: '#b2ddff' },
  [GLOBAL_ROLES.VIEWER]: { background: '#f4f3ff', color: '#5925dc', borderColor: '#d9d6fe' },
};

export function UsersTable({ users, loading, onRoleChange, onRevokeSession, onDeleteUser }: UsersTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | User['role']>('All');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<Record<number, Record<string, boolean>>>({});
  const [confirm, setConfirm] = useState<Omit<ConfirmModalProps, 'open'> | null>(null);

  const setOp = (userId: number, action: string, val: boolean) => {
    setActionLoading(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] ?? {}), [action]: val },
    }));
  };

  const isOp = (userId: number, action: string) => actionLoading[userId]?.[action] ?? false;

  const filtered = useMemo(() => {
    let result = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        (u.name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'All') result = result.filter(u => u.role === roleFilter);
    return result;
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageUsers = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);
  const adminCount = users.filter(user => user.role === GLOBAL_ROLES.ADMIN).length;

  const execRoleChange = async (userId: number, role: string) => {
    setOp(userId, 'role', true);
    try { await onRoleChange(userId, role); } finally { setOp(userId, 'role', false); }
  };

  const handleRoleChange = (user: User, role: string) => {
    setConfirm({
      title: 'Change Role',
      description: (
        <>
          You are about to change the role of <strong>{user.email}</strong> from{' '}
          <strong>{user.role}</strong> to <strong>{role}</strong>. This will immediately
          update their permissions across the platform.
        </>
      ),
      confirmLabel: 'Change Role',
      cancelLabel: 'Cancel',
      variant: 'warning',
      onConfirm: () => { setConfirm(null); execRoleChange(user.id, role); },
      onCancel: () => setConfirm(null),
    });
  };

  const handleRevoke = (user: User) => {
    setConfirm({
      title: 'Revoke Session',
      description: (
        <>
          You are about to revoke all active sessions for <strong>{user.email}</strong>.
          They will be immediately signed out and will need to log in again to continue.
        </>
      ),
      confirmLabel: 'Revoke Session',
      cancelLabel: 'Cancel',
      variant: 'warning',
      onConfirm: async () => {
        setConfirm(null);
        setOp(user.id, 'revoke', true);
        try { await onRevokeSession(user.id); } finally { setOp(user.id, 'revoke', false); }
      },
      onCancel: () => setConfirm(null),
    });
  };

  const handleDelete = (user: User) => {
    setConfirm({
      title: 'Delete User',
      description: (
        <>
          You are about to permanently delete <strong>{user.email}</strong>. This will
          remove their account, all associated data, and revoke any active sessions.{' '}
          <strong>This action cannot be undone.</strong>
        </>
      ),
      confirmLabel: 'Delete User',
      cancelLabel: 'Keep User',
      variant: 'danger',
      onConfirm: async () => {
        setConfirm(null);
        setOp(user.id, 'delete', true);
        try { await onDeleteUser(user.id); } finally { setOp(user.id, 'delete', false); }
      },
      onCancel: () => setConfirm(null),
    });
  };

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #eaecf0',
      borderRadius: 8,
      boxShadow: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
      overflow: 'hidden',
    }}>

      {/* ── Controls ── */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #eaecf0',
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
        background: '#f9fafb',
      }}>
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={inputStyle}
        />
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value as typeof roleFilter); setPage(1); }}
          style={{ ...inputStyle, flex: 'none', width: 'auto', minWidth: 136 }}
        >
          <option value="All">All roles</option>
          <option value={GLOBAL_ROLES.VIEWER}>{GLOBAL_ROLES.VIEWER}</option>
          <option value={GLOBAL_ROLES.EDITOR}>{GLOBAL_ROLES.EDITOR}</option>
          <option value={GLOBAL_ROLES.ADMIN}>{GLOBAL_ROLES.ADMIN}</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #eaecf0' }}>
              {['Name', 'Email', 'Role', 'Verified', 'Joined', 'Actions'].map(col => (
                <th key={col} style={thStyle}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eaecf0' }}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={tdStyle}>
                      <div style={{
                        height: 14,
                        background: '#eaecf0',
                        borderRadius: 4,
                        width: j === 5 ? 160 : '65%',
                        animation: 'skeletonPulse 1.4s ease-in-out infinite',
                        animationDelay: `${i * 0.08}s`,
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '48px 20px', color: '#475467' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              pageUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eaecf0' }}>
                  <td style={{ ...tdStyle, fontWeight: 500, color: '#101828' }}>{user.name}</td>
                  <td style={{ ...tdStyle, color: '#475467' }}>{user.email}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ ...roleBadgeBase, ...ROLE_BADGE[user.role] }}>
                        {user.role}
                      </span>
                      {(() => {
                        const isLastAdmin = user.role === GLOBAL_ROLES.ADMIN && adminCount === 1;
                        return (
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user, e.target.value)}
                        disabled={isOp(user.id, 'role') || isLastAdmin}
                        title={isLastAdmin ? 'Cannot change — this is the last Admin' : undefined}
                        aria-label={`Change role for ${user.name}`}
                        style={{
                          padding: '3px 6px',
                          borderRadius: 6,
                          border: '1px solid #eaecf0',
                          background: '#ffffff',
                          color: '#475467',
                          fontSize: 12,
                          cursor: isOp(user.id, 'role') || isLastAdmin ? 'not-allowed' : 'pointer',
                          opacity: isOp(user.id, 'role') || isLastAdmin ? 0.5 : 1,
                          fontFamily: 'inherit',
                        }}
                      >
                        <option value={GLOBAL_ROLES.VIEWER}>{GLOBAL_ROLES.VIEWER}</option>
                        <option value={GLOBAL_ROLES.EDITOR}>{GLOBAL_ROLES.EDITOR}</option>
                        <option value={GLOBAL_ROLES.ADMIN}>{GLOBAL_ROLES.ADMIN}</option>
                      </select>
                        );
                      })()}
                      {isOp(user.id, 'role') && <Spinner color="#475467" />}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {user.is_verified ? (
                      <span style={{ ...badgeBase, background: '#ecfdf3', color: '#027a48', borderColor: '#abefc6' }}>
                        ✓ Verified
                      </span>
                    ) : (
                      <span style={{ ...badgeBase, background: '#fffaeb', color: '#b54708', borderColor: '#fedf89' }}>
                        ⏳ Pending
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: '#475467', whiteSpace: 'nowrap' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        onClick={() => handleRevoke(user)}
                        disabled={isOp(user.id, 'revoke')}
                        style={secondaryBtn(isOp(user.id, 'revoke'))}
                      >
                        {isOp(user.id, 'revoke') ? <><Spinner small color="#475467" /> Revoking…</> : 'Revoke'}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={isOp(user.id, 'delete')}
                        style={dangerBtn(isOp(user.id, 'delete'))}
                      >
                        {isOp(user.id, 'delete') ? <><Spinner small color="#c01048" /> Deleting…</> : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Confirm modal ── */}
      {confirm && <ConfirmModal open {...confirm} />}

      {/* ── Pagination ── */}
      {!loading && filtered.length > 0 && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #eaecf0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 13,
          color: '#475467',
          flexWrap: 'wrap',
          gap: 8,
          background: '#f9fafb',
        }}>
          <span>
            Showing {(clampedPage - 1) * PAGE_SIZE + 1}–{Math.min(clampedPage * PAGE_SIZE, filtered.length)} of {filtered.length} users
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={clampedPage <= 1}
              style={secondaryBtn(clampedPage <= 1)}
            >
              ← Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={clampedPage >= totalPages}
              style={secondaryBtn(clampedPage >= totalPages)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Spinner ── */
function Spinner({ small, color }: { small?: boolean; color: string }) {
  const size = small ? 11 : 13;
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `1.5px solid ${color}30`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'adminSpin 0.55s linear infinite',
      verticalAlign: 'middle',
      flexShrink: 0,
    }} />
  );
}

/* ── Styles ── */

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #eaecf0',
  background: '#ffffff',
  color: '#101828',
  fontSize: 14,
  outline: 'none',
  flex: 1,
  minWidth: 180,
  fontFamily: 'inherit',
  boxShadow: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
};

const thStyle: React.CSSProperties = {
  padding: '11px 16px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#475467',
  fontSize: 12,
  whiteSpace: 'nowrap',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const tdStyle: React.CSSProperties = {
  padding: '13px 16px',
  color: '#101828',
  verticalAlign: 'middle',
};

const badgeBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 16,
  fontSize: 12,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  border: '1px solid',
};

const roleBadgeBase: React.CSSProperties = {
  ...badgeBase,
  border: '1px solid',
};

const secondaryBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '5px 12px',
  background: disabled ? '#f9fafb' : '#ffffff',
  color: disabled ? '#98a2b3' : '#344054',
  border: '1px solid #eaecf0',
  borderRadius: 8,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 12,
  fontWeight: 500,
  opacity: disabled ? 0.6 : 1,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
  boxShadow: disabled ? 'none' : '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
  transition: 'background 0.1s ease',
});

const dangerBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '5px 12px',
  background: disabled ? '#f9fafb' : '#fff1f3',
  color: disabled ? '#98a2b3' : '#c01048',
  border: `1px solid ${disabled ? '#eaecf0' : '#fecdd6'}`,
  borderRadius: 8,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 12,
  fontWeight: 500,
  opacity: disabled ? 0.6 : 1,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
  boxShadow: disabled ? 'none' : '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
});
