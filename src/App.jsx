import { useState, useEffect, useRef } from 'react';

/**
 * Amira's Kanban — Vibecoding Project Tracker.
 *
 * Build sequence in Phase 3:
 *   - M4  data-model    : four columns + task cards            ✅
 *   - M5  crud-modal    : "+" button modal and edit-on-click modal ✅
 *   - M6  tag-style     : feature vs. bug color coding (DESIGN.md §2).
 *   - M7  task-owner    : assignee badge + "Hand off to..." dropdown.
 *   - M8  due-tint      : color cards by due date (DESIGN.md §2).
 *   - M9  context       : a curated Context briefing field on the modal.
 *   - M10 copy-prompt   : a "Copy as Prompt Context" button.
 *   - M11 anchors       : the Anchor Board above the Kanban.
 *   - M12 secret-sauce  : the one open-ended thing that makes your tracker yours.
 *
 * Search the file for `TODO M<n>` to find the right hook for each milestone.
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {'feature'|'bug'} type
 * @property {'todo'|'in-progress'|'review'|'done'} status
 * @property {string} assignee
 * @property {string|null} dueDate     ISO 'YYYY-MM-DD'
 * @property {string} createdDate      ISO 'YYYY-MM-DD'
 */

// The four columns of the board, in render order.
// Use these IDs everywhere — do not invent new ones.
export const STAGES = [
  { id: 'todo',        label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review',      label: 'Review' },
  { id: 'done',        label: 'Done' },
];

// PRD §8 — Amira plus two placeholder teammates (swap in real names later).
// These are the only valid values for `Task.assignee`.
export const TEAM = ['Amira Koki', 'Jordan Lee', 'Priya Shah'];

// M7 task-owner: one avatar colour per teammate, so owners are easy to spot.
const AVATAR_STYLE = [
  'bg-brand-primary/10 text-brand-primary',
  'bg-type-feature/10 text-type-feature',
  'bg-due-warning/10 text-due-warning',
];

// ---------- M8 due-tint: deadline states ----------
// Works out the state from the due date. No new fields, no user action.
// Colour + icon + text label, so the state is never shown by colour alone.
const DUE_ICONS = {
  safe: <path d="M8 2v4M16 2v4M3 10h18M5 4h14v18H5zM9 16l2 2 4-4" />,
  warning: <path d="M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />,
  overdue: <path d="M12 3l10 18H2zM12 10v4M12 17h.01" />,
  neutral: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12l3 3 5-6" />,
};

function dueInfo(task) {
  // Done always looks neutral, even if it was overdue.
  if (task.status === 'done') {
    return {
      state: 'neutral',
      label: 'Done',
      border: 'border-text-muted/20',
      badge: 'bg-due-neutral/10 text-due-neutral',
    };
  }
  if (!task.dueDate) {
    return { state: 'none', label: '', border: 'border-text-muted/20' };
  }
  // Whole days between today and the due date (local time).
  const [y, m, d] = task.dueDate.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / 86400000);

  if (days < 0) {
    return {
      state: 'overdue',
      label: 'Overdue',
      border: 'border-due-overdue/60',
      badge: 'bg-due-overdue/10 text-due-overdue',
    };
  }
  if (days <= 1) {
    return {
      state: 'warning',
      label: days === 0 ? 'Due today' : 'Due tomorrow',
      border: 'border-due-warning/60',
      badge: 'bg-due-warning/10 text-due-warning',
    };
  }
  return {
    state: 'safe',
    label: formatDate(task.dueDate),
    border: 'border-due-safe/40',
    badge: 'bg-due-safe/10 text-due-safe',
  };
}

function DueBadge({ task, due }) {
  if (due.state === 'none') return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium ${due.badge}`}
      title={task.dueDate ? `Due ${formatDate(task.dueDate)}` : undefined}
    >
      <svg
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {DUE_ICONS[due.state]}
      </svg>
      {due.label}
      {task.dueDate && due.state !== 'safe' && (
        <span className="sr-only">, due {formatDate(task.dueDate)}</span>
      )}
    </span>
  );
}


// ---------- M9 context: curated briefing for the next AI / teammate ----------
const CONTEXT_TOOLS = ['Claude', 'ChatGPT', 'Cursor', 'Lovable', 'Replit', 'Other'];

// Pre-filled into every new task so the briefing has a shape.
const CONTEXT_TEMPLATE = `## Background
What is this task and why does it matter?

## Constraints
Tech stack, design rules, things that must not change.

## Tried so far
Prompts used, what worked, what didn't.

## Pick up
The very next step for whoever (or whichever AI) continues.`;

// ISO timestamp -> "just now" / "5 min ago" / "2 h ago" / "3 days ago"
function timeAgo(iso) {
  if (!iso) return null;
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}



// ---------- M10 copy-context: task -> paste-ready Markdown briefing ----------
function taskToMarkdown(task) {
  const stage = STAGES.find((s) => s.id === task.status);
  const meta = [
    `**Type:** ${task.type === 'bug' ? 'Bug' : 'Feature'}`,
    `**Status:** ${stage ? stage.label : task.status}`,
    `**Owner:** ${task.assignee}`,
    task.dueDate ? `**Due:** ${formatDate(task.dueDate)}` : null,
    task.contextTool ? `**Last AI tool:** ${task.contextTool}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return [
    `# Task: ${task.title}`,
    '',
    meta,
    '',
    '## Description',
    task.description || '_No description yet._',
    '',
    '## Context',
    task.context && task.context.trim() ? task.context.trim() : '_No context yet._',
    '',
    '---',
    'You are helping me continue this task. Read the context above, then help me with the "Pick up" step.',
  ].join('\n');
}

// Copy text to the clipboard, with a fallback for older browsers.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

const COPY_ICON = (
  <svg
    aria-hidden="true"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);



// ---------- M11 anchors: the four final-project deliverables ----------
const DEFAULT_ANCHORS = [
  { id: 'presentation', label: 'Presentation', url: null },
  { id: 'demo', label: 'Demo', url: null },
  { id: 'report', label: 'Report', url: null },
  { id: 'documentation', label: 'Documentation', url: null },
];

// "example.com" -> "https://example.com" so the Open link always works.
function toHref(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function AnchorBoard({ anchors, setAnchors }) {
  const linked = anchors.filter((a) => a.url).length;

  const setUrl = (id, value) =>
    setAnchors((prev) =>
      prev.map((a) => (a.id === id ? { ...a, url: value.trim() || null } : a)),
    );

  return (
    <section aria-labelledby="anchors-title" className="mb-6">
      <div className="mb-2 flex items-baseline justify-between">
        <h2
          id="anchors-title"
          className="text-xs font-semibold uppercase tracking-wider text-text-muted"
        >
          Final deliverables
        </h2>
        <span className="font-mono text-xs text-text-muted">
          {linked} of {anchors.length} linked
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {anchors.map((a) => {
          const inputId = `anchor-${a.id}`;
          return (
            <li
              key={a.id}
              className={`rounded-lg border bg-surface-card p-3 ${
                a.url ? 'border-due-safe/40' : 'border-dashed border-text-muted/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={inputId}
                  className="flex items-center gap-2 text-sm font-medium text-text-primary"
                >
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full ${
                      a.url
                        ? 'bg-due-safe'
                        : 'border-2 border-text-muted/50 bg-transparent'
                    }`}
                  />
                  {a.label}
                </label>
                <span
                  className={`font-mono text-[11px] ${
                    a.url ? 'text-due-safe' : 'text-text-muted'
                  }`}
                >
                  {a.url ? 'Linked' : 'Empty'}
                </span>
              </div>

              <input
                id={inputId}
                type="url"
                inputMode="url"
                placeholder="Paste a link…"
                defaultValue={a.url ?? ''}
                onBlur={(e) => setUrl(a.id, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="mt-2 w-full rounded-md border border-text-muted/30 bg-surface-page px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />

              {a.url && (
                <a
                  href={toHref(a.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-brand-accent underline-offset-2 hover:underline"
                >
                  Open {a.label.toLowerCase()} ↗
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------- M12 secret sauce #1: light / dark mode ----------
// Follows the computer's setting until the user picks, then remembers it.
function useTheme() {
  const [theme, setTheme] = useLocalStorage('vibetracker.theme', null);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isDark = theme ? theme === 'dark' : systemDark;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  return [isDark, () => setTheme(isDark ? 'light' : 'dark')];
}

function ThemeToggle() {
  const [isDark, toggle] = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="rounded-md border border-text-muted/30 p-2 text-text-primary hover:bg-text-muted/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isDark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  );
}

function avatarStyle(name) {
  const i = TEAM.indexOf(name);
  return AVATAR_STYLE[i >= 0 ? i % AVATAR_STYLE.length : 0];
}
/**
 * A tiny localStorage hook — survives reloads, no library needed.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or private-mode error — silently ignore for hackathon */
    }
  }, [key, value]);

  return [value, setValue];
}

// ---------- helpers ----------

// ISO date 'YYYY-MM-DD' for today + n days (local time).
function isoDaysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "Amira Koki" -> "AK"
function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

// '2026-10-24' -> '24 Oct'
function formatDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Unique-enough id for a hackathon (timestamp + random suffix).
function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// A blank task for the "+ New task" modal.
function blankTask() {
  return {
    id: null, // null = not saved yet (create mode)
    title: '',
    description: '',
    type: 'feature',
    status: 'todo',
    assignee: TEAM[0],
    dueDate: null,
    context: CONTEXT_TEMPLATE,
    contextTool: null,
    contextUpdatedAt: null,
    createdDate: isoDaysFromNow(0),
  };
}

// ---------- seed data (M4) ----------
// Mock tasks so the board isn't empty on first load. Due dates are relative
// to today so they always demo well (and M8 due-tint has something to show).
const SEED_TASKS = [
  {
    id: 'seed-1',
    title: 'Build the four-column board',
    description: 'Render To Do / In Progress / Review / Done from STAGES.',
    type: 'feature',
    status: 'done',
    assignee: 'Amira Koki',
    dueDate: isoDaysFromNow(-1),
    createdDate: isoDaysFromNow(-2),
  },
  {
    id: 'seed-2',
    title: 'Add / edit / delete modal',
    description: 'One modal for create and edit, persisted to localStorage.',
    type: 'feature',
    status: 'in-progress',
    assignee: 'Amira Koki',
    dueDate: isoDaysFromNow(0),
    createdDate: isoDaysFromNow(-1),
  },
  {
    id: 'seed-3',
    title: 'Fix card text overflowing on long titles',
    description: 'Long titles push the assignee badge off the card.',
    type: 'bug',
    status: 'review',
    assignee: 'Amira Koki',
    dueDate: isoDaysFromNow(-2),
    createdDate: isoDaysFromNow(-3),
  },
  {
    id: 'seed-4',
    title: 'Copy as Prompt Context button',
    description: 'One click copies the task + context as Markdown for the AI.',
    type: 'feature',
    status: 'todo',
    assignee: 'Amira Koki',
    dueDate: isoDaysFromNow(5),
    createdDate: isoDaysFromNow(0),
  },
];

// ---------- shared styles ----------
const btnPrimary =
  'rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-surface-card hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const btnGhost =
  'rounded-md border border-text-muted/30 px-4 py-2 text-sm font-medium text-text-primary hover:bg-text-muted/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent';
const btnDanger =
  'rounded-md px-3 py-2 text-sm font-medium text-due-overdue hover:bg-due-overdue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-due-overdue';
const field =
  'mt-1 w-full rounded-md border border-text-muted/30 bg-surface-card px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30';
const label = 'block text-xs font-semibold uppercase tracking-wider text-text-muted';

// ---------- components ----------

// ---------- M6 tag-style: feature vs. bug ----------
// Colour + icon + text label, so type is never shown by colour alone.
const TYPE_STYLE = {
  feature: {
    label: 'Feature',
    stripe: 'border-l-type-feature',
    badge: 'bg-type-feature/10 text-type-feature',
    icon: (
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    ),
  },
  bug: {
    label: 'Bug',
    stripe: 'border-l-type-bug',
    badge: 'bg-type-bug/10 text-type-bug',
    icon: (
      <>
        <rect x="8" y="6" width="8" height="14" rx="4" />
        <path d="M12 10v6M4 10h4M16 10h4M4 16h4M16 16h4M9 6l-2-3M15 6l2-3" />
      </>
    ),
  },
};

function TypeBadge({ type }) {
  const style = TYPE_STYLE[type] ?? TYPE_STYLE.feature;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium ${style.badge}`}
    >
      <svg
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {style.icon}
      </svg>
      {style.label}
    </span>
  );
}

function Avatar({ name, size = 'h-7 w-7' }) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarStyle(name)}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

function TaskCard({ task, onOpen, onHandoff, highlighted, onCopy }) {
  const style = TYPE_STYLE[task.type] ?? TYPE_STYLE.feature;
  const handoffId = `handoff-${task.id}`;
  const due = dueInfo(task);
  return (
    <li
      className={`rounded-md border border-l-4 ${due.border} ${style.stripe} bg-surface-card transition-shadow hover:shadow-md ${
        highlighted ? 'ring-2 ring-brand-accent' : ''
      }`}
    >
      {/* Main area opens the edit modal. */}
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="w-full rounded-t-md p-3 pb-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label={`Edit ${style.label.toLowerCase()}: ${task.title}`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-text-primary">{task.title}</p>
          <TypeBadge type={task.type} />
        </div>
        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-text-muted">
            {task.description}
          </p>
        )}
      </button>

      {/* Owner row: avatar + "Hand off to..." + due date. */}
      <div className="flex items-center justify-between gap-2 px-3 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={task.assignee} />
          <label htmlFor={handoffId} className="sr-only">
            Hand off {task.title} to
          </label>
          <select
            id={handoffId}
            value={task.assignee}
            onChange={(e) => onHandoff(task.id, e.target.value)}
            title="Hand off to…"
            className="min-w-0 cursor-pointer truncate rounded border border-transparent bg-transparent py-0.5 pr-6 text-xs text-text-primary hover:border-text-muted/30 focus:border-brand-primary focus:outline-none"
          >
            {TEAM.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

                <DueBadge task={task} due={due} />
      </div>
    
	      {/* M10 copy-context: one-click briefing for the AI. */}
      <button
        type="button"
        onClick={() => onCopy(task)}
        className="flex w-full items-center justify-center gap-1.5 rounded-b-md border-t border-text-muted/15 py-1.5 text-xs font-medium text-brand-primary hover:bg-brand-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label={`Copy context for ${task.title}`}
      >
        {COPY_ICON}
        Copy Context
      </button>
</li>
  );
}

// M7 task-owner: strip showing what each teammate is currently driving.
function DriverStrip({ tasks }) {
  return (
    <ul className="mb-4 flex flex-wrap gap-2" aria-label="Who is driving what">
      {TEAM.map((name) => {
        const active = tasks.filter(
          (t) => t.assignee === name && t.status !== 'done',
        ).length;
        return (
          <li
            key={name}
            className="flex items-center gap-2 rounded-full border border-text-muted/20 bg-surface-card py-1 pl-1 pr-3 text-xs text-text-primary"
          >
            <Avatar name={name} size="h-6 w-6" />
            <span>{name}</span>
            <span className="font-mono text-text-muted">{active} active</span>
          </li>
        );
      })}
    </ul>
  );
}

// Small notification that fades in and out (200 ms, per DESIGN.md §7).
function Toast({ message }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-text-primary px-4 py-2 text-sm text-surface-card shadow-lg transition-opacity duration-200 ${
        message ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {message}
    </div>
  );
}

function Column({ stage, tasks, onOpen, onHandoff, highlightId, onCopy }) {
  const headingId = `col-${stage.id}`;
  return (
    <section
      aria-labelledby={headingId}
      className="flex min-h-[16rem] flex-col rounded-lg bg-brand-accent/5 p-3"
    >
      <h2
        id={headingId}
        className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-muted"
      >
        {stage.label}
        <span className="rounded-full bg-surface-card px-2 py-0.5 font-mono text-[11px] text-text-muted">
          {tasks.length}
        </span>
      </h2>

      {tasks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center rounded-md border-2 border-dashed border-text-muted/25 p-4 text-center text-xs text-text-muted">
          Nothing here yet. Add a task to get moving.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpen} onHandoff={onHandoff} highlighted={task.id === highlightId} onCopy={onCopy} />
          ))}
        </ul>
      )}
    </section>
  );
}

// M5 crud-modal: one modal for both create and edit.
function TaskModal({ task, onSave, onDelete, onClose, onCopy }) {
  const [draft, setDraft] = useState(task);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const titleRef = useRef(null);
  const isNew = task.id === null;

  // Focus the title on open; close on Escape.
  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = (key) => (e) =>
    setDraft((d) => ({ ...d, [key]: e.target.value === '' && key === 'dueDate' ? null : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    onSave({ ...draft, title: draft.title.trim(), description: draft.description.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-surface-card p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 id="modal-title" className="flex items-center gap-2 text-lg font-semibold text-text-primary">
            {isNew ? 'New task' : 'Edit task'} <TypeBadge type={draft.type} />
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-text-muted hover:bg-text-muted/10" aria-label="Close">
            ✕
          </button>
        </div>

               <div className="space-y-4">
          <div>
            <label htmlFor="f-title" className={label}>
              Title *
            </label>
            <input
              id="f-title"
              ref={titleRef}
              required
              className={field}
              value={draft.title}
              onChange={update('title')}
              placeholder="e.g. Build the login page"
            />
          </div>

          <div>
            <label htmlFor="f-desc" className={label}>
              Description
            </label>
            <textarea
              id="f-desc"
              rows={3}
              className={field}
              value={draft.description}
              onChange={update('description')}
              placeholder="What needs doing, in a sentence or two."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="f-type" className={label}>
                Type
              </label>
              <select
                id="f-type"
                className={field}
                value={draft.type}
                onChange={update('type')}
              >
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
              </select>
            </div>
            <div>
              <label htmlFor="f-status" className={label}>
                Status
              </label>
              <select
                id="f-status"
                className={field}
                value={draft.status}
                onChange={update('status')}
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-assignee" className={label}>
                Assignee
              </label>
              <select
                id="f-assignee"
                className={field}
                value={draft.assignee}
                onChange={update('assignee')}
              >
                {TEAM.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-due" className={label}>
                Due date
              </label>
              <input
                id="f-due"
                type="date"
                className={field}
                value={draft.dueDate ?? ''}
                onChange={update('dueDate')}
              />
            </div>
          </div>

                    {/* M9 context: curated briefing, saved with the task. */}
          <div className="rounded-md border border-text-muted/20 bg-surface-page p-3">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor="f-context" className={label}>
                Context (Markdown)
              </label>
              <span className="text-[11px] text-text-muted" aria-live="polite">
                {draft.contextUpdatedAt
                  ? `Last updated ${timeAgo(draft.contextUpdatedAt)}`
                  : 'Not updated yet'}
              </span>
            </div>
            <p id="f-context-help" className="mt-1 text-xs text-text-muted">
              A paste-ready briefing for your AI or a teammate.
            </p>
            <textarea
              id="f-context"
              rows={8}
              aria-describedby="f-context-help"
              className={`${field} font-mono text-xs leading-relaxed`}
              value={draft.context ?? ''}
              placeholder={CONTEXT_TEMPLATE}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  context: e.target.value,
                  contextUpdatedAt: new Date().toISOString(),
                }))
              }
            />
            <div className="mt-3">
              <label htmlFor="f-tool" className={label}>
                AI tool (optional)
              </label>
              <select
                id="f-tool"
                className={field}
                value={draft.contextTool ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    contextTool: e.target.value || null,
                    contextUpdatedAt: new Date().toISOString(),
                  }))
                }
              >
                <option value="">Not set</option>
                {CONTEXT_TOOLS.map((tool) => (
                  <option key={tool} value={tool}>
                    {tool}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer: delete on the left, cancel/save on the right. */}
        <div className="mt-6 flex items-center justify-between gap-2">
          <div>
            {!isNew && !confirmingDelete && (
              <button
                type="button"
                className={btnDanger}
                onClick={() => setConfirmingDelete(true)}
              >
                Delete
              </button>
            )}
            {!isNew && confirmingDelete && (
              <div className="flex items-center gap-2" role="alert">
                <span className="text-xs text-text-primary">
                  Delete "{task.title}"? This can't be undone.
                </span>
                <button
                  type="button"
                  className={btnDanger}
                  onClick={() => onDelete(task.id)}
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  className="text-xs text-text-muted underline"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Keep
                </button>
              </div>
            )}
          </div>
          {!confirmingDelete && (
            <div className="flex gap-2">
              <button type="button" className={btnGhost} onClick={() => onCopy(draft)}>Copy Context</button>
              <button type="button" className={btnGhost} onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className={btnPrimary}
                disabled={!draft.title.trim()}
              >
                {isNew ? 'Add task' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default function App() {
  // M4 data-model: tasks persisted to localStorage, seeded on first load.
  const [tasks, setTasks] = useLocalStorage('vibetracker.tasks', SEED_TASKS);

  // M5 crud-modal: the task being edited (null = modal closed).
  const [editing, setEditing] = useState(null);

  // M11 anchors: deliverable links, saved to localStorage.
  const [anchors, setAnchors] = useLocalStorage('vibetracker.anchors', DEFAULT_ANCHORS);

  const saveTask = (task) => {
    if (task.id === null) {
      setTasks((prev) => [...prev, { ...task, id: newId() }]);
    } else {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }
    setEditing(null);
  };

  // M7 task-owner: reassign a task and acknowledge it visually.
  const [toast, setToast] = useState('');
  const [highlightId, setHighlightId] = useState(null);
  const toastTimer = useRef(null);

  const handoffTask = (id, name) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, assignee: name } : t)),
    );
    setToast(`Handed off to ${name}.`);
    setHighlightId(id);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast('');
      setHighlightId(null);
    }, 2500);
  };

    // M10 copy-context: copy the briefing and confirm with a toast.
  const copyContext = async (task) => {
    const ok = await copyText(taskToMarkdown(task));
    setToast(
      ok
        ? 'Context copied. Paste it into your AI to pick up where you left off.'
        : "Couldn't copy. Try again.",
    );
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  };

const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setEditing(null);
  };

  // TODO M11 anchors:
  //   const [anchors, setAnchors] = useLocalStorage('vibetracker.anchors', [...]);

  return (
    <div className="min-h-screen bg-surface-page p-6 font-sans text-text-primary">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-brand-primary">
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            Amira's Kanban
          </h1>
          <p className="text-sm text-text-muted">
            Where every prompt finds its way home.
          </p>
        </div>
                <div className="flex items-center gap-2">
          {/* M12 header buttons */}
          <ThemeToggle />
          <button
            type="button"
            className={btnPrimary}
            onClick={() => setEditing(blankTask())}
          >
            + New task
          </button>
        </div>
      </header>

      {/* TODO M11 anchors: render the Anchor Board above the board. */}

      {/* M4 data-model: the four-column Kanban board. */}
      <AnchorBoard anchors={anchors} setAnchors={setAnchors} />
      <DriverStrip tasks={tasks} />
      <main className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {STAGES.map((stage) => (
          <Column
            key={stage.id}
            stage={stage}
            tasks={tasks.filter((t) => t.status === stage.id)}
            onOpen={setEditing} onHandoff={handoffTask} onCopy={copyContext} highlightId={highlightId}
          />
        ))}
      </main>

      <Toast message={toast} />
      {editing && (
        <TaskModal
          key={editing.id ?? 'new'}
          task={editing}
          onSave={saveTask}
          onDelete={deleteTask}
          onCopy={copyContext}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}