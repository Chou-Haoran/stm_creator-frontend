import { useEffect, useState } from 'react';

import { MODEL_ROLES, type ModelRole } from '../constants/roles';
import {
  getModelPermissions,
  removeModelPermission,
  setModelPermission,
} from '../app/api/models';

interface Props {
  readonly isOpen: boolean;
  readonly modelName: string | null;
  readonly currentModelRole: ModelRole | null;
  readonly onClose: () => void;
}

interface PermissionRow {
  email: string;
  role: ModelRole;
  granted_by?: string;
}

const EDITABLE_ROLES = [
  MODEL_ROLES.VIEWER,
  MODEL_ROLES.EDITOR,
  MODEL_ROLES.REVIEWER,
] as const;

const roleLabel = (role: ModelRole | null): string => {
  if (!role) return 'No access';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export function ModelPermissionsModal({ isOpen, modelName, currentModelRole, onClose }: Props) {
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ModelRole>(MODEL_ROLES.VIEWER);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = async () => {
    if (!modelName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getModelPermissions(modelName);
      setPermissions(Array.isArray(data?.permissions) ? data.permissions : []);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) void loadPermissions();
  }, [isOpen, modelName]);

  const updatePermission = async (email: string, role: ModelRole) => {
    if (!modelName) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await setModelPermission(modelName, email, role);
      setMessage('Permission updated.');
      await loadPermissions();
    } catch (err) {
      setError((err as Error).message || 'Failed to update permission');
    } finally {
      setSaving(false);
    }
  };

  const removePermission = async (email: string) => {
    if (!modelName) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await removeModelPermission(modelName, email);
      setMessage('Permission removed.');
      await loadPermissions();
    } catch (err) {
      setError((err as Error).message || 'Failed to remove permission');
    } finally {
      setSaving(false);
    }
  };

  const invite = async () => {
    if (!modelName || !inviteEmail.trim()) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await setModelPermission(modelName, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setInviteRole(MODEL_ROLES.VIEWER);
      setMessage('Invitation saved.');
      await loadPermissions();
    } catch (err) {
      setError((err as Error).message || 'Failed to invite user');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !modelName) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Share model</h2>
            <p style={mutedStyle}>{modelName}</p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle} aria-label="Close">x</button>
        </div>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Current access</h3>
          {loading ? (
            <p style={mutedStyle}>Loading permissions...</p>
          ) : permissions.length === 0 ? (
            <p style={mutedStyle}>No explicit permissions found.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Granted by</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => (
                  <tr key={permission.email}>
                    <td style={tdStyle}>{permission.email}</td>
                    <td style={tdStyle}>
                      {permission.role === MODEL_ROLES.OWNER ? (
                        roleLabel(permission.role)
                      ) : (
                        <select
                          value={permission.role}
                          disabled={saving}
                          onChange={(event) => void updatePermission(permission.email, event.target.value as ModelRole)}
                          style={inputStyle}
                        >
                          {EDITABLE_ROLES.map((role) => (
                            <option key={role} value={role}>{roleLabel(role)}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td style={tdStyle}>{permission.granted_by || '-'}</td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => void removePermission(permission.email)}
                        disabled={saving || permission.role === MODEL_ROLES.OWNER}
                        style={secondaryButtonStyle}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Invite someone</h3>
          <div style={inviteGridStyle}>
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="person@example.com"
              style={inputStyle}
            />
            <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as ModelRole)} style={inputStyle}>
              {EDITABLE_ROLES.map((role) => (
                <option key={role} value={role}>{roleLabel(role)}</option>
              ))}
            </select>
            <button type="button" onClick={() => void invite()} disabled={saving || !inviteEmail.trim()} style={primaryButtonStyle}>
              Invite
            </button>
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Your access</h3>
          <p style={mutedStyle}>You are the {roleLabel(currentModelRole)} of this model</p>
        </section>

        {message && <div style={successStyle}>{message}</div>}
        {error && <div style={errorStyle}>{error}</div>}
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1350,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  background: 'rgba(15, 23, 42, 0.45)',
};

const modalStyle: React.CSSProperties = {
  width: 780,
  maxWidth: '100%',
  maxHeight: '88vh',
  overflowY: 'auto',
  background: '#fff',
  borderRadius: 8,
  padding: 22,
  boxShadow: '0 18px 44px rgba(15, 23, 42, 0.22)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: 18,
};

const closeButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 18,
};

const sectionStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: '14px 0',
  borderTop: '1px solid #e5e7eb',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  color: '#064e3b',
};

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 13,
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 6px',
  borderBottom: '1px solid #e5e7eb',
  color: '#475569',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 6px',
  borderBottom: '1px solid #f1f5f9',
};

const inviteGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 1fr) 150px auto',
  gap: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 6,
  border: 'none',
  background: '#059669',
  color: '#fff',
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '7px 12px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: '#fff',
  cursor: 'pointer',
};

const successStyle: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  borderRadius: 6,
  color: '#065f46',
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
};

const errorStyle: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  borderRadius: 6,
  color: '#991b1b',
  background: '#fef2f2',
  border: '1px solid #fecaca',
};
