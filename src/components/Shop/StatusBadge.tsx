import React from 'react';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_GLYPHS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_GLYPHS,
} from './shopTypes';

type Kind = 'order' | 'payment';

interface StatusBadgeProps {
  status: string;
  kind?: Kind;
  /** Prefix read by screen readers, e.g. "Payment". */
  srPrefix?: string;
  className?: string;
}

/**
 * Renders an order or payment status.
 *
 * Status is conveyed by glyph + text label in addition to colour, so it remains
 * distinguishable without colour perception (WCAG 1.4.1). Colours resolve from
 * semantic tokens, so the badge adapts across all themes.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  kind = 'order',
  srPrefix,
  className = '',
}) => {
  const isPayment = kind === 'payment';
  const colors = isPayment ? PAYMENT_STATUS_COLORS : ORDER_STATUS_COLORS;
  const labels = isPayment ? PAYMENT_STATUS_LABELS : ORDER_STATUS_LABELS;
  const glyphs = isPayment ? PAYMENT_STATUS_GLYPHS : ORDER_STATUS_GLYPHS;

  const label = labels[status] || status;
  const glyph = glyphs[status];
  const tone = colors[status] || 'bg-surface-sunken text-content-secondary border border-edge';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${tone} ${className}`}
    >
      {glyph && <span aria-hidden="true">{glyph}</span>}
      <span>
        {srPrefix && <span className="sr-only">{srPrefix}: </span>}
        {label}
      </span>
    </span>
  );
};

export default StatusBadge;
