import { useEffect, useRef } from 'react';
import { dueState, initials, OUTCOMES } from '../lib/model.js';

// ---------- shared class names ----------
// `touch:` = phones/tablets (pointer: coarse): targets grow to 44px (WCAG 2.5.8, Apple HIG).
export const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page';
export const btnPrimary = `inline-flex items-center justify-center gap-1.5 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-surface-card hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 touch:min-h-[44px] ${focusRing}`;
export const btnGhost = `inline-flex items-center justify-center gap-1.5 rounded-md border border-text-muted/30 bg-surface-card px-4 py-2 text-sm font-medium text-text-primary hover:bg-text-muted/10 disabled:cursor-not-allowed disabled:opacity-50 touch:min-h-[44px] ${focusRing}`;
export const btnDanger = `inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-due-overdue hover:bg-due-overdue/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent touch:min-h-[44px] ${focusRing}`;
export const iconBtn = `inline-flex h-9 w-9 items-center justify-center rounded-md text-text-primary hover:bg-text-muted/10 touch:h-11 touch:w-11 ${focusRing}`;
export const field =
  'mt-1 w-full rounded-md border border-text-muted/40 bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30 touch:min-h-[44px]';
export const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-text-muted';
export const linkCls = `font-medium text-brand-accent underline underline-offset-2 hover:text-brand-primary ${focusRing}`;

// ---------- icons (decorative: always aria-hidden; buttons carry their own label) ----------
const PATHS = {
  board: 'M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z',
  archive: 'M3 4h18v4H3zM5 8v12h14V8M10 12h4',
  library: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  team: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  settings: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  plus: 'M12 5v14M5 12h14',
  menu: 'M3 6h18M3 12h18M3 18h18',
  x: 'M18 6L6 18M6 6l12 12',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp: 'M18 15l-6-6-6 6',
  copy: 'M9 9h12v12H9zM5 15V5a2 2 0 0 1 2-2h10',
  grip: 'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01',
  check: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  restore: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  external: 'M15 3h6v6M10 14L21 3M21 14v7H3V3h7',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  volumeOn: 'M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  volumeOff: 'M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6',
  feature: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
  bug: 'M8 10a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0zM12 10v6M4 10h4M16 10h4M4 16h4M16 16h4M9 6l-2-3M15 6l2-3',
  safe: 'M8 2v4M16 2v4M3 10h18M5 4h14v18H5zM9 16l2 2 4-4',
  warning: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  overdue: 'M12 3l10 18H2zM12 10v4M12 17h.01',
  neutral: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12l3 3 5-6',
  none: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  worked: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12l3 3 5-6',
  partly: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18',
  failed: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9l6 6M15 9l-6 6',
  prompt: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
};

export function Icon({ name, size = 16, className = '', strokeWidth = 2 }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'grip' ? 3 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

// ---------- logo: flow chevrons in a charcoal tile ----------
export function LogoMark({ size = 28 }) {
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
      <rect width="32" height="32" rx="8" className="fill-brand-primary" />
      <g fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-surface-card">
        <path d="M9 10l6 6-6 6" />
        <path d="M17 10l6 6-6 6" opacity=".55" />
      </g>
    </svg>
  );
}

// Logo top-left on every view; clicking it goes "home" to the board (Web Usability lecture).
export function Logo({ onHome }) {
  return (
    <button
      type="button"
      onClick={onHome}
      className={`flex items-center gap-2.5 rounded-md text-left ${focusRing}`}
      aria-label="AnchorFlow, go to the board"
    >
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight text-text-primary">AnchorFlow</span>
    </button>
  );
}

// ---------- badges (colour + icon + text, never colour alone) ----------
const TYPE_STYLE = {
  feature: { label: 'Feature', badge: 'bg-type-feature/10 text-type-feature', stripe: 'border-l-type-feature' },
  bug: { label: 'Bug', badge: 'bg-type-bug/10 text-type-bug', stripe: 'border-l-type-bug' },
};
export const typeStyle = (type) => TYPE_STYLE[type] ?? TYPE_STYLE.feature;

export function TypeBadge({ type }) {
  const s = typeStyle(type);
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs font-medium ${s.badge}`}>
      <Icon name={type === 'bug' ? 'bug' : 'feature'} size={12} />
      {s.label}
    </span>
  );
}

const DUE_STYLE = {
  safe: 'bg-due-safe/10 text-due-safe',
  warning: 'bg-due-warning/10 text-due-warning',
  overdue: 'bg-due-overdue/10 text-due-overdue',
  neutral: 'bg-due-neutral/10 text-due-neutral',
};
export const DUE_BORDER = {
  safe: 'border-due-safe/40',
  warning: 'border-due-warning/60',
  overdue: 'border-due-overdue/60',
  neutral: 'border-text-muted/20',
  none: 'border-text-muted/20',
};

export function DueBadge({ task }) {
  const due = dueState(task);
  if (due.state === 'none') return null;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs font-medium ${DUE_STYLE[due.state]}`}>
      <Icon name={due.state} size={12} />
      {due.label}
      {task.dueDate && due.state !== 'safe' && due.state !== 'neutral' && (
        <span className="sr-only">, due {task.dueDate}</span>
      )}
    </span>
  );
}

const OUTCOME_STYLE = {
  worked: 'bg-due-safe/10 text-due-safe',
  partly: 'bg-due-warning/10 text-due-warning',
  failed: 'bg-due-overdue/10 text-due-overdue',
};

export function OutcomeBadge({ result }) {
  if (!result) return null;
  const o = OUTCOMES.find((x) => x.id === result);
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${OUTCOME_STYLE[result]}`}>
      <Icon name={result} size={12} />
      <span className="sr-only">Last prompt: </span>
      {o?.label}
    </span>
  );
}

const AVATAR_STYLES = [
  'bg-text-primary/10 text-text-primary',
  'bg-type-feature/10 text-type-feature',
  'bg-type-bug/10 text-type-bug',
  'bg-due-warning/10 text-due-warning',
  'bg-due-safe/10 text-due-safe',
];

export function Avatar({ name, index = 0, size = 'h-7 w-7' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex ${size} shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        name ? AVATAR_STYLES[index % AVATAR_STYLES.length] : 'border border-dashed border-text-muted/50 text-text-muted'
      }`}
    >
      {name ? initials(name) : '?'}
    </span>
  );
}

// Status message, announced to screen readers; stays 5 s so slower readers can finish it.
export function Toast({ message }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[70] max-w-[90vw] -translate-x-1/2 rounded-md bg-text-primary px-4 py-2 text-sm text-surface-card shadow-lg transition-opacity duration-200 ${
        message ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {message}
    </div>
  );
}

// Dialog behaviour: focus inside on open, Tab stays inside, Esc closes,
// and focus goes back to whatever opened it (WCAG 2.4.3 focus order).
export function useDialog(ref, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const opener = document.activeElement;
    const node = ref.current;
    const focusables = () =>
      [...node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
        (el) => !el.disabled && el.offsetParent !== null,
      );
    const first = node.querySelector('[data-autofocus]') || focusables()[0];
    first?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key === 'Tab') {
        const els = focusables();
        if (!els.length) return;
        const [a, z] = [els[0], els[els.length - 1]];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [ref]);
}
