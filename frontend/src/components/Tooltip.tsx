import { useState, cloneElement, isValidElement } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  tip: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: ReactElement<any>;
}

/**
 * Portal-based tooltip. Injects onMouseEnter/Leave directly into the child
 * element via cloneElement — zero wrapper nodes, zero layout side-effects.
 * Uses position:fixed so it escapes any overflow or stacking context.
 * Auto-flips to bottom when the button is too close to the top of the viewport.
 */
export default function Tooltip({ tip, children }: TooltipProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  if (!isValidElement(children)) return children as ReactElement;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = children.props as Record<string, any>;

  const child = cloneElement(children, {
    onMouseEnter(e: React.MouseEvent<HTMLElement>) {
      setRect(e.currentTarget.getBoundingClientRect());
      props.onMouseEnter?.(e);
    },
    onMouseLeave(e: React.MouseEvent<HTMLElement>) {
      setRect(null);
      props.onMouseLeave?.(e);
    },
  } as Partial<typeof props>);

  const TOOLTIP_HEIGHT = 30;
  const GAP = 8;
  const showBelow = rect ? rect.top < TOOLTIP_HEIGHT + GAP + 10 : false;

  return (
    <>
      {child}
      {rect && createPortal(
        <div style={{
          position: 'fixed',
          left: rect.left + rect.width / 2,
          ...(showBelow
            ? { top: rect.bottom + GAP, transform: 'translateX(-50%)' }
            : { top: rect.top - GAP, transform: 'translate(-50%, -100%)' }
          ),
          background: 'rgba(15,23,42,0.96)',
          color: '#e2e8f0',
          fontSize: '0.7rem',
          fontWeight: 600,
          padding: '0.35rem 0.65rem',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.1)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 99999,
          letterSpacing: '0.01em',
        }}>
          {tip}
        </div>,
        document.body
      )}
    </>
  );
}
