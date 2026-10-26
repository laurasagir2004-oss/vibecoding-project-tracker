import { useRef, useState } from 'react';
import { A11Y_DEFAULTS, CONTEXT_TOOLS, ROLES, TECHNIQUES, formatDate, memberLabel, newId } from '../lib/model.js';
import { Avatar, Icon, OutcomeBadge, TypeBadge, btnDanger, btnGhost, btnPrimary, field, iconBtn, labelCls, linkCls, useDialog } from './ui.jsx';

function ViewHeader({ title, children, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
        <p className="max-w-2xl text-sm text-text-muted">{children}</p>
      </div>
      {action}
    </div>
  );
}

const card = 'rounded-lg border border-text-muted/20 bg-surface-card';

// ---------- Archive ----------
// Read-only view of an archived task: look up an old prompt or outcome without putting it back on the board.
function ArchivedTaskDialog({ task, team, onClose, onCopy, onRestore }) {
  const ref = useRef(null);
  useDialog(ref, onClose);
  const owner = team.find((m) => m.name === task.assignee);
  const done = task.checklist?.filter((c) => c.done).length ?? 0;
  const Row = ({ label, children }) => (
    <div>
      <dt className={labelCls}>{label}</dt>
      <dd className="mt-1 text-sm text-text-primary">{children}</dd>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="archived-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-lg bg-surface-card p-5 shadow-xl sm:rounded-lg sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="archived-title" className="flex flex-wrap items-center gap-2 text-lg font-semibold text-text-primary">
            <span className="font-mono text-sm font-normal text-text-muted">{task.key}</span>
            {task.title}
            <TypeBadge type={task.type} />
          </h2>
          <button type="button" className={iconBtn} aria-label="Close" onClick={onClose} data-autofocus>
            <Icon name="x" size={18} />
          </button>
        </div>
        <p className="mb-4 rounded-md bg-surface-page px-3 py-2 text-xs text-text-muted">
          Archived {formatDate(task.archivedAt)}. Read-only: restore it to the board to make changes.
        </p>
        <dl className="space-y-4">
          {task.description && <Row label="Description">{task.description}</Row>}
          <Row label="Owner">{owner ? memberLabel(owner) : task.assignee || 'Unassigned'}</Row>
          <Row label="Due date">{task.dueDate ? formatDate(task.dueDate) : 'None'}</Row>
          {task.checklist?.length > 0 && (
            <Row label={`Ready when (${done} of ${task.checklist.length} done)`}>
              <ul className="space-y-1">
                {task.checklist.map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <Icon name={c.done ? 'check' : 'x'} size={14} />
                    <span className={c.done ? '' : 'text-text-muted'}>{c.text}</span>
                    <span className="sr-only">{c.done ? '(done)' : '(not done)'}</span>
                  </li>
                ))}
              </ul>
            </Row>
          )}
          <Row label={`Context${task.contextTool ? ` · ${task.contextTool}` : ''}`}>
            {task.context?.trim() ? (
              <pre className="whitespace-pre-wrap rounded-md border border-text-muted/20 bg-surface-page p-3 font-mono text-xs leading-relaxed">{task.context}</pre>
            ) : (
              <span className="text-text-muted">No context saved.</span>
            )}
          </Row>
          <Row label="Outcome">
            <span className="flex flex-wrap items-center gap-2">
              {task.outcome?.result ? <OutcomeBadge result={task.outcome.result} /> : <span className="text-text-muted">Not recorded</span>}
              {task.outcome?.note && <span>{task.outcome.note}</span>}
            </span>
          </Row>
        </dl>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className={btnGhost} onClick={() => onCopy(task)}>
            <Icon name="copy" size={14} />
            Copy context
          </button>
          <button type="button" className={btnPrimary} onClick={() => { onRestore(task.id); onClose(); }}>
            <Icon name="restore" size={14} />
            Restore to board
          </button>
        </div>
      </div>
    </div>
  );
}

export function ArchiveView({ tasks, days, onRestore, onDelete, onCopy, team }) {
  const [confirm, setConfirm] = useState(null);
  const [viewing, setViewing] = useState(null);
  return (
    <div>
      <ViewHeader title="Archive">
        Finished tasks move here so the board stays short.{' '}
        {days > 0 ? `Done tasks are archived automatically after ${days} days` : 'Automatic archiving is off'}; change this in
        Settings.
      </ViewHeader>
      {tasks.length === 0 ? (
        <p className={`${card} p-6 text-center text-sm text-text-muted`}>No archived tasks yet. Archive a task from the Done column.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className={`${card} flex flex-wrap items-center gap-3 p-3`}>
              <span className="font-mono text-xs text-text-muted">{t.key}</span>
              <button
                type="button"
                onClick={() => setViewing(t)}
                className={`min-w-[12rem] flex-1 rounded text-left text-sm font-medium text-text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent`}
              >
                {t.title}
                <span className="sr-only"> (view details)</span>
              </button>
              <TypeBadge type={t.type} />
              <span className="text-xs text-text-muted">
                {t.assignee || 'Unassigned'} · archived {formatDate(t.archivedAt)}
              </span>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnGhost} onClick={() => setViewing(t)} aria-label={`View details of ${t.key}`}>
                  <Icon name="eye" size={14} />
                  View
                </button>
                <button type="button" className={btnGhost} onClick={() => onRestore(t.id)} aria-label={`Restore ${t.key} to the board`}>
                  <Icon name="restore" size={14} />
                  Restore
                </button>
                {confirm === t.id ? (
                  <span role="alert" className="flex items-center gap-2">
                    <span className="text-xs text-text-primary">Delete for good?</span>
                    <button type="button" className={btnDanger} onClick={() => onDelete(t.id)}>Yes, delete</button>
                    <button type="button" className={btnGhost} onClick={() => setConfirm(null)}>Keep</button>
                  </span>
                ) : (
                  <button type="button" className={btnDanger} onClick={() => setConfirm(t.id)} aria-label={`Delete ${t.key} permanently`}>
                    <Icon name="trash" size={14} />
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {viewing && (
        <ArchivedTaskDialog task={viewing} team={team} onClose={() => setViewing(null)} onCopy={onCopy} onRestore={onRestore} />
      )}
    </div>
  );
}

// ---------- Team ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_MEMBER = { name: '', role: '', email: '', github: '' };

export function TeamView({ team, tasks, onAdd, onUpdate, onRemove }) {
  const [form, setForm] = useState(EMPTY_MEMBER);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    const err = {};
    const name = form.name.trim();
    if (!name) err.name = 'Enter a name.';
    else if (team.some((m) => m.id !== editingId && m.name.toLowerCase() === name.toLowerCase())) err.name = 'Someone with this name is already in the team.';
    if (!form.role) err.role = 'Choose a role.';
    if (!form.email.trim()) err.email = 'Enter an email address.';
    else if (!EMAIL_RE.test(form.email.trim())) err.email = 'Enter an email address like name@example.com.';
    setErrors(err);
    if (Object.keys(err).length) return;
    const details = { name, role: form.role, email: form.email.trim(), github: form.github.trim().replace(/^@/, '') };
    if (editingId) {
      const before = team.find((m) => m.id === editingId);
      onUpdate(before, { ...before, ...details });
      setEditingId(null);
    } else {
      onAdd({ id: newId(), ...details });
    }
    setForm(EMPTY_MEMBER);
    nameRef.current?.focus();
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setForm({ name: m.name, role: m.role || '', email: m.email, github: m.github || '' });
    setErrors({});
    nameRef.current?.focus();
  };
  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_MEMBER);
    setErrors({});
  };

  return (
    <div>
      <ViewHeader title="Team">
        Everyone who can own a task. Their role shows who you are handing work to; name and email let teammates contact a task's owner; the GitHub handle links to their work.
      </ViewHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ul className="space-y-2" aria-label="Team members">
          {team.map((m, i) => {
            const active = tasks.filter((t) => t.assignee === m.name && t.status !== 'done').length;
            return (
              <li key={m.id} className={`${card} flex flex-wrap items-center gap-3 p-3`}>
                <Avatar name={m.name} index={i} size="h-9 w-9" />
                <div className="min-w-[10rem] flex-1">
                  <p className="text-sm font-medium text-text-primary">{m.name}</p>
                  {m.role && <p className="text-xs text-text-muted">{m.role}</p>}
                  <p className="flex flex-wrap gap-x-3 text-xs">
                    <a href={`mailto:${m.email}`} className={linkCls}>{m.email}</a>
                    {m.github && (
                      <a href={`https://github.com/${m.github}`} target="_blank" rel="noreferrer" className={linkCls}>
                        @{m.github}
                        <span className="sr-only"> on GitHub (opens in a new tab)</span>
                      </a>
                    )}
                  </p>
                </div>
                <span className="font-mono text-xs text-text-muted">{active} active</span>
                <button type="button" className={btnGhost} onClick={() => startEdit(m)} aria-label={`Edit ${m.name}'s details`}>
                  <Icon name="edit" size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  className={btnDanger}
                  onClick={() => onRemove(m)}
                  disabled={active > 0 || team.length === 1}
                  aria-describedby={active > 0 ? `why-${m.id}` : undefined}
                >
                  Remove
                </button>
                {active > 0 && (
                  <span id={`why-${m.id}`} className="w-full text-xs text-text-muted">
                    Hand off {m.name.split(' ')[0]}'s {active} active task{active === 1 ? '' : 's'} before removing them.
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <form onSubmit={submit} noValidate className={`${card} h-fit space-y-3 p-4`} aria-labelledby="add-member-title">
          <h2 id="add-member-title" className="text-base font-semibold text-text-primary">
            {editingId ? 'Edit team member' : 'Add a team member'}
          </h2>
          {[
            ['name', 'Name', 'text', 'e.g. Sam Patel', true, 'name'],
            ['role'],
            ['email', 'Email', 'email', 'sam@example.com', true, 'email'],
            ['github', 'GitHub handle (optional)', 'text', 'sampatel', false, 'off'],
          ].map(([key, label, type, ph, req, auto]) => (key === 'role' ? (
            <div key="role">
              <label htmlFor="m-role" className={labelCls}>
                Role<span className="sr-only"> (required)</span>
              </label>
              <select
                id="m-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                aria-invalid={!!errors.role}
                aria-describedby={errors.role ? 'm-role-err' : undefined}
                className={`${field} ${errors.role ? 'border-due-overdue' : ''}`}
              >
                <option value="">Choose a role…</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.role && (
                <p id="m-role-err" className="mt-1 flex items-center gap-1 text-xs text-due-overdue">
                  <Icon name="overdue" size={12} />
                  {errors.role}
                </p>
              )}
            </div>
          ) : (
            <div key={key}>
              <label htmlFor={`m-${key}`} className={labelCls}>
                {label}
                {req && <span className="sr-only"> (required)</span>}
              </label>
              <input
                id={`m-${key}`}
                ref={key === 'name' ? nameRef : undefined}
                type={type}
                autoComplete={auto}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={ph}
                aria-invalid={!!errors[key]}
                aria-describedby={errors[key] ? `m-${key}-err` : undefined}
                className={`${field} ${errors[key] ? 'border-due-overdue' : ''}`}
              />
              {errors[key] && (
                <p id={`m-${key}-err`} className="mt-1 flex items-center gap-1 text-xs text-due-overdue">
                  <Icon name="overdue" size={12} />
                  {errors[key]}
                </p>
              )}
            </div>
          )))}
          {editingId ? (
            <div className="flex gap-2">
              <button type="button" className={`${btnGhost} flex-1`} onClick={cancelEdit}>
                Cancel
              </button>
              <button type="submit" className={`${btnPrimary} flex-1`}>
                Save changes
              </button>
            </div>
          ) : (
            <button type="submit" className={`${btnPrimary} w-full`}>
              <Icon name="plus" size={16} />
              Add member
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

// ---------- Prompt library (the "investment" step of the Hooked model) ----------
function RecipeForm({ recipe, onSave, onClose }) {
  const [draft, setDraft] = useState(recipe);
  const ref = useRef(null);
  useDialog(ref, onClose);
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-lg bg-surface-card p-5 shadow-xl sm:rounded-lg"
      >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.title.trim() && draft.prompt.trim()) onSave({ ...draft, title: draft.title.trim() });
        }}
      >
        <h2 id="recipe-title" className="text-lg font-semibold text-text-primary">{recipe.createdAt ? 'Edit prompt' : 'New prompt'}</h2>
        <div>
          <label htmlFor="r-title" className={labelCls}>Name <span className="sr-only">(required)</span></label>
          <input id="r-title" data-autofocus required className={field} value={draft.title} onChange={set('title')} placeholder="e.g. Debug an error" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="r-tech" className={labelCls}>Technique</label>
            <select id="r-tech" className={field} value={draft.technique} onChange={set('technique')}>
              {TECHNIQUES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="r-tool" className={labelCls}>Works well in</label>
            <select id="r-tool" className={field} value={draft.tool} onChange={set('tool')}>
              {CONTEXT_TOOLS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="r-prompt" className={labelCls}>Prompt <span className="sr-only">(required)</span></label>
          <textarea id="r-prompt" required rows={8} className={`${field} font-mono text-xs leading-relaxed`} value={draft.prompt} onChange={set('prompt')} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary} disabled={!draft.title.trim() || !draft.prompt.trim()}>Save prompt</button>
        </div>
      </form>
      </div>
    </div>
  );
}

export function LibraryView({ library, setLibrary, onCopy, notify }) {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const shown = library.filter((r) => `${r.title} ${r.technique} ${r.prompt}`.toLowerCase().includes(q.trim().toLowerCase()));

  const save = (r) => {
    setLibrary((prev) => (prev.some((x) => x.id === r.id) ? prev.map((x) => (x.id === r.id ? r : x)) : [{ ...r, createdAt: new Date().toISOString() }, ...prev]));
    setEditing(null);
    notify('Prompt saved to the library.');
  };

  return (
    <div>
      <ViewHeader
        title="Prompt library"
        action={
          <button type="button" className={btnPrimary} onClick={() => setEditing({ id: newId(), title: '', technique: TECHNIQUES[0], tool: 'Claude', prompt: '', createdAt: null })}>
            <Icon name="plus" size={16} />
            New prompt
          </button>
        }
      >
        Prompts that worked, saved for the whole team to reuse instead of starting from scratch.
      </ViewHeader>
      <div className="relative mb-4 max-w-md">
        <label htmlFor="lib-search" className="sr-only">Search prompts</label>
        <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input id="lib-search" type="search" className={`${field} mt-0 pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search prompts…" />
      </div>
      {shown.length === 0 ? (
        <p className={`${card} p-6 text-center text-sm text-text-muted`}>
          {library.length ? 'No prompts match your search.' : 'No prompts saved yet. Add one, or use "Save to prompt library" inside a task.'}
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown.map((r) => (
            <li key={r.id} className={`${card} flex flex-col p-4`}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="flex-1 text-sm font-semibold text-text-primary">{r.title}</h2>
                <span className="rounded bg-text-muted/10 px-1.5 py-0.5 text-xs font-medium text-text-primary">{r.technique}</span>
                <span className="text-xs text-text-muted">{r.tool}</span>
              </div>
              <pre className="mt-2 line-clamp-5 whitespace-pre-wrap rounded bg-surface-page p-2 font-mono text-xs text-text-primary">{r.prompt}</pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={btnPrimary} onClick={() => onCopy(r.prompt, 'Prompt copied. Paste it into your AI tool.')} aria-label={`Copy prompt: ${r.title}`}>
                  <Icon name="copy" size={14} />
                  Copy
                </button>
                <button type="button" className={btnGhost} onClick={() => setEditing(r)} aria-label={`Edit prompt: ${r.title}`}>Edit</button>
                {confirm === r.id ? (
                  <span role="alert" className="flex items-center gap-2">
                    <span className="text-xs text-text-primary">Delete this prompt?</span>
                    <button type="button" className={btnDanger} onClick={() => setLibrary((p) => p.filter((x) => x.id !== r.id))}>Yes, delete</button>
                    <button type="button" className={btnGhost} onClick={() => setConfirm(null)}>Keep</button>
                  </span>
                ) : (
                  <button type="button" className={btnDanger} onClick={() => setConfirm(r.id)} aria-label={`Delete prompt: ${r.title}`}>Delete</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <RecipeForm recipe={editing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

// ---------- Settings ----------
// A row of radio "pills" (same pattern as the theme choice).
function Choice({ name, legend, hint, options, value, onChange }) {
  return (
    <fieldset className="mt-3 first:mt-1">
      <legend className="text-sm font-medium text-text-primary">{legend}</legend>
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map(([id, label]) => (
          <label
            key={id}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm touch:min-h-[44px] focus-within:ring-2 focus-within:ring-brand-accent ${
              value === id ? 'border-brand-primary bg-brand-primary text-surface-card' : 'border-text-muted/30 text-text-primary'
            }`}
          >
            <input type="radio" name={name} className="sr-only" checked={value === id} onChange={() => onChange(id)} />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SettingsView({ settings, setSettings, onReset }) {
  const [confirm, setConfirm] = useState(false);
  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const a11yChanged = Object.keys(A11Y_DEFAULTS).some((k) => settings[k] !== A11Y_DEFAULTS[k]);
  return (
    <div>
      <ViewHeader title="Settings">Make AnchorFlow work the way you like. Changes save automatically.</ViewHeader>
      <div className="max-w-xl space-y-4">
        <fieldset className={`${card} p-4`}>
          <legend className="px-1 text-sm font-semibold text-text-primary">Appearance</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {[
              ['system', 'Match my device'],
              ['light', 'Light'],
              ['dark', 'Dark'],
            ].map(([id, label]) => (
              <label key={id} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm touch:min-h-[44px] focus-within:ring-2 focus-within:ring-brand-accent ${settings.theme === id ? 'border-brand-primary bg-brand-primary text-surface-card' : 'border-text-muted/30 text-text-primary'}`}>
                <input type="radio" name="theme" className="sr-only" checked={settings.theme === id} onChange={() => set({ theme: id })} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={`${card} p-4`}>
          <legend className="px-1 text-sm font-semibold text-text-primary">Accessibility</legend>
          <Choice
            name="textSize"
            legend="Text size"
            options={[['default', 'Default'], ['large', 'Large'], ['larger', 'Larger']]}
            value={settings.textSize}
            onChange={(id) => set({ textSize: id })}
          />
          <Choice
            name="lineSpacing"
            legend="Text spacing"
            hint="Wider spacing between lines, letters and words can make text easier to read."
            options={[['default', 'Default'], ['wide', 'Wider']]}
            value={settings.lineSpacing}
            onChange={(id) => set({ lineSpacing: id })}
          />
          <Choice
            name="motion"
            legend="Motion and confetti"
            hint="Match my device follows your device's reduced-motion setting."
            options={[['system', 'Match my device'], ['reduce', 'Reduce motion'], ['allow', 'Always show']]}
            value={settings.motion}
            onChange={(id) => set({ motion: id })}
          />
          <button type="button" className={`${btnGhost} mt-4`} onClick={() => set(A11Y_DEFAULTS)} disabled={!a11yChanged}>
            <Icon name="restore" size={14} />
            Reset accessibility settings
          </button>
        </fieldset>

        <fieldset className={`${card} p-4`}>
          <legend className="px-1 text-sm font-semibold text-text-primary">Celebration</legend>
          <label className="flex items-center gap-3 text-sm text-text-primary touch:min-h-[44px]">
            <input type="checkbox" checked={settings.sound} onChange={(e) => set({ sound: e.target.checked })} className="h-4 w-4 accent-brand-primary touch:h-6 touch:w-6" />
            Play a short sound when a task is done
          </label>
          <p className="mt-1 text-xs text-text-muted">Sound is off by default. Confetti follows the Motion setting above.</p>
        </fieldset>

        <fieldset className={`${card} p-4`}>
          <legend className="px-1 text-sm font-semibold text-text-primary">Archive</legend>
          <label htmlFor="s-days" className="text-sm text-text-primary">Archive done tasks automatically after</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id="s-days"
              type="number"
              min="0"
              max="365"
              value={settings.autoArchiveDays}
              onChange={(e) => set({ autoArchiveDays: Math.max(0, Math.min(365, Number(e.target.value) || 0)) })}
              aria-describedby="s-days-hint"
              className={`${field} mt-0 w-24`}
            />
            <span className="text-sm text-text-primary">days</span>
          </div>
          <p id="s-days-hint" className="mt-1 text-xs text-text-muted">Set to 0 to turn automatic archiving off.</p>
        </fieldset>

        <fieldset className={`${card} p-4`}>
          <legend className="px-1 text-sm font-semibold text-text-primary">Data</legend>
          <p className="text-sm text-text-primary">Your data is saved in this browser only.</p>
          {confirm ? (
            <div role="alert" className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm text-text-primary">Replace everything with the sample data?</span>
              <button type="button" className={btnDanger} onClick={() => { onReset(); setConfirm(false); }}>Yes, reset</button>
              <button type="button" className={btnGhost} onClick={() => setConfirm(false)}>Keep my data</button>
            </div>
          ) : (
            <button type="button" className={`${btnGhost} mt-2`} onClick={() => setConfirm(true)}>
              <Icon name="restore" size={14} />
              Reset to sample data
            </button>
          )}
        </fieldset>
      </div>
    </div>
  );
}
