const NW = 185;
const DEGRADE = '#ef4444';
const RESTORE = '#16a34a';

type NodeDef = {
  id: string; cls: string; badge: number; title: string; subtitle: string;
  badgeColor: string; borderColor: string; barColor: string; barWidth: number;
  left: number; top: number; floatDur: number; floatDelay: number; isRef: boolean;
};

type EdgeDef = {
  id: string; path: string; type: 'degrade' | 'restore'; label: string;
  lx: number; ly: number; dur: number;
};

const NODES: NodeDef[] = [
  {
    id: 'c1', cls: 'CLASS I', badge: 1,
    title: 'Reference',
    subtitle: 'Condition: 0.90 – 1.00',
    badgeColor: '#16a34a', borderColor: '#16a34a', barColor: '#16a34a', barWidth: 95,
    left: 20, top: 55, floatDur: 7, floatDelay: 0, isRef: true,
  },
  {
    id: 'c2', cls: 'CLASS II', badge: 2,
    title: 'Ref. overstorey, modified understorey',
    subtitle: 'Condition: 0.70 – 0.89',
    badgeColor: '#65a30d', borderColor: '#65a30d', barColor: '#84cc16', barWidth: 78,
    left: 225, top: 215, floatDur: 8.5, floatDelay: 1200, isRef: false,
  },
  {
    id: 'c3', cls: 'CLASS III', badge: 3,
    title: 'Regenerating rainforest',
    subtitle: 'Condition: 0.50 – 0.69',
    badgeColor: '#d97706', borderColor: '#d97706', barColor: '#f59e0b', barWidth: 58,
    left: 435, top: 60, floatDur: 6.5, floatDelay: 600, isRef: false,
  },
  {
    id: 'c4', cls: 'CLASS IV', badge: 4,
    title: 'Highly modified overstorey',
    subtitle: 'Condition: 0.30 – 0.49',
    badgeColor: '#ea580c', borderColor: '#ea580c', barColor: '#f97316', barWidth: 38,
    left: 50, top: 440, floatDur: 9, floatDelay: 2000, isRef: false,
  },
  {
    id: 'c5', cls: 'CLASS V', badge: 5,
    title: 'Collapsed / removed overstorey',
    subtitle: 'Condition: 0.00 – 0.29',
    badgeColor: '#dc2626', borderColor: '#dc2626', barColor: '#ef4444', barWidth: 20,
    left: 385, top: 420, floatDur: 7.5, floatDelay: 3000, isRef: false,
  },
];

// Node centers & attachment points used in EDGES below:
// c1 center≈(112,109)  right=(205,109)  bottom=(112,163)
// c2 center≈(317,269)  left=(225,269)   top=(317,215)    bottom=(317,308)
// c3 center≈(527,114)  left=(435,114)   bottom=(527,168)
// c4 center≈(142,494)  right=(235,494)  top=(142,440)
// c5 center≈(477,474)  left=(385,474)   top=(477,420)

const EDGES: EdgeDef[] = [
  // c1 → c2  degrade  (c1.right → c2.top)
  { id: 'e1', type: 'degrade', label: 'Δ −0.05', lx: 270, ly: 148,
    path: 'M205,109 C272,109 272,215 317,215', dur: 3.2 },
  // c2 → c1  restore  (c2.left → c1.bottom)
  { id: 'e2', type: 'restore', label: 'Δ +0.08', lx: 147, ly: 222,
    path: 'M225,255 C165,255 112,215 112,163', dur: 3.8 },
  // c1 → c3  degrade  (c1.right upper → c3.left upper, arc above)
  { id: 'e3', type: 'degrade', label: 'Δ −0.07', lx: 318, ly: 60,
    path: 'M205,88 C300,60 375,66 435,96', dur: 2.9 },
  // c2 → c4  degrade  (c2.bottom → c4.top)
  { id: 'e4', type: 'degrade', label: 'Δ −0.04', lx: 206, ly: 378,
    path: 'M280,308 C250,378 195,415 142,440', dur: 3.5 },
  // c4 → c2  restore  (c4.right → c2.bottom, sweeps right)
  { id: 'e5', type: 'restore', label: 'Δ +0.05', lx: 344, ly: 438,
    path: 'M235,494 C328,516 388,438 317,308', dur: 4.1 },
  // c3 → c5  degrade  (c3.bottom → c5.top, nearly vertical)
  { id: 'e6', type: 'degrade', label: 'Δ −0.06', lx: 516, ly: 292,
    path: 'M510,168 C524,264 498,352 477,420', dur: 3.7 },
  // c5 → c4  restore  (c5.left → c4.right, horizontal arc)
  { id: 'e7', type: 'restore', label: 'Δ +0.04', lx: 312, ly: 494,
    path: 'M385,474 C338,492 285,496 235,494', dur: 4.4 },
];

const CSS = `
  @keyframes stmFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes stmEdgeDash { to{stroke-dashoffset:-10} }
  @keyframes stmGlow {
    0%,100%{box-shadow:0 2px 14px rgba(0,0,0,0.07),0 0 0 2px rgba(22,163,74,0.14)}
    50%{box-shadow:0 4px 26px rgba(22,163,74,0.22),0 0 0 5px rgba(22,163,74,0.22)}
  }
  @media (max-width: 768px) { .ep-panel { display: none !important; } }
`;

export default function EcosystemPanel() {
  return (
    <div className="ep-panel" style={{
      flex: 1,
      overflow: 'hidden',
      backgroundColor: '#f8fafc',
      backgroundImage: 'radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)',
      backgroundSize: '24px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      gap: 16,
    }}>
      <style>{CSS}</style>

      {/* Panel header — absolute top-right, always visible */}
      <div style={{ position: 'absolute', top: 20, right: 24, textAlign: 'right', pointerEvents: 'none' }}>
        <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, color: '#94a3b8', margin: '0 0 2px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          BMRG Rainforests — State Transition Model
        </p>
        <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8.5, color: '#cbd5e1', margin: 0, letterSpacing: '0.06em' }}>
          Broad-leaved moist rainforest · 5 classes · 7 transitions
        </p>
      </div>

      {/* Fixed-size canvas — centered in the panel */}
      <div style={{ position: 'relative', width: 640, height: 570, flexShrink: 0 }}>

        {/* SVG arrow layer — covers the canvas exactly */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
        >
          <defs>
            <marker id="epArrowD" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L7,3.5 z" fill={DEGRADE} />
            </marker>
            <marker id="epArrowR" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L7,3.5 z" fill={RESTORE} />
            </marker>
          </defs>

          {EDGES.map(e => {
            const color = e.type === 'degrade' ? DEGRADE : RESTORE;
            return (
              <g key={e.id}>
                <path
                  d={e.path}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  opacity="0.55"
                  markerEnd={`url(#epArrow${e.type === 'degrade' ? 'D' : 'R'})`}
                  style={{ animation: `stmEdgeDash ${e.dur}s linear infinite` }}
                />
                <rect x={e.lx - 23} y={e.ly - 9} width={46} height={16} rx={4} fill="white" opacity="0.92" />
                <text x={e.lx} y={e.ly + 3.5} textAnchor="middle" fontSize="8.5"
                  fontFamily="IBM Plex Mono, monospace" fill={color} fontWeight="700">
                  {e.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Node cards — absolutely positioned within the canvas */}
        {NODES.map(n => (
          <div key={n.id} style={{
            position: 'absolute',
            left: n.left,
            top: n.top,
            width: NW,
            backgroundColor: '#ffffff',
            borderRadius: 10,
            borderLeft: `4px solid ${n.borderColor}`,
            padding: '9px 11px 8px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            animation: n.isRef
              ? `stmFloat ${n.floatDur}s ease-in-out ${n.floatDelay}ms infinite, stmGlow 3s ease-in-out infinite`
              : `stmFloat ${n.floatDur}s ease-in-out ${n.floatDelay}ms infinite`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#6b7280', letterSpacing: '0.12em', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase' }}>
                {n.cls}
              </span>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                backgroundColor: n.badgeColor, color: 'white',
                fontSize: 9.5, fontWeight: 700, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'IBM Plex Mono, monospace',
              }}>
                {n.badge}
              </span>
            </div>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b', margin: '0 0 2px', lineHeight: 1.3, fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {n.title}
            </p>
            <p style={{ fontSize: 9, color: '#64748b', margin: '0 0 8px', fontFamily: 'IBM Plex Mono, monospace' }}>
              {n.subtitle}
            </p>
            <div style={{ height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${n.barWidth}%`, backgroundColor: n.barColor, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Legend — sits below the canvas as a flex sibling */}
      <div style={{ display: 'flex', gap: 22, pointerEvents: 'none', flexShrink: 0 }}>
        {([
          { color: RESTORE, label: 'Restoration / improvement' },
          { color: DEGRADE, label: 'Degradation' },
        ] as const).map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="28" height="10" style={{ overflow: 'visible' }}>
              <line x1="2" y1="5" x2="20" y2="5" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" />
              <polygon points="18,2 27,5 18,8" fill={color} />
            </svg>
            <span style={{ fontSize: 9.5, color: '#94a3b8', fontFamily: 'IBM Plex Mono, monospace' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
