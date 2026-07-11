/**
 * Small shared UI primitives used across the marketing site and dashboard.
 * Keep these dependency-free and style-token driven.
 */
import type { CSSProperties, ReactNode } from 'react';

export function Chip({
  children,
  tone = 'slate',
  style,
}: {
  children: ReactNode;
  tone?: 'green' | 'amber' | 'red' | 'slate' | 'accent';
  style?: CSSProperties;
}) {
  const map: Record<string, [string, string]> = {
    green: ['var(--green)', 'var(--greenl)'],
    amber: ['var(--amber)', 'var(--amberl)'],
    red: ['var(--red)', 'var(--redl)'],
    accent: ['var(--accentd)', 'var(--accentl)'],
    slate: ['var(--text2)', 'var(--surf)'],
  };
  const [c, bg] = map[tone] ?? map.slate;
  return (
    <span
      style={{
        fontFamily: 'var(--fm)',
        fontSize: 10,
        padding: '2px 7px',
        borderRadius: 6,
        color: c,
        background: bg,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Spinner({ color = 'var(--green)', size = 10 }: { color?: string; size?: number }) {
  return (
    <span
      className="lbp-spin"
      style={{
        width: size,
        height: size,
        border: `1.6px solid ${color}`,
      }}
    />
  );
}

export function Icon({
  path,
  size = 18,
  stroke = 'currentColor',
  strokeWidth = 1.8,
}: {
  path: string;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

export const ICONS = {
  runs: '<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 4-5"/>',
  data: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>',
  talk: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  build: '<path d="M12 2v6M12 22v-6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M22 12h-6"/>',
  keys: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3 21 2M17 6l3 3M14 9l3 3"/>',
  billing: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8a1.65 1.65 0 0 0 1.51 1H22a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  pin: '<path d="M12 21s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
};
