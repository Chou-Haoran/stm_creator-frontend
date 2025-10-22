// Quick filter presets: Uncertain, Likely 0.60–1.00, Positive Δ
import { Panel } from '@xyflow/react';
import type { DeltaFilterOption } from '../../app/types';

type Props = {
  readonly onSetDelta: (opt: DeltaFilterOption) => void;
  readonly onSetRange: (min: number, max: number, mode: 'any' | 'both') => void;
  readonly onRequireTime100: (on: boolean) => void;
  readonly onClearLocal: () => void; // clear local filter controls if needed
  readonly top?: number; readonly right?: number;
};

export function PresetsPanel({
  onSetDelta, onSetRange, onRequireTime100, onClearLocal, top = 200, right = 8,
}: Props) {
  const apply = (fn: () => void) => () => { onClearLocal(); fn(); };
  return (
    <Panel position="top-right" style={{ top, right, width: 360, zIndex: 20 }} className="stm-ext-panel">
      <div className="stm-ext-card">
        <div className="stm-ext-header">
          <div className="stm-ext-title">Quick presets</div>
        </div>
        <div className="stm-ext-row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="stm-ext-btn" onClick={apply(() => { onRequireTime100(false); onSetDelta('all'); })}>
            Uncertain (time_100 = 0)
          </button>
          <button className="stm-ext-btn" onClick={apply(() => { onSetRange(0.6, 1, 'any'); onSetDelta('all'); })}>
            Likely 0.60–1.00
          </button>
          <button className="stm-ext-btn" onClick={apply(() => { onSetDelta('positive'); })}>
            Positive Δ
          </button>
        </div>
      </div>
    </Panel>
  );
}
