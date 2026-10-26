/**
 * AnchorFlow data model and pure helpers (no React here).
 * See PRD.md §5 for the original locked Task model; fields added for the
 * coursework are marked "added".
 */

// The four columns, in order (PRD §7). Do not invent new ones.
export const STAGES = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

export const CONTEXT_TOOLS = ['Claude', 'ChatGPT', 'Cursor', 'Lovable', 'Replit', 'Other'];

// Prompting techniques from the client's Intent Coding talk.
export const TECHNIQUES = [
  'TACO structured',
  'Zero-shot',
  'One-shot',
  'Few-shot',
  'Chain of thought',
  'Tree of thoughts',
  'Meta-prompting',
];

// added: outcome of the last prompt (hackathon brief: "prompt + AI tool + outcome").
export const OUTCOMES = [
  { id: '', label: 'Not tried yet' },
  { id: 'worked', label: 'Worked' },
  { id: 'partly', label: 'Partly worked' },
  { id: 'failed', label: "Didn't work" },
];

// Pre-filled into every new task so the briefing has a shape (chunking: 4 headed parts).
export const CONTEXT_TEMPLATE = `## Background
What is this task and why does it matter?

## Constraints
Tech stack, design rules, things that must not change.

## Tried so far
Prompts used, what worked, what didn't.

## Pick up
The very next step for whoever (or whichever AI) continues.`;

// ---------- dates ----------
const pad = (x) => String(x).padStart(2, '0');

export function isoDaysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isoTimeDaysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function timeAgo(iso) {
  if (!iso) return null;
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

// ---------- due state (M8) ----------
// Colour + icon + text label, so the state is never shown by colour alone.
export function dueState(task) {
  if (task.status === 'done') return { state: 'neutral', label: 'Done' };
  if (!task.dueDate) return { state: 'none', label: 'No date' };
  const [y, m, d] = task.dueDate.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return { state: 'overdue', label: 'Overdue' };
  if (days <= 1) return { state: 'warning', label: days === 0 ? 'Due today' : 'Due tomorrow' };
  return { state: 'safe', label: formatDate(task.dueDate) };
}

// ---------- ids ----------
export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// Human-friendly task key, e.g. AF-7, so people can say "pick up AF-7".
export function nextKey(tasks) {
  const max = tasks.reduce((n, t) => {
    const m = /^AF-(\d+)$/.exec(t.key || '');
    return m ? Math.max(n, Number(m[1])) : n;
  }, 0);
  return `AF-${max + 1}`;
}

export function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0].toUpperCase())
      .slice(0, 2)
      .join('') || '?'
  );
}

// Roughly 4 characters per token (OpenAI guidance); good enough for a hint.
export function estimateTokens(text = '') {
  return Math.ceil(text.trim().length / 4);
}

export function blankTask(tasks, assignee, status = 'todo') {
  return {
    id: null, // null = not saved yet (create mode)
    key: nextKey(tasks),
    title: '',
    description: '',
    type: 'feature',
    status,
    assignee: assignee ?? '',
    dueDate: null,
    createdDate: isoDaysFromNow(0),
    context: CONTEXT_TEMPLATE,
    contextTool: null,
    contextUpdatedAt: null,
    outcome: { result: '', note: '', updatedAt: null },
    checklist: [],
    doneAt: null,
    archivedAt: null,
  };
}

// Keep doneAt in step with the status, so auto-archive knows how long a task has been done.
export function withStatus(task, status) {
  if (status === task.status) return task;
  return {
    ...task,
    status,
    doneAt: status === 'done' ? task.doneAt || new Date().toISOString() : null,
  };
}

// Fill in any fields that older saved tasks (hackathon version) don't have.
export function normaliseTask(t, i = 0) {
  return {
    key: t.key || `AF-${i + 1}`,
    description: '',
    context: '',
    contextTool: null,
    contextUpdatedAt: null,
    checklist: [],
    doneAt: t.status === 'done' ? t.doneAt || new Date().toISOString() : null,
    archivedAt: null,
    ...t,
    outcome: { result: '', note: '', updatedAt: null, ...(t.outcome || {}) },
  };
}

// ---------- the "Copy Context" briefing (M10) ----------
// Structured with the client's TACO framework (Task, Actor, Context, Output).
// The task goes FIRST and the next step goes LAST, because models attend most
// to the start and end of a prompt (Liu et al., 2024 "Lost in the middle").
export function taskToBriefing(task) {
  const stage = STAGES.find((s) => s.id === task.status);
  const context = (task.context || '').trim();
  const pickUp = /##\s*Pick up\s*\n([\s\S]*?)(\n##|$)/i.exec(context);
  const nextStep = pickUp && pickUp[1].trim() ? pickUp[1].trim() : 'Help me decide and complete the next step.';
  const outcome = OUTCOMES.find((o) => o.id === task.outcome?.result);
  const meta = [
    `Type: ${task.type === 'bug' ? 'Bug' : 'Feature'}`,
    `Status: ${stage ? stage.label : task.status}`,
    task.assignee ? `Owner: ${task.assignee}` : null,
    task.dueDate ? `Due: ${formatDate(task.dueDate)}` : null,
    task.contextTool ? `Last AI tool: ${task.contextTool}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const parts = [
    `# Task: ${task.title} (${task.key})`,
    meta,
    '',
    task.description || '',
    '',
    '## Actor',
    'Act as a senior developer joining this project part-way through. Be concise and practical.',
    '',
    '## Context',
    context || '_No context recorded yet._',
  ];
  if (task.checklist?.length) {
    parts.push('', '## Ready when');
    task.checklist.forEach((c) => parts.push(`- [${c.done ? 'x' : ' '}] ${c.text}`));
  }
  if (outcome && outcome.id) {
    parts.push('', '## Last outcome', `${outcome.label}${task.outcome.note ? `: ${task.outcome.note}` : ''}`);
  }
  parts.push(
    '',
    '## Output format',
    'Reply with: (1) your understanding in two sentences, (2) the next step, (3) any code changes as small, clearly labelled snippets.',
    '',
    '## Your task now',
    nextStep,
  );
  return parts.join('\n').replace(/\n{3,}/g, '\n\n');
}

// ---------- defaults & sample data ----------
export const DEFAULT_TEAM = [
  { id: 'm-amira', name: 'Amira Koki', email: 'amira@example.com', github: 'amira-koki' },
  { id: 'm-jordan', name: 'Jordan Lee', email: 'jordan@example.com', github: 'jordanlee' },
  { id: 'm-priya', name: 'Priya Shah', email: 'priya@example.com', github: 'priyashah' },
];

export const DEFAULT_ANCHORS = [
  { id: 'presentation', label: 'Presentation', url: null },
  { id: 'demo', label: 'Demo', url: null },
  { id: 'report', label: 'Report', url: null },
  { id: 'documentation', label: 'Documentation', url: null },
];

export const DEFAULT_SETTINGS = {
  theme: 'system', // 'system' | 'light' | 'dark'
  sound: false, // off by default: no surprise noise in open-plan offices
  autoArchiveDays: 14, // 0 = never
  deliverablesOpen: false,
  collapsed: { todo: false, 'in-progress': false, review: false, done: false },
};

export function seedTasks() {
  return [
    {
      id: 'seed-1',
      key: 'AF-1',
      title: 'Fix login form crashing on empty email',
      description: 'Submitting the form with an empty email field throws an error and the page goes blank.',
      type: 'bug',
      status: 'in-progress',
      assignee: 'Jordan Lee',
      dueDate: isoDaysFromNow(-1),
      createdDate: isoDaysFromNow(-3),
      context: `## Background
The sign-in form crashes when the email field is empty. Users see a blank page.

## Constraints
React + Vite. Keep the existing form layout and validation messages.

## Tried so far
Asked ChatGPT to add optional chaining on \`email.trim()\`. The crash stopped, but the error message no longer shows.
Error: TypeError: Cannot read properties of undefined (reading 'trim') at validate (LoginForm.jsx:42)

## Pick up
Make empty-email validation show "Enter your email" without crashing, then add a test for it.`,
      contextTool: 'ChatGPT',
      contextUpdatedAt: isoTimeDaysAgo(0.1),
      outcome: { result: 'partly', note: 'Crash fixed, but the validation message disappeared.', updatedAt: isoTimeDaysAgo(0.1) },
      checklist: [
        { id: 'c1', text: 'No crash on empty email', done: true },
        { id: 'c2', text: '"Enter your email" message shows', done: false },
        { id: 'c3', text: 'Unit test added', done: false },
      ],
      doneAt: null,
      archivedAt: null,
    },
    {
      id: 'seed-2',
      key: 'AF-2',
      title: 'Build the onboarding checklist',
      description: 'A three-step checklist that new users see on their first visit.',
      type: 'feature',
      status: 'in-progress',
      assignee: 'Amira Koki',
      dueDate: isoDaysFromNow(0),
      createdDate: isoDaysFromNow(-2),
      context: `## Background
New users don't know where to start.

## Constraints
Must be dismissible and remember that it was dismissed.

## Tried so far
Claude produced a first version; the dismiss button isn't keyboard accessible yet.

## Pick up
Make the dismiss button reachable by keyboard and announce the change to screen readers.`,
      contextTool: 'Claude',
      contextUpdatedAt: isoTimeDaysAgo(0.5),
      outcome: { result: 'worked', note: 'Layout and copy accepted by the product owner.', updatedAt: isoTimeDaysAgo(0.5) },
      checklist: [
        { id: 'c1', text: 'Three steps shown', done: true },
        { id: 'c2', text: 'Dismiss works by keyboard', done: false },
      ],
      doneAt: null,
      archivedAt: null,
    },
    {
      id: 'seed-3',
      key: 'AF-3',
      title: 'Write the API error messages',
      description: 'Plain-English messages for the five most common API errors.',
      type: 'feature',
      status: 'todo',
      assignee: 'Priya Shah',
      dueDate: isoDaysFromNow(5),
      createdDate: isoDaysFromNow(0),
      context: '',
      contextTool: null,
      contextUpdatedAt: null,
      outcome: { result: '', note: '', updatedAt: null },
      checklist: [],
      doneAt: null,
      archivedAt: null,
    },
    {
      id: 'seed-4',
      key: 'AF-4',
      title: 'Dark mode toggle',
      description: 'Let users switch between light and dark themes.',
      type: 'feature',
      status: 'todo',
      assignee: 'Amira Koki',
      dueDate: isoDaysFromNow(3),
      createdDate: isoDaysFromNow(-1),
      context: '',
      contextTool: null,
      contextUpdatedAt: null,
      outcome: { result: '', note: '', updatedAt: null },
      checklist: [],
      doneAt: null,
      archivedAt: null,
    },
    {
      id: 'seed-5',
      key: 'AF-5',
      title: 'Fix chart labels overlapping on phones',
      description: 'At 360px wide the x-axis labels overlap.',
      type: 'bug',
      status: 'review',
      assignee: 'Amira Koki',
      dueDate: isoDaysFromNow(1),
      createdDate: isoDaysFromNow(-4),
      context: `## Background
Labels overlap on small screens.

## Tried so far
Cursor suggested rotating labels 45°. Works, but QA should check readability.

## Pick up
QA: check at 360px and 768px, then approve or send back.`,
      contextTool: 'Cursor',
      contextUpdatedAt: isoTimeDaysAgo(1),
      outcome: { result: 'worked', note: 'Rotated labels; waiting for QA.', updatedAt: isoTimeDaysAgo(1) },
      checklist: [],
      doneAt: null,
      archivedAt: null,
    },
    {
      id: 'seed-6',
      key: 'AF-6',
      title: 'Set up the design tokens',
      description: 'Colour and font tokens shared by light and dark mode.',
      type: 'feature',
      status: 'done',
      assignee: 'Priya Shah',
      dueDate: isoDaysFromNow(-2),
      createdDate: isoDaysFromNow(-6),
      context: '',
      contextTool: 'Claude',
      contextUpdatedAt: isoTimeDaysAgo(2),
      outcome: { result: 'worked', note: '', updatedAt: isoTimeDaysAgo(2) },
      checklist: [],
      doneAt: isoTimeDaysAgo(2),
      archivedAt: null,
    },
    {
      id: 'seed-7',
      key: 'AF-7',
      title: 'Create the project repository',
      description: 'Fork the starter repo and connect it to Vercel.',
      type: 'feature',
      status: 'done',
      assignee: 'Amira Koki',
      dueDate: isoDaysFromNow(-20),
      createdDate: isoDaysFromNow(-22),
      context: '',
      contextTool: null,
      contextUpdatedAt: null,
      outcome: { result: 'worked', note: '', updatedAt: null },
      checklist: [],
      doneAt: isoTimeDaysAgo(20), // older than the auto-archive limit, so it lands in the Archive
      archivedAt: null,
    },
  ];
}

export function seedLibrary() {
  return [
    {
      id: 'r-1',
      title: 'Debug an error (TACO)',
      technique: 'TACO structured',
      tool: 'ChatGPT',
      prompt: `Task: Find and fix the cause of this error without changing unrelated code.
Actor: You are a senior React developer.
Context: [paste the error message, the file and what you already tried]
Output: Explain the cause in one sentence, then give the corrected code only.`,
      createdAt: isoTimeDaysAgo(3),
    },
    {
      id: 'r-2',
      title: 'Write unit tests from examples',
      technique: 'Few-shot',
      tool: 'Claude',
      prompt: `Write Vitest unit tests for the function below, in the same style as these two examples:
[example test 1]
[example test 2]
Function: [paste function]`,
      createdAt: isoTimeDaysAgo(2),
    },
    {
      id: 'r-3',
      title: 'Improve my prompt first',
      technique: 'Meta-prompting',
      tool: 'Claude',
      prompt: `Before answering, rewrite my request as a clearer, more specific prompt and ask me any question you need. Then answer the improved prompt.
My request: [paste request]`,
      createdAt: isoTimeDaysAgo(1),
    },
  ];
}
