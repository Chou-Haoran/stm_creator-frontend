import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

export type TourStep = {
  /** CSS selector for the target element */
  selector: string;
  /** Title shown in the tooltip */
  title: string;
  /** Body text shown in the tooltip */
  body: string;
  /** Tooltip placement relative to target */
  placement?: 'top' | 'right' | 'bottom' | 'left';
};

type Props = {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
  /** Start index (default 0) */
  startAt?: number;
};

type Rect = { x: number; y: number; width: number; height: number };

function getRect(el: Element | null): Rect | null {
  if (!el) return null;
  const r = (el as HTMLElement).getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const Tour: React.FC<Props> = ({ steps, open, onClose, startAt = 0 }) => {
  const [idx, setIdx] = useState(startAt);
  const [rect, setRect] = useState<Rect | null>(null);
  const [visible, setVisible] = useState(false);
  const animRef = useRef<number | null>(null);

  const step = steps[idx];
  const target = useMemo(
    () => (open ? (document.querySelector(step?.selector ?? '') as HTMLElement | null) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, idx, step?.selector]
  );

  // Recompute rect and ensure target is visible
  useLayoutEffect(() => {
    if (!open || !target) {
      setRect(null);
      return;
    }
    target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });

    const update = () => setRect(getRect(target));
    update();

    const onResize = () => update();
    const onScroll = () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(update);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);

    const ro = new ResizeObserver(update);
    ro.observe(target);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
      ro.disconnect();
    };
  }, [open, target]);

  useEffect(() => setVisible(open), [open]);

  const goNext = () => {
    if (idx < steps.length - 1) setIdx((i) => i + 1);
    else onClose();
  };
  const goPrev = () => setIdx((i) => clamp(i - 1, 0, steps.length - 1));
  const skip = () => onClose();

  // Keyboard shortcuts: ESC closes; Enter/→ next; ← back
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' || e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, idx]);

  if (!visible || !step) return null;

  const r = rect ?? getRect(target);
  if (!r) return null;

  // Tooltip positioning
  const gap = 12;
  const tooltipMaxW = 360;
  const base = { left: r.x, top: r.y, width: r.width, height: r.height };
  const centerX = base.left + base.width / 2;
  const centerY = base.top + base.height / 2;

  let tipLeft = centerX - tooltipMaxW / 2;
  let tipTop = base.top - gap - 120; // default: top
  const placement = step.placement ?? 'top';

  if (placement === 'bottom') tipTop = base.top + base.height + gap;
  if (placement === 'left') {
    tipTop = centerY - 60;
    tipLeft = base.left - tooltipMaxW - gap;
  }
  if (placement === 'right') {
    tipTop = centerY - 60;
    tipLeft = base.left + base.width + gap;
  }

  tipLeft = clamp(tipLeft, 8, window.innerWidth - tooltipMaxW - 8);

  return (
    <>
      {/* Backdrop */}
      <div className="tour-backdrop" />

      {/* Highlight box (non-interactive) */}
      <div
        className="tour-highlight"
        style={{
          left: base.left - 6,
          top: base.top - 6,
          width: base.width + 12,
          height: base.height + 12,
        }}
      />

      {/* Tooltip card */}
      <div
        className={`tour-tooltip tour-${placement}`}
        style={{ left: tipLeft, top: tipTop, maxWidth: tooltipMaxW }}
        role="dialog"
        aria-live="polite"
      >
        <div className="tour-title">{step.title}</div>
        <div className="tour-body">{step.body}</div>

        <div className="tour-actions">
          <button className="tour-btn ghost" onClick={skip} aria-label="Skip tour">
            Skip
          </button>
          <div className="tour-progress">
            {idx + 1} / {steps.length}
          </div>
          <div className="tour-nav">
            <button className="tour-btn" onClick={goPrev} disabled={idx === 0}>
              Back
            </button>
            <button className="tour-btn primary" onClick={goNext}>
              {idx === steps.length - 1 ? 'Finish' : 'Continue'}
            </button>
          </div>
        </div>

        <div className="tour-arrow" />
      </div>
    </>
  );
};
