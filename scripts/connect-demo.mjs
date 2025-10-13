// Simple end-to-end connectivity demo for frontend↔backend
// Usage examples:
//   API_BASE=http://localhost:3000 EMAIL=user@example.com PASSWORD=Secret123! node scripts/connect-demo.mjs
//   API_BASE=http://localhost:3000 EMAIL=admin@example.com PASSWORD=Secret123! ROLE=Admin MODEL_NAME="BMRG Rainforests" SAVE=true node scripts/connect-demo.mjs

import fs from 'node:fs/promises';

const API_BASE = process.env.API_BASE || process.env.VITE_API_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.EMAIL || 'demo.user@example.com';
const PASSWORD = process.env.PASSWORD || 'Secret123!';
const NAME = process.env.NAME || 'Demo User';
const ROLE = process.env.ROLE || 'Viewer'; // Admin | Editor | Viewer
const MODEL_NAME = process.env.MODEL_NAME; // e.g. BMRG Rainforests
const SAVE = String(process.env.SAVE || '').toLowerCase() === 'true';

function log(step, msg) { console.log(`[${step}] ${msg}`); }
function warn(step, msg) { console.warn(`[${step}] ${msg}`); }

async function jsonOrText(res) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { return await res.json(); } catch { return null; }
  }
  try { return await res.text(); } catch { return null; }
}

async function main() {
  log('CONFIG', `API_BASE=${API_BASE}`);
  log('CONFIG', `EMAIL=${EMAIL}, ROLE=${ROLE}, MODEL_NAME=${MODEL_NAME ?? 'N/A'}, SAVE=${SAVE}`);

  // 1) Auth health
  try {
    const r = await fetch(`${API_BASE}/auth/health`);
    const body = await jsonOrText(r);
    log('HEALTH', `status=${r.status} body=${JSON.stringify(body)}`);
  } catch (e) {
    warn('HEALTH', `failed: ${e.message}`);
  }

  // 2) Signup (fallback to login on 409)
  let token; let user;
  try {
    const r = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: NAME, email: EMAIL, password: PASSWORD, role: ROLE }),
    });
    const body = await jsonOrText(r);
    if (r.ok) {
      ({ token, user } = body);
      log('SIGNUP', `ok: user=${user?.email} role=${user?.role}`);
    } else if (r.status === 409) {
      log('SIGNUP', 'email exists — will login');
    } else {
      warn('SIGNUP', `failed: ${r.status} ${JSON.stringify(body)}`);
    }
  } catch (e) {
    warn('SIGNUP', `error: ${e.message}`);
  }

  // 3) Login if needed
  if (!token) {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const body = await jsonOrText(r);
    if (!r.ok) throw new Error(`LOGIN failed: ${r.status} ${JSON.stringify(body)}`);
    ({ token, user } = body);
    log('LOGIN', `ok: user=${user?.email} role=${user?.role}`);
  }

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // 4) GET /models/:name if MODEL_NAME provided
  if (MODEL_NAME) {
    const url = `${API_BASE}/models/${encodeURIComponent(MODEL_NAME)}`;
    const r = await fetch(url, { headers: { Accept: 'application/json', ...authHeaders } });
    const body = await jsonOrText(r);
    if (r.ok) {
      log('GET_MODEL', `ok: states=${body?.states?.length ?? 0} transitions=${body?.transitions?.length ?? 0}`);
    } else {
      warn('GET_MODEL', `failed: ${r.status} ${JSON.stringify(body)}`);
    }
  }

  // 5) Optional: save demo model (requires Editor/Admin)
  if (SAVE) {
    try {
      const samplePath = new URL('../public/BMRG_Rainforests.json', import.meta.url);
      const text = await fs.readFile(samplePath, 'utf-8');
      const demo = JSON.parse(text);
      const r = await fetch(`${API_BASE}/models/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(demo),
      });
      const body = await jsonOrText(r);
      if (r.ok) {
        log('SAVE_MODEL', `ok: ${JSON.stringify(body)}`);
      } else {
        warn('SAVE_MODEL', `failed: ${r.status} ${JSON.stringify(body)}`);
      }
    } catch (e) {
      warn('SAVE_MODEL', `error: ${e.message}`);
    }
  }

  log('DONE', 'connectivity demo finished');
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

