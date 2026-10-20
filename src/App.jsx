import { useState, useEffect } from 'react';

/**
 * Koki's Kanban — Vibecoding Project Tracker.
 *
 * Build sequence in Phase 3:
 *   - M4  data-model    : four columns + task cards            ✅
 *   - M5  crud-modal    : "+" button modal and edit-on-click modal.
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

// PRD §8 — solo project, so one assignee.
export const TEAM = ['Amira Koki'];

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

// ---------- components ----------

function TaskCard({ task }) {
  return (
    <li className="rounded-md border border-text-muted/20 bg-surface-card p-3 transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-text-primary">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-text-muted">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs text-text-muted">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-[10px] font-semibold text-brand-primary"
            aria-hidden="true"
          >
            {initials(task.assignee)}
          </span>
          <span>{task.assignee}</span>
        </span>

        {task.dueDate && (
          <span className="font-mono text-xs text-text-muted">
            <span className="sr-only">Due </span>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </li>
  );
}

function Column({ stage, tasks }) {
  const headingId = `col-${stage.id}`;
  return (
    <section
      aria-labelledby={headingId}
      className="flex min-h-[16rem] flex-col rounded-lg bg-text-muted/5 p-3"
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
            <TaskCard key={task.id} task={task} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function App() {
  // M4 data-model: tasks persisted to localStorage, seeded on first load.
  const [tasks, setTasks] = useLocalStorage('vibetracker.tasks', SEED_TASKS);

  // TODO M5 crud-modal:
  //   const [editing, setEditing] = useState(null);
  //
  // TODO M11 anchors:
  //   const [anchors, setAnchors] = useLocalStorage('vibetracker.anchors', [...]);

  return (
    <div className="min-h-screen bg-surface-page p-6 font-sans text-text-primary">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-brand-primary">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            Koki's Kanban
          </h1>
          <p className="text-sm text-text-muted">Where every prompt finds its way home.</p>
        </div>
        {/* TODO M5 crud-modal: "+ New task" button goes here. */}
      </header>

      {/* TODO M11 anchors: render the Anchor Board (Presentation / Demo / Report / Documentation) above the board. */}

      {/* M4 data-model: the four-column Kanban board. */}
      <main className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage) => (
          <Column
            key={stage.id}
            stage={stage}
            tasks={tasks.filter((t) => t.status === stage.id)}
          />
        ))}
      </main>
    </div>
  );
}