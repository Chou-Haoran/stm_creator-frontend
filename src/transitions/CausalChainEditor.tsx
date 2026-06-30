import { useEffect, useState } from 'react';
import { searchDrivers, type DriverSearchResult } from '../app/api/drivers';
import { listPackages, getPackage, type PackageSummary, type PackageDriverItem } from '../app/api/packages';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Driver {
    driver_id?: number;
    driver: string;
    driver_group: string;
    description?: string | null;
    driver_chain?: string | null;
}

export type ChainPartType = 'driver' | 'precondition';

export interface ChainPart {
    causal_chain_id?: number;
    chain_part: ChainPartType;
    drivers: Driver[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function classify(d: Driver): ChainPartType {
    return (d.driver_chain ?? '').toLowerCase() === 'precondition' ? 'precondition' : 'driver';
}

// Flatten the chain parts to a single, de-duplicated driver list.
function flatten(value: ChainPart[]): Driver[] {
    const seen = new Set<number>();
    const out: Driver[] = [];
    for (const part of value) {
        for (const d of part.drivers ?? []) {
            if (d.driver_id != null) {
                if (seen.has(d.driver_id)) continue;
                seen.add(d.driver_id);
            }
            out.push(d);
        }
    }
    return out;
}

// Re-group a flat driver list into the two chain parts by each driver's type.
function toChainParts(drivers: Driver[]): ChainPart[] {
    const out: ChainPart[] = [];
    const driverPart = drivers.filter((d) => classify(d) === 'driver');
    const precPart = drivers.filter((d) => classify(d) === 'precondition');
    if (driverPart.length) out.push({ chain_part: 'driver', drivers: driverPart });
    if (precPart.length) out.push({ chain_part: 'precondition', drivers: precPart });
    return out;
}

function driverFromSearch(r: DriverSearchResult): Driver {
    return {
        driver_id: r.id,
        driver: r.name,
        driver_group: r.driver_group?.trim() || 'Uncategorised',
        description: r.description,
        driver_chain: r.driver_chain,
    };
}

function driverFromPackageItem(item: PackageDriverItem): Driver {
    return {
        driver_id: item.driver_id,
        driver: item.driver_EM_label || `Driver ${item.driver_id}`,
        driver_group: item.driver_class || 'Uncategorised',
        description: item.driver_description,
        driver_chain: item.driver_chain,
    };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    value: ChainPart[];
    onChange: (next: ChainPart[]) => void;
}

export function CausalChainEditor({ value, onChange }: Props) {
    const drivers = flatten(value);
    const driverItems = drivers.filter((d) => classify(d) === 'driver');
    const preconditionItems = drivers.filter((d) => classify(d) === 'precondition');
    const existingIds = new Set(drivers.map((d) => d.driver_id));

    const emit = (next: Driver[]) => onChange(toChainParts(next));
    const addDriver = (d: Driver) => {
        if (d.driver_id != null && existingIds.has(d.driver_id)) return;
        emit([...drivers, d]);
    };
    const addMany = (toAdd: Driver[]) => {
        const fresh = toAdd.filter((d) => d.driver_id == null || !existingIds.has(d.driver_id));
        if (fresh.length) emit([...drivers, ...fresh]);
    };
    const removeDriver = (driverId?: number) => emit(drivers.filter((d) => d.driver_id !== driverId));

    // Driver search
    const [driverQuery, setDriverQuery] = useState('');
    const [driverResults, setDriverResults] = useState<Driver[]>([]);
    const [driverLoading, setDriverLoading] = useState(false);

    useEffect(() => {
        const q = driverQuery.trim();
        if (q.length < 1) { setDriverResults([]); return; }
        const controller = new AbortController();
        setDriverLoading(true);
        const t = window.setTimeout(() => {
            searchDrivers(q, { limit: 10, signal: controller.signal })
                .then((rows) => setDriverResults(rows.map(driverFromSearch)))
                .catch((e) => { if (!(e instanceof DOMException && e.name === 'AbortError')) setDriverResults([]); })
                .finally(() => { if (!controller.signal.aborted) setDriverLoading(false); });
        }, 250);
        return () => { window.clearTimeout(t); controller.abort(); };
    }, [driverQuery]);

    // Package search
    const [packageQuery, setPackageQuery] = useState('');
    const [packageResults, setPackageResults] = useState<PackageSummary[]>([]);
    const [packageLoading, setPackageLoading] = useState(false);

    useEffect(() => {
        const q = packageQuery.trim();
        if (q.length < 1) { setPackageResults([]); return; }
        let cancelled = false;
        setPackageLoading(true);
        const t = window.setTimeout(() => {
            listPackages(q, 10)
                .then((rows) => { if (!cancelled) setPackageResults(rows); })
                .catch(() => { if (!cancelled) setPackageResults([]); })
                .finally(() => { if (!cancelled) setPackageLoading(false); });
        }, 250);
        return () => { cancelled = true; window.clearTimeout(t); };
    }, [packageQuery]);

    const addPackage = async (pkg: PackageSummary) => {
        setPackageQuery('');
        setPackageResults([]);
        try {
            const full = pkg.drivers ? pkg : await getPackage(pkg.id);
            addMany((full.drivers ?? []).map(driverFromPackageItem));
        } catch {
            // ignore — package failed to load
        }
    };

    const renderBucket = (title: string, items: Driver[]) => (
        <div style={bucket}>
            <div style={bucketHeader}>
                <span>{title}</span>
                <span style={countChip}>{items.length}</span>
            </div>
            {items.length === 0 ? (
                <div style={emptyRow}>None yet.</div>
            ) : (
                items.map((d) => (
                    <div key={d.driver_id ?? d.driver} style={driverRow}>
                        <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={driverName}>{d.driver}</span>
                            {d.description && <span style={driverDesc}>{d.description}</span>}
                        </span>
                        <span style={groupTag}>{d.driver_group}</span>
                        <button type="button" style={removeBtn} onClick={() => removeDriver(d.driver_id)} aria-label="Remove">✕</button>
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Add controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                    <label style={label}>Add a driver</label>
                    <input style={input} value={driverQuery} onChange={(e) => setDriverQuery(e.target.value)} placeholder="Search drivers…" />
                    {driverQuery.trim() && (
                        <div style={dropdown}>
                            {driverLoading ? <div style={statusRow}>Searching…</div>
                                : driverResults.length === 0 ? <div style={statusRow}>No matches</div>
                                    : driverResults.map((d) => (
                                        <button
                                            key={d.driver_id}
                                            type="button"
                                            disabled={d.driver_id != null && existingIds.has(d.driver_id)}
                                            style={{ ...resultRow, opacity: d.driver_id != null && existingIds.has(d.driver_id) ? 0.5 : 1 }}
                                            onClick={() => { addDriver(d); setDriverQuery(''); }}
                                        >
                                            <span style={{ minWidth: 0 }}>
                                                <span style={driverName}>{d.driver}</span>
                                                {d.description && <span style={driverDesc}>{d.description}</span>}
                                            </span>
                                            <small style={{ color: '#667085', flexShrink: 0 }}>{classify(d)}</small>
                                        </button>
                                    ))}
                        </div>
                    )}
                </div>

                <div style={{ position: 'relative' }}>
                    <label style={label}>Add a package</label>
                    <input style={input} value={packageQuery} onChange={(e) => setPackageQuery(e.target.value)} placeholder="Search packages…" />
                    {packageQuery.trim() && (
                        <div style={dropdown}>
                            {packageLoading ? <div style={statusRow}>Searching…</div>
                                : packageResults.length === 0 ? <div style={statusRow}>No matches</div>
                                    : packageResults.map((p) => (
                                        <button key={p.id} type="button" style={resultRow} onClick={() => void addPackage(p)}>
                                            <span style={driverName}>{p.package_description}</span>
                                            <small style={{ color: '#667085', flexShrink: 0 }}>{p.driver_count ?? 0} drivers</small>
                                        </button>
                                    ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Buckets */}
            {renderBucket('Drivers', driverItems)}
            {renderBucket('Preconditions', preconditionItems)}
        </div>
    );
}

/* ── styles ── */
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 4 };
const input: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d0d5dd', borderRadius: 6, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const dropdown: React.CSSProperties = { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, boxShadow: '0 6px 18px rgba(16,24,40,0.14)', zIndex: 20, maxHeight: 220, overflowY: 'auto' };
const resultRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', padding: '8px 10px', border: 'none', background: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: 13 };
const statusRow: React.CSSProperties = { padding: '8px 10px', color: '#667085', fontSize: 12 };
const bucket: React.CSSProperties = { border: '1px solid #eaecf0', borderRadius: 8, overflow: 'hidden' };
const bucketHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f9fafb', borderBottom: '1px solid #eaecf0', fontWeight: 600, fontSize: 13, color: '#344054' };
const countChip: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#175cd3', background: '#eff8ff', padding: '1px 8px', borderRadius: 12 };
const emptyRow: React.CSSProperties = { padding: 12, color: '#667085', fontSize: 12 };
const driverRow: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderBottom: '1px solid #f2f4f7', fontSize: 13 };
const driverName: React.CSSProperties = { display: 'block', fontWeight: 500, color: '#101828' };
const driverDesc: React.CSSProperties = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#667085', fontSize: 12, lineHeight: 1.35 };
const groupTag: React.CSSProperties = { color: '#667085', fontSize: 12, flexShrink: 0 };
const removeBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#b42318', cursor: 'pointer', fontSize: 13, padding: '0 4px', flexShrink: 0 };
